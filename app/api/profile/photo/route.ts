import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// POST /api/profile/photo — génère un token d'upload Vercel Blob pour la photo de profil.
// L'upload se fait en direct depuis le navigateur vers Blob (pas de passage par la
// fonction serverless, donc pas de limite de 4.5 Mo). Le client met ensuite à jour
// son image via PATCH /api/profile une fois l'URL obtenue.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (!session) throw new Error("Non autorisé");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async () => {
        // Rien ici : la persistance de l'URL se fait côté client via PATCH /api/profile
        // (ce callback n'est pas appelé en local faute d'URL publique).
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
