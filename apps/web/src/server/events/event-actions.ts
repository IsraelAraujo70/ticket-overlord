"use server";

import { revalidatePath, updateTag } from "next/cache";
import type {
  AdminEvent,
  EventActionState,
  ExternalMovie,
  MovieSearchResult,
} from "@/features/events/event.types";
import { backendRequest, BackendRequestError } from "@/server/backend-client";
import { getSessionToken } from "@/server/auth/session";
import { PUBLISHED_EVENTS_CACHE_TAG } from "@/server/events/event-cache";

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
  const category = field(formData, "category").trim();
  const externalId = field(formData, "externalId");
  const title = field(formData, "title").trim();
  const summary = field(formData, "summary").trim();
  const startsAt = field(formData, "startsAt");
  const capacity = positiveInteger(field(formData, "capacity"));
  const priceInCents = priceToCents(field(formData, "price"));

  if (!category) {
    return { status: "error", message: "Selecione uma categoria." };
  }

  if (category === "Cinema" && !externalId) {
    return { status: "error", message: "Selecione um filme do catálogo." };
  }

  if (category !== "Cinema" && (!title || !summary)) {
    return {
      status: "error",
      message: "Informe o título e a descrição do evento.",
    };
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
  body.set("category", category);
  if (externalId) body.set("externalId", externalId);
  if (title) body.set("title", title);
  if (summary) body.set("summary", summary);
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

export async function publishEventAction(
  _state: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const eventId = field(formData, "eventId");

  if (!eventId) {
    return { status: "error", message: "Evento inválido." };
  }

  const token = await getSessionToken();

  if (!token) {
    return { status: "error", message: "Sua sessão expirou. Entre novamente." };
  }

  try {
    await backendRequest<AdminEvent>(
      `/events/${encodeURIComponent(eventId)}/publish`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  } catch (error) {
    return {
      status: "error",
      code: error instanceof BackendRequestError ? error.code : undefined,
      message:
        error instanceof BackendRequestError
          ? error.message
          : "Não foi possível publicar o evento.",
    };
  }

  revalidatePath("/admin/eventos");
  updateTag(PUBLISHED_EVENTS_CACHE_TAG);
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
  return Number.isFinite(parsed) && parsed > 0
    ? Math.round(parsed * 100)
    : null;
}
