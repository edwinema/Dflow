/**
 * Safely fetches JSON from an API endpoint, preventing HTML/doctype parser errors.
 * If the response is not OK, or returns HTML (such as SPA index.html fallback or 502/503 Cloud Run gateway pages),
 * it returns fallbackData instead of throwing SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  fallbackData: T | null = null
): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return fallbackData;
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return fallbackData;
    }
    const text = await res.text();
    if (!text || !text.trim()) {
      return fallbackData;
    }
    const trimmed = text.trim();
    if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype')) {
      return fallbackData;
    }
    return JSON.parse(trimmed) as T;
  } catch {
    return fallbackData;
  }
}
