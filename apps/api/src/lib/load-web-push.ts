export type WebPush = Pick<
  typeof import("web-push"),
  "setVapidDetails" | "sendNotification"
>;

/** Load web-push under Node ESM — CJS named exports appear on `.default`. */
export async function loadWebPush(): Promise<WebPush> {
  const mod = await import("web-push");
  const webpush = (mod.default ?? mod) as WebPush;
  if (typeof webpush.setVapidDetails !== "function") {
    throw new Error("web-push exports unavailable");
  }
  return webpush;
}
