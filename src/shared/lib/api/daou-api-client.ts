import {
  INVALID_TOKEN_CODE,
  INVALID_TOKEN_MESSAGE,
} from "@/shared/constants/api-errors";

type ApiError = {
  ok: false;
  error: string;
  status?: number;
  code?: string;
};

export type BinaryApiResult =
  | {
      ok: true;
      data: Uint8Array;
      contentType: string;
      contentDisposition: string | null;
      fetchMode: "background" | "page";
    }
  | ApiError;

export type JsonApiResult<T> =
  | {
      ok: true;
      body: T;
      status: number;
      fetchMode: "background" | "page";
    }
  | ApiError;

type HttpMethod = "GET" | "POST";

export async function requestBinaryApi(url: string): Promise<BinaryApiResult> {
  return await requestBinaryByBackground(url);
}

export async function requestJsonApi<T>(
  url: string,
  method: HttpMethod = "GET"
): Promise<JsonApiResult<T>> {
  return await requestJsonByBackground<T>(url, method);
}

async function requestBinaryByBackground(
  url: string
): Promise<BinaryApiResult> {
  let response: Response;
  try {
    response = await fetch(url, { method: "GET", credentials: "include" });
  } catch {
    return {
      ok: false,
      error: "Failed to call API from extension background.",
    };
  }

  if (!response.ok) {
    const invalidToken = await parseInvalidTokenFromResponse(response);
    if (invalidToken) {
      return invalidToken;
    }
    return {
      ok: false,
      status: response.status,
      error: `Background request failed (${response.status})`,
    };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("application/json")) {
    const invalidToken = await parseInvalidTokenFromResponse(response);
    if (invalidToken) {
      return invalidToken;
    }
    return {
      ok: false,
      status: response.status,
      error: "Unexpected JSON response from binary API.",
    };
  }

  return {
    ok: true,
    data: new Uint8Array(await response.arrayBuffer()),
    contentType,
    contentDisposition: response.headers.get("content-disposition"),
    fetchMode: "background",
  };
}

async function requestJsonByBackground<T>(
  url: string,
  method: HttpMethod
): Promise<JsonApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, { method, credentials: "include" });
  } catch {
    return {
      ok: false,
      error: "Failed to call API from extension background.",
    };
  }

  if (!response.ok) {
    const invalidToken = await parseInvalidTokenFromResponse(response);
    if (invalidToken) {
      return invalidToken;
    }
    return {
      ok: false,
      status: response.status,
      error: `Background request failed (${response.status})`,
    };
  }

  try {
    const body = (await response.json()) as T;
    if (isInvalidTokenPayload(body)) {
      return {
        ok: false,
        status: response.status,
        code: INVALID_TOKEN_CODE,
        error: INVALID_TOKEN_MESSAGE,
      };
    }
    return {
      ok: true,
      body,
      status: response.status,
      fetchMode: "background",
    };
  } catch {
    return {
      ok: false,
      status: response.status,
      error: "API returned invalid JSON.",
    };
  }
}

async function parseInvalidTokenFromResponse(
  response: Response
): Promise<ApiError | null> {
  const body = await response
    .clone()
    .json()
    .catch(() => null);
  if (!isInvalidTokenPayload(body)) {
    return null;
  }

  return {
    ok: false,
    status: response.status,
    code: INVALID_TOKEN_CODE,
    error: INVALID_TOKEN_MESSAGE,
  };
}

function isInvalidTokenPayload(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  const code = (body as { code?: unknown }).code;
  const message = (body as { message?: unknown }).message;
  return code === INVALID_TOKEN_CODE && message === INVALID_TOKEN_MESSAGE;
}
