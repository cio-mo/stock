/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Universal fetch wrapper to safety handle session header injection
 * without overriding read-only window.fetch property in sandbox iframes.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  
  if (url.startsWith("/api/")) {
    const username = localStorage.getItem("session_username");
    if (username) {
      init = init || {};
      const headers = new Headers(init.headers);
      if (!headers.has("x-session-username")) {
        headers.set("x-session-username", username);
      }
      init.headers = headers;
    }
  }
  
  return fetch(input, init);
}
