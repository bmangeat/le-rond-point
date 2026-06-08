import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { requireGroupAccess } from "@/lib/group";
import { CreateEventClient } from "./CreateEventClient";

export default async function NouvelleSortiePage({ params }: { params: { groupId: string } }) {
  const session = await auth();
  if (!session) redirect("/login");
  await requireGroupAccess(params.groupId);
  return <CreateEventClient />;
}
