import React, { useState } from "react";
import { MessageSquare, Copy, Check, Terminal, ExternalLink, Play, Lightbulb } from "lucide-react";
import { apiFetch } from "../utils";

export default function LineBotGuide() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [testAction, setTestAction] = useState<"stock" | "exports">("stock");
  const [testSku, setTestSku] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Dynamically resolve full API URL for LINE webhooks based on browser hostname
  const apiBaseUrl = window.location.origin;
  const webhookUrl = `${apiBaseUrl}/api/line-bot`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleTestApi = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      let queryStr = `action=${testAction}`;
      if (testAction === "stock" && testSku) {
        queryStr += `&sku=${encodeURIComponent(testSku)}`;
      }
      const response = await apiFetch(`/api/line-bot?${queryStr}`);
      const data = await response.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ error: e.message });
    } finally {
      setTesting(false);
    }
  };

  // Sample LINE Messsaging Webhook / Google Apps Script LINE integration
  const lineWebhookCode = `// LINE Messaging Bot - Google Apps Script Integration
// Paste this in your Apps Script project or Server config
// Set Webhook link in LINE Developers Console to your Google Web App URL or Express endpoint

var CHANNEL_ACCESS_TOKEN = "YOUR_LINE_CHANNEL_ACCESS_TOKEN";
var WEB_API_URL = "${webhookUrl}"; // Our live endpoint

function doPost(e) {
  var rawData = e.postData.contents;
  var json = JSON.parse(rawData);
  var replyToken = json.events[0].replyToken;
  var userMessage = json.events[0].message.text;

  var responseText = "ขออภัยด้วยค่ะ ฉันไม่พบคำสั่งนี้ กรุณาพิมพ์:\\n- 'เช็คสต๊อก' เพื่อดูจำนวนคงเหลือทั้งหมด\\n- 'เช็คสต๊อกตามด้วยรหัสสินค้า' (เช่น เช็คสต๊อก TSH-001)\\n- 'เช็คขนส่ง' เพื่อดูรายการนำส่งล่าสุด";

  if (userMessage.indexOf("เช็คสต๊อก") !== -1) {
    var skuMatch = userMessage.split("เช็คสต๊อก")[1] ? userMessage.split("เช็คสต๊อก")[1].trim() : "";
    var apiTarget = WEB_API_URL + "?action=stock";
    if (skuMatch) {
      apiTarget += "&sku=" + encodeURIComponent(skuMatch);
    }

    var resp = UrlFetchApp.fetch(apiTarget);
    var data = JSON.parse(resp.getContentText());
    responseText = data.text;
  } 
  else if (userMessage.indexOf("เช็คขนส่ง") !== -1 || userMessage.indexOf("เช็คส่งของ") !== -1) {
    var resp = UrlFetchApp.fetch(WEB_API_URL + "?action=exports");
    var data = JSON.parse(resp.getContentText());
    responseText = data.text;
  }

  replyMessage(replyToken, responseText);
}

function replyMessage(token, text) {
  var url = "https://api.line.me/v2/bot/message/reply";
  var options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    "payload": JSON.stringify({
      "replyToken": token,
      "messages": [{"type": "text", "text": text}]
    })
  };
  UrlFetchApp.fetch(url, options);
}`;

  return (
    <div id="line-bot-guide-panel" className="space-y-6">
      
      {/* 1. Header with description */}
      <div className="flex items-center space-x-2.5">
        <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h2 id="line-guide-title" className="text-xl font-bold text-gray-900 font-sans">คู่มือเชื่อมต่อแชตบอต LINE Bot สต๊อกสินค้า</h2>
          <p className="text-gray-500 text-xs text-shadow-sm">เชื่อมตอบคำถามระดับสินค้าคงเหลือคงคัด และการขนส่งบนห้องแชทได้ตลอด 24 ชั่วโมง</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: API endpoints & Live sandbox tester */}
        <div className="space-y-6">
          
          {/* Webhook info box */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>ปลายทาง API เส้นทางสำหรับ LINE Bot Webhook</span>
            </h3>

            <p className="text-xs text-gray-500 leading-relaxed text-left">
              คัดลอกลิงก์ Webhook Endpoint ของระบบ เพื่อนำไปใช้ต่อท่อข้อมูลกับ Google Apps Script หรือ LINE Developers Webhook Console:
            </p>

            {/* Input display with copy button */}
            <div id="webhook-api-link-display" className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
              <span className="font-mono text-xs text-slate-700 truncate mr-3 select-all">
                {webhookUrl}
              </span>
              <button
                id="btn-copy-webhook-url"
                onClick={() => copyToClipboard(webhookUrl, "webhook")}
                className="p-1 px-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shrink-0"
              >
                {copiedUrl === "webhook" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Copy!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>คัดลอก URL</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-gray-400 space-y-1 block md:flex gap-4">
              <div><b>GET ?action=stock</b> - ดึงข้อมูลสินค้าคงเหลือทั้งหมด</div>
              <div className="mt-1 md:mt-0"><b>GET ?action=exports</b> - เช็คสถานะการจัดส่ง 5 ออเดอร์</div>
            </div>
          </div>

          {/* Interactive Live API Test Sandbox */}
          <div id="line-api-tester-card" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-blue-600" />
              <span>ทดลองส่งคำสั่งจำลองเรียกสอบถามบอต (LINE API Live Tester)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-500 font-bold mb-1">เลือกประเภทคำสั่งบอต</label>
                <select
                  id="select-test-action"
                  value={testAction}
                  onChange={(e) => setTestAction(e.target.value as any)}
                  className="w-full p-2 border border-value-200 rounded-lg bg-white outline-none"
                >
                  <option value="stock">เช็คสต๊อกทั้งหมด / เช็ค SKU</option>
                  <option value="exports">เช็คสถานะการจัดส่ง 5 ออเดอร์ล่าสุด</option>
                </select>
              </div>

              {testAction === "stock" && (
                <div>
                  <label className="block text-gray-500 font-bold mb-1">รหัสสินค้า SKU (กำหนดเพื่อสอบรายตัว)</label>
                  <input
                    id="input-test-sku"
                    type="text"
                    value={testSku}
                    onChange={(e) => setTestSku(e.target.value)}
                    placeholder="เช่น TSH-001 (เว้นได้เพื่อเช็คทั้งหมด)"
                    className="w-full p-2 border border-value-200 rounded-lg outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <button
                id="btn-run-api-test"
                onClick={handleTestApi}
                disabled={testing}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{testing ? "กำลังส่งคำสั่งสอบถามเบื้องหลัง..." : "ส่งคำขอดึงคำรายงานแบบบอต (Send Test Request]"}</span>
              </button>
            </div>

            {testResult && (
              <div id="api-test-terminal-result" className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-left">
                <span className="block text-[10px] text-gray-400 mb-2 py-0.5 border-b border-slate-800">&gt; JSON Response Payload:</span>
                <pre className="text-emerald-400 overflow-x-auto max-h-[160px] leading-tight select-all">
                  {testResult.text ? `[ข้อความตอบกลับบอตในห้องแชท]: \n\n${testResult.text}` : JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Copy-paste instructions and LINE Apps Script */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>ซอร์สโค้ดฝั่ง Google Apps Script เชื่อมต่อ LINE Developers Bot</span>
          </h3>

          <p className="text-xs text-gray-500 leading-relaxed">
            คัดลอกไฟล์ Apps Script ด้านล่างไปสร้าง Deployment ใหม่ใน Google Sheets ชิ้นเดียวกับฐานข้อมูล เพื่อเชื่อม LINE Bot ให้สามารถทําหน้าที่แทนคลังดึงผลลัพธ์ผ่าน API เรียลไทม์:
          </p>

          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-3 h-[250px] overflow-hidden group">
            <pre className="text-[10px] text-emerald-400 font-mono overflow-y-auto h-full text-left leading-normal pr-5 no-scrollbar">
              {lineWebhookCode}
            </pre>
            <button
              id="btn-copy-line-script"
              onClick={() => copyToClipboard(lineWebhookCode, "line_script")}
              className="absolute top-2 right-2 p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-gray-300 transition-colors cursor-pointer"
            >
              {copiedUrl === "line_script" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-indigo-900 text-[11px] leading-relaxed block pl-4">
            <h5 className="font-bold mb-1">💡 คำแนะนำความปลอดภัย:</h5>
            อย่ากังวลเรื่องการซิงก์ข้อมูล! รหัสผ่านสคริปต์จะใช้ระบบ HTTPS คุยกันผ่าน Token-Bearer เท่านั้น ช่วยป้องกันสินค้าสต๊อกหลักไม่ให้รั่วไหล
          </div>
        </div>

      </div>
    </div>
  );
}
