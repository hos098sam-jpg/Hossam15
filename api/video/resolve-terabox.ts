import axios from "axios";

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const rawUrl = typeof req.query?.url === "string" ? req.query.url.trim() : "";
    let pwd = typeof req.query?.pwd === "string" ? req.query.pwd.trim() : "";

    if (!rawUrl) {
      return res.status(400).json({
        success: false,
        error: "رابط فيديو TeraBox مطلوب للتحويل.",
      });
    }

    if (!pwd) {
      try {
        const parsed = new URL(rawUrl);
        const extractedPwd = parsed.searchParams.get("pwd") || parsed.searchParams.get("password");
        if (extractedPwd) pwd = extractedPwd;
      } catch {}
    }

    let rawGateway = (process.env.TERABOX_GATEWAY_URL || "https://terabox-gateway-vercel-ready.vercel.app").trim();
    let baseGateway = rawGateway
      .replace(/\/+$/, "")
      .replace(/\/(api|docs#?.*|swagger.*)$/i, "");
    if (!baseGateway.startsWith("http")) {
      baseGateway = "https://terabox-gateway-vercel-ready.vercel.app";
    }

    const targetGatewayApi = `${baseGateway}/api?url=${encodeURIComponent(rawUrl)}${
      pwd ? `&pwd=${encodeURIComponent(pwd)}` : ""
    }&resolve=true`;

    const gatewayRes = await axios.get(targetGatewayApi, {
      timeout: 25000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
      validateStatus: () => true,
      responseType: "text",
    });

    const contentType = String(gatewayRes.headers["content-type"] || "").toLowerCase();
    const rawBody = typeof gatewayRes.data === "string" ? gatewayRes.data : String(gatewayRes.data || "");
    const trimmedBody = rawBody.trim();
    const isOk = gatewayRes.status >= 200 && gatewayRes.status < 300;
    const isHtml = contentType.includes("text/html") || trimmedBody.startsWith("<");
    const isJson =
      (contentType.includes("application/json") || contentType.includes("+json")) &&
      (trimmedBody.startsWith("{") || trimmedBody.startsWith("["));

    if (!isOk || !isJson || isHtml) {
      const sanitizedEndpoint = targetGatewayApi.replace(/(pwd=)[^&]+/i, "$1***");
      console.warn(`[TeraBox Vercel Function] Endpoint: ${sanitizedEndpoint}`);
      console.warn(`[TeraBox Vercel Function] HTTP Status: ${gatewayRes.status}`);
      console.warn(`[TeraBox Vercel Function] Content-Type: ${contentType || "none"}`);

      let userMsg = `تعذر تحويل رابط TeraBox (كود HTTP: ${gatewayRes.status}).`;
      if (rawBody.includes("need verify") || rawBody.includes("400141")) {
        userMsg = "يتطلب هذا الرابط التحقق الأمني من TeraBox (Need Verify). يرجى فتح الرابط مباشرة أو التحقق من كلمة المرور.";
      } else if (gatewayRes.status === 500 || rawBody.includes("Internal Server Error")) {
        userMsg = "خادم فك تشفير TeraBox يواجه ضغطاً مؤقتاً. يرجى إعادة المحاولة أو فتح الرابط مباشرة.";
      }

      return res.status(502).json({
        success: false,
        error: userMsg,
        httpStatus: gatewayRes.status,
        requestedUrl: rawUrl,
      });
    }

    let parsedData: any = null;
    try {
      parsedData = JSON.parse(rawBody);
    } catch {
      return res.status(502).json({
        success: false,
        error: `تعذر تحليل استجابة خادم التحويل كـ JSON للرابط: ${rawUrl}`,
        httpStatus: gatewayRes.status,
        requestedUrl: rawUrl,
      });
    }

    // Helper to find URL
    const candidateKeys = [
      "stream_url",
      "streamUrl",
      "streaming_url",
      "direct_url",
      "directUrl",
      "direct_link",
      "download_url",
      "downloadUrl",
      "download_link",
      "original_download_url",
      "dlink",
      "m3u8",
      "url",
    ];

    const findUrl = (obj: any): { url: string; isM3u8: boolean } | null => {
      if (!obj || typeof obj !== "object") return null;
      for (const k of candidateKeys) {
        if (typeof obj[k] === "string" && obj[k].trim().startsWith("http")) {
          const found = obj[k].trim();
          if (!found.includes("/docs") && !found.includes("/swagger")) {
            return {
              url: found,
              isM3u8: /\.m3u8/i.test(found) || k === "m3u8",
            };
          }
        }
      }
      if (Array.isArray(obj)) {
        for (const it of obj) {
          const res = findUrl(it);
          if (res) return res;
        }
      }
      for (const key of ["list", "files", "data", "result"]) {
        if (obj[key]) {
          const res = findUrl(obj[key]);
          if (res) return res;
        }
      }
      return null;
    };

    const extracted = findUrl(parsedData);
    if (!extracted) {
      return res.status(422).json({
        success: false,
        error: `لم يتم العثور على رابط فيديو قابل للتشغيل داخل استجابة TeraBox للرابط: ${rawUrl}`,
        httpStatus: gatewayRes.status,
        requestedUrl: rawUrl,
      });
    }

    return res.status(200).json({
      success: true,
      directUrl: extracted.url,
      streamUrl: extracted.url,
      isM3u8: extracted.isM3u8,
      type: extracted.isM3u8 ? "m3u8" : "mp4",
      sourceUrl: rawUrl,
    });
  } catch (error: any) {
    console.error("[TeraBox Vercel Function Error]:", error?.message);
    return res.status(500).json({
      success: false,
      error: error?.message || "حدث خطأ غير متوقع في معالجة طلب الفيديو.",
    });
  }
}
