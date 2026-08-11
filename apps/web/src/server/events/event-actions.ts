"use server";

import { revalidatePath } from "next/cache";
import type {
  AdminEvent,
  EventActionState,
  ExternalMovie,
  MovieSearchResult,
} from "@/features/events/event.types";
import {
  backendRequest,
  BackendRequestError,
} from "@/server/backend-client";
import { getSessionToken } from "@/server/auth/session";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 5 * 1024 * 1024;

export async function searchExternalMoviesAction(
  query: string,
): Promise<MovieSearchResult> {
  const normalized = query.trim();

  if (normalized.length < 2) {
    return { movies: [], error: "Digite pelo menos dois caracteres." };
  }

  const token = await getSessionToken();

  if (!token) {
    return { movies: [], error: "Sua sessão expirou. Entre novamente." };
  }

  try {
    const movies = await backendRequest<ExternalMovie[]>(
      `/external-catalog/movies?query=${encodeURIComponent(normalized)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return { movies };
  } catch (error) {
    return {
      movies: [],
      error:
        error instanceof BackendRequestError
          ? error.message
          : "Não foi possível buscar o catálogo agora.",
    };
  }
}

export async function createEventAction(
  _state: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const cover = formData.get("cover");
  const externalId = field(formData, "externalId");
  const startsAt = field(formData, "startsAt");
  const capacity = positiveInteger(field(formData, "capacity"));
  const priceInCents = priceToCents(field(formData, "price"));

  if (!externalId) {
    return { status: "error", message: "Selecione um filme do catálogo." };
  }

  if (!startsAt || !Number.isFinite(new Date(startsAt).getTime())) {
    return { status: "error", message: "Informe uma data e hora válidas." };
  }

  if (!capacity || !priceInCents) {
    return {
      status: "error",
      message: "Capacidade e preço precisam ser maiores que zero.",
    };
  }

  if (!(cover instanceof File) || cover.size === 0) {
    return { status: "error", message: "Envie uma imagem de capa." };
  }

  if (!allowedImageTypes.has(cover.type) || cover.size > maxImageBytes) {
    return {
      status: "error",
      message: "A capa deve ser JPEG, PNG ou WebP e ter no máximo 5 MiB.",
    };
  }

  const token = await getSessionToken();

  if (!token) {
    return { status: "error", message: "Sua sessão expirou. Entre novamente." };
  }

  const body = new FormData();
  body.set("externalId", externalId);
  body.set("startsAt", startsAt);
  body.set("venue", field(formData, "venue"));
  body.set("city", field(formData, "city"));
  body.set("capacity", String(capacity));
  body.set("priceInCents", String(priceInCents));
  body.set("cover", cover);

  try {
    await backendRequest<AdminEvent>("/events", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
  } catch (error) {
    return {
      status: "error",
      code: error instanceof BackendRequestError ? error.code : undefined,
      message:
        error instanceof BackendRequestError
          ? error.message
          : "Não foi possível criar o evento.",
    };
  }

  revalidatePath("/admin/eventos");
  revalidatePath("/");
  revalidatePath("/search");
  return { status: "success" };
}

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function positiveInteger(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function priceToCents(value: string): number | null {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : null;
}
