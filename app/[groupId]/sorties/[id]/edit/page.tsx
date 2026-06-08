import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroupAccess } from "@/lib/group";
import { EditEventClient } from "./EditEventClient";

export default async function EditEventPage({ params }: { params: { groupId: string; id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");
  const me = await requireGroupAccess(params.groupId);

  const event = await db.event.findUnique({ where: { id: params.id } });
  if (!event || event.groupId !== params.groupId) notFound();

  const isAdmin = me.role === "ADMIN" || me.role === "SUPER_ADMIN";
  const allowed = event.hostId === session.user.id || isAdmin;
  if (!allowed) redirect(`/${params.groupId}/sorties/${params.id}`);

  return <EditEventClient event={JSON.parse(JSON.stringify(event))} isAdmin={isAdmin} />;
}
