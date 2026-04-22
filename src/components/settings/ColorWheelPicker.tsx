import React, { useRef, useCallback } from 'react';
import { motion } from 'motion/react';

interface Props {
  hue: number;
  onChange: (hue: number) => void;
}

const SIZE = 260;          // overall wheel diameter px
const CENTER = SIZE / 2;
const TRACK_R = CENTER * 0.84;   // thumb orbit radius
const HOLE_R  = CENTER * 0.46;   // inner hole radius (creates donut)
const THUMB_D = 30;              // thumb circle diameter

// Hue presets with labels
export const HUE_PRESETS = [
  { label: '玫粉', hue: 340 },
  { label: '珊瑚', hue: 15  },
  { label: '金橘', hue: 38  },
  { label: '薄荷', hue: 162 },
  { label: '天藍', hue: 200 },
  { label: '薰衣', hue: 268 },
];

// Convert hue (0-360, 0=red at top, clockwise) → (x, y) relative to center
function hueToXY(hue: number, r: number): { x: number; y: number } {
  const rad = (hue * Math.PI) / 180;
  return {
    x: r * Math.sin(rad),
    y: -r * Math.cos(rad),
  };
}

// Convert pointer position → hue (0-360, 0=top)
function pointerToHue(clientX: number, clientY: number, rect: DOMRect): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  // atan2: 0=right, +90=down; rotate 90° so 0=top
  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;
  if (angle >= 360) angle -= 360;
  return Math.round(angle);
}

export function ColorWheelPicker({ hue, onChange }: Props) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    onChange(pointerToHue(clientX, clientY, wheelRef.current.getBoundingClientRect()));
  }, [onChange]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    wheelRef.current?.setPointerCapture(e.pointerId);
    handleMove(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    handleMove(e.clientX, e.clientY);
  };

  const handlePointerUp = () => { dragging.current = false; };

  // Thumb absolute position (top-left corner)
  const { x, y } = hueToXY(hue, TRACK_R);
  const thumbLeft = CENTER + x - THUMB_D / 2;
  const thumbTop  = CENTER + y - THUMB_D / 2;

  const activeColor = `hsl(${hue}, 100%, 65%)`;
  const darkColor   = `hsl(${hue}, 60%, 36%)`;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* ── Wheel ── */}
      <div
        ref={wheelRef}
        style={{ width: SIZE, height: SIZE, position: 'relative', touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Outer colour ring */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: [
            'conic-gradient(',
            'hsl(0,100%,65%),',
            'hsl(30,100%,65%),',
            'hsl(60,100%,65%),',
            'hsl(90,100%,65%),',
            'hsl(120,100%,65%),',
            'hsl(150,100%,65%),',
            'hsl(180,100%,65%),',
            'hsl(210,100%,65%),',
            'hsl(240,100%,65%),',
            'hsl(270,100%,65%),',
            'hsl(300,100%,65%),',
            'hsl(330,100%,65%),',
            'hsl(360,100%,65%)',
            ')',
          ].join(''),
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }} />

        {/* Inner hole — shows selected colour */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: HOLE_R * 2, height: HOLE_R * 2,
          borderRadius: '50%',
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <motion.div
            animate={{ backgroundColor: activeColor }}
            transition={{ duration: 0.15 }}
            style={{
              width: HOLE_R * 1.3, height: HOLE_R * 1.3,
              borderRadius: '50%',
            }}
          />
        </div>

        {/* Draggable thumb */}
        <motion.div
          animate={{ left: thumbLeft, top: thumbTop }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          style={{
            position: 'absolute',
            width: THUMB_D, height: THUMB_D,
            borderRadius: '50%',
            backgroundColor: activeColor,
            border: '3.5px solid #fff',
            boxShadow: `0 2px 12px rgba(0,0,0,0.22), 0 0 0 2px ${activeColor}44`,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Hue label ── */}
      <motion.p
        key={hue}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ color: darkColor }}
        className="text-sm font-bold tabular-nums"
      >
        {hue}°
      </motion.p>

      {/* ── Preset swatches ── */}
      <div className="flex gap-3">
        {HUE_PRESETS.map((p) => {
          const active = Math.abs(hue - p.hue) < 5;
          return (
            <button
              key={p.hue}
              onClick={() => onChange(p.hue)}
              className="flex flex-col items-center gap-1"
            >
              <motion.div
                animate={{
                  scale: active ? 1.2 : 1,
                  boxShadow: active
                    ? `0 0 0 3px hsl(${p.hue},100%,65%)`
                    : '0 0 0 0px transparent',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{
                  width: 30, height: 30,
                  borderRadius: '50%',
                  background: `hsl(${p.hue}, 100%, 65%)`,
                }}
              />
              <span className="text-[10px] font-medium" style={{ color: 'var(--color-neutral-gray-3)' }}>
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
