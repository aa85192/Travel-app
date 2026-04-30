import React from 'react';
import { Trip } from '../../types';

interface StoryCardProps {
  trip: Trip;
  themeHue: number;
}

/**
 * 1080x1920 (9:16) story-ready layout. Rendered offscreen and rasterized
 * via modern-screenshot. Uses inline styles + system fonts to maximize
 * fidelity across browsers.
 */
export const StoryCard = React.forwardRef<HTMLDivElement, StoryCardProps>(
  ({ trip, themeHue }, ref) => {
    const days = trip.days.length;
    const allSpots = trip.days.flatMap((d) => d.spots);
    const featured = allSpots.filter((s) => s.photo).slice(0, 9);

    const bg = `linear-gradient(160deg, hsl(${themeHue}, 100%, 92%) 0%, hsl(${themeHue}, 100%, 87%) 50%, hsl(${(themeHue + 20) % 360}, 100%, 90%) 100%)`;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1920,
          background: bg,
          padding: 80,
          fontFamily: '"Noto Sans TC", "Nunito", sans-serif',
          color: `hsl(${themeHue}, 60%, 26%)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative top blob */}
        <div
          style={{
            position: 'absolute',
            top: -150,
            right: -150,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: `hsl(${themeHue}, 100%, 78%)`,
            opacity: 0.4,
          }}
        />

        {/* Header */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 32, opacity: 0.6, fontWeight: 600 }}>
            🐻 Cindy&apos;s Travel
          </div>
          <h1
            style={{
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1.1,
              margin: '24px 0 16px',
              letterSpacing: -2,
            }}
          >
            {trip.title}
          </h1>
          <div style={{ fontSize: 36, opacity: 0.7, fontWeight: 500 }}>
            📍 {trip.destination}
          </div>
          <div style={{ fontSize: 28, opacity: 0.55, marginTop: 12 }}>
            {trip.startDate} ~ {trip.endDate}　·　{days} 天
          </div>
        </div>

        {/* Photo collage 3x3 */}
        {featured.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              flex: 1,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {featured.map((s, i) => (
              <div
                key={s.id}
                style={{
                  borderRadius: 28,
                  overflow: 'hidden',
                  background: `hsl(${themeHue}, 60%, 95%)`,
                  position: 'relative',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                }}
              >
                <img
                  src={s.photo}
                  alt={s.name}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '40px 16px 12px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    color: 'white',
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}. {s.name}
                </div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 9 - featured.length) }).map((_, i) => (
              <div
                key={`ph-${i}`}
                style={{
                  borderRadius: 28,
                  background: `hsl(${themeHue}, 80%, 95%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 56,
                  opacity: 0.5,
                }}
              >
                🌸
              </div>
            ))}
          </div>
        )}

        {/* Footer stats */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: 32,
            padding: '28px 24px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Stat label="天數" value={`${days}`} />
          <Divider />
          <Stat label="景點" value={`${allSpots.length}`} />
          <Divider />
          <Stat label="同行" value={`${trip.participants.length}`} />
        </div>
      </div>
    );
  },
);

StoryCard.displayName = 'StoryCard';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 22, opacity: 0.6, marginTop: 8, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, background: 'rgba(0,0,0,0.1)' }} />;
}
