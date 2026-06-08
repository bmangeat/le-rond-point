import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrentUser, canAccessGroup } from "@/lib/group";
import { NextResponse } from "next/server";

// POST /api/events/:id/photo — token d'upload Blob pour une photo de sortie.
// L'upload se fait en direct depuis le navigateur ; le client enregistre ensuite
// l'URL via l'action addPhoto.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (!session) throw new Error("Non autorisé");
        // L'utilisateur doit appartenir au groupe de la sortie
        const [event, me] = await Promise.all([
          db.event.findUnique({ where: { id: params.id }, select: { groupId: true } }),
          getCurrentUser(),
        ]);
        if (!event?.groupId || !me || !canAccessGroup(me, event.groupId)) throw new Error("Accès refusé");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"],
          maximumSizeInBytes: 12 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
