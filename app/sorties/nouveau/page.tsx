import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateEventClient } from "./CreateEventClient";

export default async function NouvelleSortiePage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <CreateEventClient />;
}
