/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sanitizes and extracts the base domain (origin) from any input URL.
 * Handles messy inputs, trailing routes, etc., preventing invalid JSON formatting issues.
 */
export function sanitizeBackendUrl(url: string): string {
  if (!url) return "";
  let clean = url.trim();
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }
  try {
    const parsed = new URL(clean);
    return parsed.origin; // Returns "https://domain.com" cleanly
  } catch (e) {
    if (clean.endsWith("/")) {
      clean = clean.slice(0, -1);
    }
    return clean;
  }
}

// ⚡ Dynamic Auto-Connection Hook: Parse backend URL parameters on load
if (typeof window !== "undefined") {
  try {
    const params = new URLSearchParams(window.location.search);
    const autoUrl = params.get("api") || params.get("backend") || params.get("backend_url") || params.get("server");
    if (autoUrl) {
      const cleanUrl = sanitizeBackendUrl(autoUrl);
      if (cleanUrl) {
        localStorage.setItem("backend_api_url", cleanUrl);
        console.log("⚡ [PRO AUTO-CONNECT] Configured endpoint target to:", cleanUrl);
        
        // Remove config parameters to keep url address bar clean
        params.delete("api");
        params.delete("backend");
        params.delete("backend_url");
        params.delete("server");
        const cleanSearch = params.toString();
        const newUrl = window.location.pathname + (cleanSearch ? "?" + cleanSearch : "") + window.location.hash;
        window.history.replaceState({}, "", newUrl);
        
        // Trigger a simple reload to apply newly registered URL cleanly
        window.location.reload();
      }
    }
  } catch (err) {
    console.error("Auto detect query URL parsing errored", err);
  }
}

/**
 * Universal fetch wrapper to safely handle session header injection and
 * dynamic routing of backend requests when hosted on static services like Vercel.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  
  if (url.startsWith("/api/")) {
    const backendUrl = localStorage.getItem("backend_api_url") || "";
    if (backendUrl) {
      const cleanBackend = sanitizeBackendUrl(backendUrl);
      url = cleanBackend + url;
    }
    
    init = init || {};
    const headers = new Headers(init.headers);
    const username = localStorage.getItem("session_username");
    if (username) {
      if (!headers.has("x-session-username")) {
        headers.set("x-session-username", username);
      }
    }
    init.headers = headers;

    // Enable credentials (cookies) sharing when accessing a cross-domain backend
    if (backendUrl) {
      init.credentials = "include";
    }
  }
  
  let res;
  try {
    res = await fetch(url, init);
  } catch (networkError: any) {
    // Gracefully capture offline/DNS failure
    throw new Error(
      `ไม่สามารถเชื่อมต่อกับเครื่องแม่ข่าย API ได้ กรุณาเชื่อมอินเทอร์เน็ตหรือตรวจสอบว่าเซิร์ฟเวอร์ปลายทางเปิดทำงานถูกต้องอยู่หรือไม่ (${networkError.message})`
    );
  }
  
  // Custom interceptor on the json() parser to trap static host HTML 450/404 errors
  const originalJson = res.json.bind(res);
  res.json = async () => {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      throw new Error(
        "ไม่พบช่องทาง API ในระบบโฮสติ้งนี้ (ได้ผลลัพธ์เป็นหน้าเว็บ HTML กลับมา) กรุณาตรวจสอบหรือทำการตั้งค่า 'Cloud Run API Base URL' ปลายทางให้เชื่อมหลังบ้าน"
      );
    }
    
    // Safely clone the response before pulling text so we don't block other streams
    const clone = res.clone();
    const text = await clone.text();
    try {
      return JSON.parse(text);
    } catch (err: any) {
      if (text.includes("<!DOCTYPE") || text.includes("<html") || text.includes("The page could not") || text.includes("The page cannot") || text.includes("Not Found")) {
        throw new Error(
          "เซิร์ฟเวอร์ตอบกลับเป็นหน้าเว็บ HTML (เชื่อมต่อระบบหลังบ้านไม่ได้) กรุณาระบุหรือตรวจสอบ 'Cloud Run API Server URL' ของคุณ"
        );
      }
      throw new Error(`รูปแบบข้อมูลผิดพลาด (JSON Parse Error): ${err.message}`);
    }
  };
  
  return res;
}
