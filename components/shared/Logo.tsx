const ORBIT_COLORS = [
  "#3B7BF8",
  "#10B981",
  "#8B5CF6",
  "#F43F5E",
  "#F59E0B",
  "#06B6D4",
  "#F97316",
  "#EC4899",
];

interface LogoProps {
  size?: number;
}

export function Logo({ size = 96 }: LogoProps) {
  const r = size * 0.4;
  const ringWidth = Math.max(3, size * 0.045);
  const dotSize = size * 0.12;
  const centerSize = size * 0.34;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {/* anneau */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 9999,
          border: `${ringWidth}px solid #3B7BF820`,
        }}
      />
      {/* centre */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: centerSize,
          height: centerSize,
          borderRadius: 9999,
          background: "#3B7BF8",
          boxShadow: "0 8px 24px #3B7BF840",
        }}
      />
      {/* points en orbite */}
      {ORBIT_COLORS.map((color, i) => {
        const angle = (i / ORBIT_COLORS.length) * Math.PI * 2 - Math.PI / 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `calc(50% + ${Math.sin(angle) * r}px)`,
              left: `calc(50% + ${Math.cos(angle) * r}px)`,
              transform: "translate(-50%,-50%)",
              width: dotSize,
              height: dotSize,
              borderRadius: 9999,
              background: color,
              boxShadow: "0 0 0 2.5px #fff",
            }}
          />
        );
      })}
    </div>
  );
}
