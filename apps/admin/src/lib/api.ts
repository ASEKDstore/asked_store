const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, headers = {}, ...restOptions } = options;

  // Get token from localStorage (only in browser)
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("admin_token");
  }

  const fetchHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Copy headers from options
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      fetchHeaders[key] = value;
    });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      fetchHeaders[key] = value;
    });
  } else if (headers) {
    Object.assign(fetchHeaders, headers);
  }

  if (token) {
    fetchHeaders["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...restOptions,
    headers: fetchHeaders,
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
  
  // Добавляем таймаут для запросов
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Превышено время ожидания ответа от сервера');
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Не удалось подключиться к API серверу. Убедитесь, что сервер запущен на ' + API_URL);
    }
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

