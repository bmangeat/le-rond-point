/**
 * Loader plein écran affiché pendant le chargement initial de l'app.
 * Calé exactement sur les splash screens iOS (même logo SVG, même fond,
 * logo centré couvrant ~55% de la largeur) pour une transition sans rupture.
 */
export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt="Chargement…"
        aria-hidden="true"
        className="w-[55vw] max-w-[320px] aspect-square animate-pulse"
      />
    </div>
  );
}
