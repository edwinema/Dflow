// Same-origin API failures must be visible and must not reach optimistic success handlers.
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const response = await originalFetch(input, init);
  const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
  const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
    if (response.status === 401 && !(url.pathname === '/api/session' && method === 'POST')) window.dispatchEvent(new Event('session-expired'));
    if (response.status === 403) {
      let message = '权限不足，请联系管理员确认访问权限';
      try { const body = await response.clone().json(); if (typeof body.info === 'string' && body.info.trim()) message = body.info; } catch { /* HTML/proxy failures use the readable fallback. */ }
      // Run after module catch handlers so generic network toasts cannot replace the server reason.
      setTimeout(() => window.dispatchEvent(new CustomEvent('api-error', {detail: {message, status: 403, path: url.pathname}})), 0);
      const error = Object.assign(new Error(message), {status: 403});
      throw error;
    }
  }
  return response;
};
export {};
