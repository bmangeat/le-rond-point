import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getCurrentUser, canAccessGroup } from "@/lib/group";

// GET /api/events/:id/photos/zip — télécharge toutes les photos de la sortie en .zip
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const event = await db.event.findUnique({
    where: { id: params.id },
    select: { name: true, groupId: true, photos: { select: { url: true, createdAt: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!event) return NextResponse.json({ error: "Sortie introuvable" }, { status: 404 });

  const me = await getCurrentUser();
  if (!me || !event.groupId || !canAccessGroup(me, event.groupId)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (event.photos.length === 0) return NextResponse.json({ error: "Aucune photo" }, { status: 404 });

  const zip = new JSZip();
  await Promise.all(
    event.photos.map(async (p, i) => {
      try {
        const res = await fetch(p.url);
        if (!res.ok) return;
        const buf = Buffer.from(await res.arrayBuffer());
        const ext = (p.url.split(".").pop() || "jpg").split("?")[0].slice(0, 4);
        zip.file(`photo-${String(i + 1).padStart(2, "0")}.${ext}`, buf);
      } catch {
        // photo inaccessible : on l'ignore
      }
    })
  );

  const content = await zip.generateAsync({ type: "blob" });
  const slug = event.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "sortie";

  return new Response(content, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}-photos.zip"`,
    },
  });
}
