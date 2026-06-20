import type { Context } from "hono";
import {
  recordRagFeedback,
  createCaregiverInvite,
  acceptCaregiverInvite,
  getSharedProgress,
  listCaregiverLinks,
  getUserTier,
} from "@repo/learning-engine";

export async function postRagFeedback(c: Context): Promise<Response> {
  const body = await c.req.json<{
    userId?: string;
    query: string;
    helpful: boolean;
    traceId?: string;
    stateCode?: string;
  }>();

  if (!body.query || body.helpful === undefined) {
    return c.json({ error: "query and helpful required" }, 400);
  }

  await recordRagFeedback(body);
  return c.json({ ok: true });
}

export async function createInvite(c: Context): Promise<Response> {
  const { learnerUserId } = await c.req.json<{ learnerUserId: string }>();
  if (!learnerUserId) return c.json({ error: "learnerUserId required" }, 400);

  try {
    const link = await createCaregiverInvite(learnerUserId);
    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
    return c.json({
      token: link.inviteToken,
      expiresAt: link.expiresAt,
      shareUrl: `${webUrl}/family/view/${link.inviteToken}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invite failed";
    return c.json({ error: message }, 400);
  }
}

export async function acceptInvite(c: Context): Promise<Response> {
  const { token, caregiverUserId } = await c.req.json<{
    token: string;
    caregiverUserId: string;
  }>();
  if (!token || !caregiverUserId) {
    return c.json({ error: "token and caregiverUserId required" }, 400);
  }

  try {
    const link = await acceptCaregiverInvite(token, caregiverUserId);
    return c.json({ ok: true, link });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Accept failed";
    return c.json({ error: message }, 400);
  }
}

export async function sharedProgress(c: Context): Promise<Response> {
  const token = c.req.param("token");
  if (!token) return c.json({ error: "token required" }, 400);

  try {
    const data = await getSharedProgress(token);
    return c.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not found";
    return c.json({ error: message }, 404);
  }
}

export async function familyLinks(c: Context): Promise<Response> {
  const userId = c.req.param("userId");
  if (!userId) return c.json({ error: "userId required" }, 400);

  const { tier } = await getUserTier(userId);
  if (tier !== "family" && tier !== "school") {
    return c.json({ error: "Family tier required" }, 403);
  }

  const links = await listCaregiverLinks(userId);
  return c.json({ links });
}
