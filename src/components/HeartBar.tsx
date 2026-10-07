"use client";

// ===== แถบหัวใจ 8 บิต =====

function PixelHeart({ alive, breaking }: { alive: boolean; breaking?: boolean }) {
  return (
    <svg viewBox="0 0 14 12" className={`h-6 w-7 sm:h-7 sm:w-8 ${breaking ? "heart-pop" : ""}`} shapeRendering="crispEdges">
      {/* หัวใจพิกเซล 8 บิต */}
      <g fill={alive ? "#ef4444" : "#9ca3af"}>
        <rect x="2" y="0" width="4" height="2" />
        <rect x="8" y="0" width="4" height="2" />
        <rect x="1" y="2" width="12" height="2" />
        <rect x="2" y="4" width="10" height="2" />
        <rect x="3" y="6" width="8" height="2" />
        <rect x="5" y="8" width="4" height="2" />
        <rect x="6" y="10" width="2" height="2" />
      </g>
      {alive ? <rect x="3" y="1" width="2" height="2" fill="#fecaca" /> : null}
    </svg>
  );
}

export default function HeartBar({ hearts, max = 3, breaking }: { hearts: number; max?: number; breaking?: boolean }) {
  return (
    <div className="flex items-center gap-1" aria-label={`หัวใจ ${hearts} จาก ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <PixelHeart key={i} alive={i < hearts} breaking={breaking && i === hearts} />
      ))}
    </div>
  );
}
