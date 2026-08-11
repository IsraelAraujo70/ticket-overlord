import "server-only";

export interface BackendErrorBody {
  code?: string;
  message?: string | string[];
}

export class BackendRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

export function backendBaseUrl(): string {
  return (process.env.API_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

export async function backendRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${backendBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new BackendRequestError(
      503,
      "API_UNAVAILABLE",
      "Não foi possível acessar o serviço. Tente novamente.",
    );
  }

  if (!response.ok) {
    let error: BackendErrorBody = {};

    try {
      error = (await response.json()) as BackendErrorBody;
    } catch {
      // The stable fallback below is used for non-JSON upstream failures.
    }

    const message = Array.isArray(error.message)
      ? error.message[0]
      : error.message;
    throw new BackendRequestError(
      response.status,
      error.code,
      message ?? "Não foi possível concluir a solicitação.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
