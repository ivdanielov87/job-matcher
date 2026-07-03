import { ImageResponse } from 'next/og';

// Route segment config + image metadata
export const alt = 'CV Job Matcher — AI подбор на IT обяви по твоето CV';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Dynamically generated Open Graph image (also reused for Twitter).
// Satori supports flexbox + a subset of CSS only — every div with multiple
// children sets display:flex explicitly.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#0d1424',
          backgroundImage:
            'linear-gradient(135deg, #0d1424 0%, #111a30 55%, #16203c 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 84,
              height: 84,
              borderRadius: 22,
              color: '#fff',
              fontSize: 38,
              fontWeight: 800,
              backgroundImage: 'linear-gradient(135deg, #4361ee 0%, #4f46e5 100%)',
            }}
          >
            CV
          </div>
          <div style={{ display: 'flex', color: '#e8eeff', fontSize: 34, fontWeight: 700 }}>
            CV Job Matcher
          </div>
        </div>

        {/* Headline + subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              color: '#ffffff',
              fontSize: 66,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              maxWidth: 900,
            }}
          >
            Намери IT работа, съобразена с твоето CV
          </div>
          <div style={{ display: 'flex', color: '#9fb2d8', fontSize: 32, maxWidth: 860 }}>
            AI оценява обявите от dev.bg спрямо твоя стек, умения и опит.
          </div>
        </div>

        {/* Footer tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {['dev.bg', 'AI matching', 'Remote & на място'].map((tag) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 20px',
                borderRadius: 999,
                fontSize: 24,
                color: '#a8bbff',
                backgroundColor: 'rgba(127, 156, 255, 0.12)',
                border: '1px solid rgba(127, 156, 255, 0.35)',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
