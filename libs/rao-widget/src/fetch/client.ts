import type { INucliaApiError } from '../interfaces';

export interface NucliaFetchConfig {
  /** Base HTTP(s) endpoint, e.g. https://rag.progress.cloud/api */
  baseUrl: string;
  /** Optional API key used for authenticated calls. */
  apiKey?: string;
  /** Optional additional headers applied to every request. */
  headers?: Record<string, string>;
}

export type NucliaFetchMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface NucliaRequestOptions<TBody = unknown> {
  method?: NucliaFetchMethod;
  searchParams?: Record<string, string | number | boolean | undefined>;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface NucliaFetcher {
  request: <TResponse = unknown, TBody = unknown>(
    path: string,
    options?: NucliaRequestOptions<TBody>,
  ) => Promise<TResponse>;
  get: <TResponse = unknown>(
    path: string,
    options?: Omit<NucliaRequestOptions, 'method' | 'body'>,
  ) => Promise<TResponse>;
  post: <TResponse = unknown, TBody = unknown>(
    path: string,
    options?: Omit<NucliaRequestOptions<TBody>, 'method'>,
  ) => Promise<TResponse>;
}

const buildUrl = (baseUrl: string, path: string, searchParams?: NucliaRequestOptions['searchParams']) => {
  const url = new URL(path, baseUrl);
  if (searchParams) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
    url.search = params.toString();
  }
  return url;
};

const normalizeError = async (response: Response): Promise<INucliaApiError> => {
  let detail: string | undefined;
  try {
    const payload = await response.json();
    if (payload && typeof payload === 'object') {
      detail = 'detail' in payload ? String(payload.detail) : JSON.stringify(payload);
    }
  } catch (error) {
    detail = (error as Error).message;
  }
  return {
    status: response.status,
    detail,
  };
};

export const createNucliaFetcher = (config: NucliaFetchConfig): NucliaFetcher => {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  if (config.apiKey) {
    defaultHeaders.Authorization = `Bearer ${config.apiKey}`;
  }

  const request = async <TResponse = unknown, TBody = unknown>(
    path: string,
    options?: NucliaRequestOptions<TBody>,
  ): Promise<TResponse> => {
    const { method = 'GET', body, headers, searchParams, signal } = options ?? {};
    const url = buildUrl(config.baseUrl, path, searchParams);

    const response = await fetch(url, {
      method,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    if (!response.ok) {
      const error = await normalizeError(response);
      const errorInstance = new Error(error.detail ?? 'Nuclia request failed');
      (errorInstance as Error & { status?: number }).status = error.status;
      throw errorInstance;
    }

    if (response.status === 204) {
      return undefined as unknown as TResponse;
    }

    return (await response.json()) as TResponse;
  };

  return {
    request,
    get: <TResponse = unknown>(path: string, options?: Omit<NucliaRequestOptions, 'method' | 'body'>) =>
      request<TResponse>(path, { ...options, method: 'GET' }),
    post: <TResponse = unknown, TBody = unknown>(path: string, options?: Omit<NucliaRequestOptions<TBody>, 'method'>) =>
      request<TResponse, TBody>(path, { ...options, method: 'POST' }),
  };
};
