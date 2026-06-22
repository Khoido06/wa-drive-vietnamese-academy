declare module "web-push" {
  export interface PushSubscription {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }
  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  export function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer,
    options?: Record<string, unknown>,
  ): Promise<void>;

  /** Present when dynamically imported from an ESM package (Node CJS interop). */
  const defaultExport: {
    setVapidDetails: typeof setVapidDetails;
    sendNotification: typeof sendNotification;
  };
  export default defaultExport;
}
