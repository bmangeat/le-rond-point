import { FullPageLoader } from "@/components/shared/FullPageLoader";

// Affiché par Next.js pendant le chargement de la page d'accueil (RSC fetch).
// Les autres routes conservent leurs skeletons contextuels.
export default function HomeLoading() {
  return <FullPageLoader />;
}
