import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadWebPush } from "./load-web-push.js";

describe("loadWebPush", () => {
  it("returns setVapidDetails and sendNotification from dynamic ESM import", async () => {
    const webpush = await loadWebPush();
    assert.equal(typeof webpush.setVapidDetails, "function");
    assert.equal(typeof webpush.sendNotification, "function");
  });
});
