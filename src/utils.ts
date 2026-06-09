/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Universal fetch wrapper to safely handle session header injection and
 * dynamic routing of backend requests when hosted on static services like Vercel.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  
  if (url.startsWith("/api/")) {
    const backendUrl = localStorage.getItem("backend_api_url") || "";
    if (backendUrl) {
      // Remove trailing slash if present
      const cleanBackend = backendUrl.endsWith("/") ? backendUrl.slice(0, -1) : backendUrl;
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
  
  const res = await fetch(url, init);
  
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
