import { issueSignedToken } from "@vercel/blob";
import { type HandleUploadPresignedBody, handleUploadPresigned } from "@vercel/blob/client";
import { CLIP_MAX, MARKET_MAX, MARKET_TYPES, VIDEO_TYPES } from "@/lib/blob";
import { userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hands the browser a presigned upload URL for one file, so the video goes straight from the
 *  player's machine into the private Blob store in parallel chunks. Signed-in users only, and
 *  only into their own folder: clips/<uid>/… (contest clips, < 600 MB) or market/<uid>/…
 *  (Clip Market files, up to 5 GB). Size and type are enforced by Blob itself. */
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadPresignedBody;
  try {
    const json = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname) => {
        const me = await userFromRequest(req);
        if (!me) throw new Error("NOT_AUTHORIZED");
        const kind = pathname.startsWith(`clips/${me.id}/`) ? "clip" : pathname.startsWith(`market/${me.id}/`) ? "market" : null;
        if (!kind || pathname.includes("..")) throw new Error("NOT_AUTHORIZED");
        const types = kind === "clip" ? VIDEO_TYPES : MARKET_TYPES;
        const max = kind === "clip" ? CLIP_MAX : MARKET_MAX;
        const token = await issueSignedToken({
          pathname, operations: ["put"], allowedContentTypes: types, maximumSizeInBytes: max,
          validUntil: Date.now() + 4 * 3600 * 1000,
        });
        return {
          token,
          urlOptions: {
            allowedContentTypes: types, maximumSizeInBytes: max,
            validUntil: Date.now() + 4 * 3600 * 1000,
            addRandomSuffix: false,
            // A market seller can replace the file on a draft listing; contest clips never overwrite.
            allowOverwrite: kind === "market",
            cacheControlMaxAge: 30 * 24 * 3600,
          },
        };
      },
    });
    return Response.json(json);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return Response.json({ error: m === "NOT_AUTHORIZED" ? "Sign in first." : m }, { status: m === "NOT_AUTHORIZED" ? 401 : 400 });
  }
}
