import React from 'react';

interface BearIconProps {
  size?: number;
  className?: string;
}

// ─── shared face elements (32×32 viewBox) ───────────────────────────
// Accessories go FIRST so the bear face renders in front of them.
function Face() {
  return (
    <>
      {/* Left ear */}
      <circle cx="8.5" cy="11.5" r="5.2" fill="currentColor" />
      <circle cx="8.5" cy="11.5" r="2.9" fill="white" fillOpacity="0.32" />
      {/* Right ear */}
      <circle cx="23.5" cy="11.5" r="5.2" fill="currentColor" />
      <circle cx="23.5" cy="11.5" r="2.9" fill="white" fillOpacity="0.32" />
      {/* Head */}
      <circle cx="16" cy="21" r="11" fill="currentColor" />
      {/* Muzzle */}
      <ellipse cx="16" cy="25.8" rx="5.5" ry="3.4" fill="white" fillOpacity="0.26" />
      {/* Eyes — solid white dots for that simple Taiwanese-illustration look */}
      <circle cx="12.6" cy="19.8" r="1.7" fill="white" />
      <circle cx="19.4" cy="19.8" r="1.7" fill="white" />
      {/* Tiny pupils */}
      <circle cx="13" cy="20.2" r="0.85" fill="currentColor" fillOpacity="0.55" />
      <circle cx="19.8" cy="20.2" r="0.85" fill="currentColor" fillOpacity="0.55" />
      {/* Nose */}
      <ellipse cx="16" cy="24.6" rx="1.5" ry="1" fill="white" fillOpacity="0.48" />
      {/* Mouth — tiny U */}
      <path
        d="M14.5 26.2 Q16 27.4 17.5 26.2"
        stroke="white"
        strokeOpacity="0.45"
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

// ─── 首頁 Bear — wearing a tiny house as a hat ───────────────────────
export function BearHome({ size = 24, className }: BearIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* House hat — sits between/above ears */}
      {/* Roof */}
      <polygon points="10,10 16,4 22,10" fill="currentColor" fillOpacity="0.88" />
      {/* Chimney */}
      <rect x="18" y="4.5" width="2.5" height="3.5" rx="0.6" fill="currentColor" fillOpacity="0.88" />
      {/* Walls */}
      <rect x="10.5" y="10" width="11" height="6" rx="1" fill="currentColor" fillOpacity="0.88" />
      {/* Door */}
      <rect x="14.5" y="11.5" width="3" height="4.5" rx="0.8" fill="white" fillOpacity="0.38" />
      {/* Window */}
      <rect x="11.5" y="11.5" width="2.2" height="2.2" rx="0.5" fill="white" fillOpacity="0.38" />
      <Face />
    </svg>
  );
}

// ─── 行程 Bear — holding a tiny clipboard ───────────────────────────
export function BearItinerary({ size = 24, className }: BearIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Clipboard board */}
      <rect x="10" y="5" width="12" height="9.5" rx="1.8" fill="currentColor" fillOpacity="0.88" />
      {/* Clip */}
      <rect x="13.2" y="3" width="5.6" height="3.5" rx="1.5" fill="currentColor" fillOpacity="0.72" />
      <rect x="14.4" y="3.6" width="3.2" height="2.2" rx="0.9" fill="white" fillOpacity="0.3" />
      {/* Check + lines */}
      <path
        d="M12.5 9.2 L13.6 10.5 L16 8"
        stroke="white" strokeOpacity="0.55" strokeWidth="1.1"
        fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <line x1="17" y1="9.2" x2="20" y2="9.2" stroke="white" strokeOpacity="0.38" strokeWidth="0.9" />
      <line x1="12.5" y1="11.8" x2="20" y2="11.8" stroke="white" strokeOpacity="0.38" strokeWidth="0.9" />
      <Face />
    </svg>
  );
}

// ─── 地圖 Bear — map pin floats above head ───────────────────────────
export function BearMap({ size = 24, className }: BearIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Map pin body (teardrop) — drawn before face so head overlaps base */}
      <path
        d="M16 13 C11.2 13 11.2 2.8 16 2.8 C20.8 2.8 20.8 13 16 13 Z"
        fill="currentColor" fillOpacity="0.9"
      />
      {/* Inner hole */}
      <circle cx="16" cy="7.2" r="2.2" fill="white" fillOpacity="0.42" />
      <Face />
    </svg>
  );
}

// ─── 預算 Bear — gold coin above head ───────────────────────────────
export function BearBudget({ size = 24, className }: BearIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Coin */}
      <circle cx="16" cy="7" r="5.5" fill="currentColor" fillOpacity="0.88" />
      {/* Coin rim */}
      <circle cx="16" cy="7" r="4.2" fill="none" stroke="white" strokeOpacity="0.22" strokeWidth="0.9" />
      {/* ₩ simplified — two diagonal strokes + two horizontals */}
      <path
        d="M13.5 4.5 L15.2 9.5 M16 4.5 L16 9.5 M18.5 4.5 L16.8 9.5"
        stroke="white" strokeOpacity="0.52" strokeWidth="1"
        fill="none" strokeLinecap="round"
      />
      <line x1="13.2" y1="6.5" x2="18.8" y2="6.5" stroke="white" strokeOpacity="0.45" strokeWidth="0.9" />
      <line x1="13.2" y1="8.2" x2="18.8" y2="8.2" stroke="white" strokeOpacity="0.45" strokeWidth="0.9" />
      <Face />
    </svg>
  );
}

// ─── 待辦 Bear — holding a tiny checklist note ──────────────────────
export function BearTodo({ size = 24, className }: BearIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Note paper */}
      <rect x="9.5" y="3.5" width="13" height="11" rx="2" fill="currentColor" fillOpacity="0.88" />
      {/* Top tab/clip */}
      <rect x="14" y="2" width="4" height="2" rx="0.6" fill="currentColor" fillOpacity="0.72" />
      {/* Two checkbox + line rows */}
      <rect x="11" y="6.2" width="2.2" height="2.2" rx="0.5" fill="white" fillOpacity="0.5" />
      <path d="M11.4 7.3 L12.0 7.9 L12.9 6.7" stroke="currentColor" strokeOpacity="0.85" strokeWidth="0.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="14" y1="7.4" x2="20.5" y2="7.4" stroke="white" strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round" />
      <rect x="11" y="9.6" width="2.2" height="2.2" rx="0.5" fill="white" fillOpacity="0.5" />
      <line x1="14" y1="10.7" x2="20.5" y2="10.7" stroke="white" strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round" />
      <rect x="11" y="12.8" width="2.2" height="0.6" rx="0.3" fill="white" fillOpacity="0.45" />
      <line x1="14" y1="13.1" x2="18" y2="13.1" stroke="white" strokeOpacity="0.4" strokeWidth="0.9" strokeLinecap="round" />
      <Face />
    </svg>
  );
}

// ─── 設定 Bear — wearing a little gear crown ────────────────────────
export function BearSettings({ size = 24, className }: BearIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Gear — centre circle + 6 teeth via clip */}
      {/* Centre */}
      <circle cx="16" cy="7" r="3.4" fill="currentColor" fillOpacity="0.9" />
      {/* 6 teeth: N, NE, SE, S, SW, NW */}
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const tx = 16 + 5.4 * Math.sin(rad);
        const ty = 7  - 5.4 * Math.cos(rad);
        return (
          <rect
            key={deg}
            x={tx - 1.3}
            y={ty - 1.6}
            width="2.6"
            height="3.2"
            rx="0.7"
            fill="currentColor"
            fillOpacity="0.9"
            transform={`rotate(${deg}, ${tx}, ${ty})`}
          />
        );
      })}
      {/* Inner hole */}
      <circle cx="16" cy="7" r="1.6" fill="white" fillOpacity="0.42" />
      <Face />
    </svg>
  );
}
