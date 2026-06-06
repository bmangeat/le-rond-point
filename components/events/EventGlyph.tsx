import { eventType } from "@/lib/events";

export function EventGlyph({ type, size = 50, radius = 15 }: { type: string; size?: number; radius?: number }) {
  const ty = eventType(type);
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 leading-none"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: ty.tint,
        fontSize: size * 0.5,
        boxShadow: `inset 0 0 0 1px ${ty.color}2e`,
      }}
    >
      <span>{ty.emoji}</span>
    </div>
  );
}
