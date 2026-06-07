import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EditEventClient } from "./EditEventClient";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [event, me] = await Promise.all([
    db.event.findUnique({ where: { id: params.id } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
  ]);
  if (!event) notFound();

  const isAdmin = me?.role === "ADMIN";
  const allowed = event.hostId === session.user.id || isAdmin;
  if (!allowed) redirect(`/sorties/${params.id}`);

  return <EditEventClient event={JSON.parse(JSON.stringify(event))} isAdmin={isAdmin} />;
}
