/**
 * Chuẩn hóa văn bản trước khi đọc TTS tiếng Việt —
 * tránh giọng Việt đọc sai từ tiếng Anh (WA, mph, DMV, …).
 */
export function preprocessForVietnameseTts(raw: string): string {
  let text = raw
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

  // Bỏ phần tiếng Anh trong ngoặc khi đã có tiếng Việt phía trước
  text = text.replace(/\s*\([A-Za-z0-9\s\-./'°]+(?:mph|ft|road|zone|way|turn|stop|merge|enter)[^)]*\)/gi, "");

  const rules: Array<[RegExp, string]> = [
    [/Washington State/gi, "bang Wô-shing-tơn"],
    [/Wô-shing-tơn State/gi, "bang Wô-shing-tơn"],
    [/\bbang\s+WA\b/gi, "bang Washington"],
    [/\bWA\b/g, "bang Washington"],
    [/\bDMV\b/g, "cơ quan đăng ký xe"],
    [/\bmph\b/gi, "dặm một giờ"],
    [/\b(\d+)\s*dặm\/giờ\b/gi, "$1 dặm một giờ"],
    [/\bfeet\b/gi, "feet"],
    [/\bft\b/gi, "feet"],
    [/\bU-turn\b/gi, "quay đầu xe"],
    [/\bRCW\b/g, "điều luật bang"],
    [/\bONE WAY\b/gi, "một chiều"],
    [/\bDO NOT ENTER\b/gi, "cấm đi vào"],
    [/\bNO U-TURN\b/gi, "cấm quay đầu"],
    [/\bMERGE\b/gi, "hòa nhập làn"],
    [/\bSTOP\b/g, "dừng lại"],
    [/\bRR\b/g, "đường sắt"],
    [/\binterstate\b/gi, "xa lộ liên bang"],
    [/\bcounty road\b/gi, "đường quận"],
    [/\bwork zone\b/gi, "khu thi công"],
    [/\bschool zone\b/gi, "khu trường học"],
    [/\bshoulder\b/gi, "lề đường khẩn cấp"],
    [/\bcrosswalk\b/gi, "vạch qua đường"],
    [/\bdouble fines\b/gi, "phạt gấp đôi"],
    [/\bT-intersection\b/gi, "ngã ba chữ T"],
    [/\bdead-end\b/gi, "đường cụt"],
    [/\bGoogle\b/gi, "Gu-gồ"],
    [/\bPro\b/g, "gói Pro"],
  ];

  for (const [pattern, replacement] of rules) {
    text = text.replace(pattern, replacement);
  }

  return text.replace(/\s{2,}/g, " ").trim();
}
