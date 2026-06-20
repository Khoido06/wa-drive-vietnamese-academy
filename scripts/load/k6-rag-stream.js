import http from "k6/http";
import { check, sleep } from "k6";

const API_URL = __ENV.API_URL || "https://api-production-72db.up.railway.app";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    checks: { rate: ["rate>0.9"] },
  },
};

export default function () {
  const health = http.get(`${API_URL}/health`);
  check(health, { "health ok": (r) => r.status === 200 });

  const ragStatus = http.get(`${API_URL}/rag/status`);
  check(ragStatus, { "rag status ok": (r) => r.status === 200 });

  const streamRes = http.post(
    `${API_URL}/rag/query/stream`,
    JSON.stringify({ query: "Tốc độ tối đa trong khu dân cư?" }),
    { headers: { "Content-Type": "application/json" }, timeout: "30s" },
  );
  check(streamRes, {
    "stream ok": (r) => r.status === 200,
    "has trace": (r) => r.body.includes('"type":"trace"') || r.body.includes("data:"),
  });

  sleep(1);
}
