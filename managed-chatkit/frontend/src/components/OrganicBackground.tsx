import { useEffect, useState } from 'react';

// SVG noise texture for grain overlay effect
const NOISE_TEXTURE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

/**
 * OrganicBackground - A warm, friendly background with floating organic shapes
 * Creates an approachable, human feel for financial interfaces
 */
export function OrganicBackground() {
  const [isDark, setIsDark] = useState(false);

  // Watch for dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      const colorScheme = document.documentElement.getAttribute('data-color-scheme');
      setIsDark(colorScheme === 'dark');
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-scheme'],
    });

    return () => observer.disconnect();
  }, []);

  // Color palette based on theme
  const colors = isDark
    ? {
        bg: '#1C1A17',
        blob1: 'rgba(244, 166, 152, 0.08)', // warm coral
        blob2: 'rgba(168, 212, 188, 0.06)', // warm sage
        blob3: 'rgba(249, 228, 196, 0.05)', // warm gold
        blob4: 'rgba(244, 166, 152, 0.04)', // subtle coral
        noise: 'rgba(255, 255, 255, 0.015)',
      }
    : {
        bg: '#FAF7F2',
        blob1: 'rgba(224, 122, 95, 0.12)', // warm coral
        blob2: 'rgba(129, 178, 154, 0.10)', // warm sage
        blob3: 'rgba(242, 204, 143, 0.14)', // warm gold
        blob4: 'rgba(224, 122, 95, 0.06)', // subtle coral
        noise: 'rgba(0, 0, 0, 0.02)',
      };

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: colors.bg }}
    >
      {/* Gradient mesh base */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? `radial-gradient(ellipse 80% 60% at 20% 30%, rgba(244, 166, 152, 0.06) 0%, transparent 60%),
               radial-gradient(ellipse 60% 80% at 80% 70%, rgba(168, 212, 188, 0.05) 0%, transparent 50%),
               radial-gradient(ellipse 50% 50% at 50% 50%, rgba(249, 228, 196, 0.03) 0%, transparent 40%)`
            : `radial-gradient(ellipse 80% 60% at 20% 30%, rgba(224, 122, 95, 0.08) 0%, transparent 60%),
               radial-gradient(ellipse 60% 80% at 80% 70%, rgba(129, 178, 154, 0.08) 0%, transparent 50%),
               radial-gradient(ellipse 50% 50% at 50% 50%, rgba(242, 204, 143, 0.06) 0%, transparent 40%)`,
        }}
      />

      {/* Floating organic blobs */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.9 }}
      >
        <defs>
          {/* Soft blur filter for organic feel */}
          <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
          </filter>
          <filter id="mediumBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
          </filter>
        </defs>

        {/* Large coral blob - top left */}
        <ellipse
          cx="150"
          cy="150"
          rx="200"
          ry="150"
          fill={colors.blob1}
          filter="url(#softBlur)"
          style={{
            animation: 'float 20s ease-in-out infinite',
            transformOrigin: '150px 150px',
          }}
        />

        {/* Sage blob - bottom right */}
        <ellipse
          cx="650"
          cy="450"
          rx="180"
          ry="140"
          fill={colors.blob2}
          filter="url(#softBlur)"
          style={{
            animation: 'floatSlow 25s ease-in-out infinite',
            transformOrigin: '650px 450px',
          }}
        />

        {/* Gold blob - center */}
        <ellipse
          cx="400"
          cy="300"
          rx="160"
          ry="120"
          fill={colors.blob3}
          filter="url(#mediumBlur)"
          style={{
            animation: 'float 22s ease-in-out infinite reverse',
            transformOrigin: '400px 300px',
          }}
        />

        {/* Small accent blob - top right */}
        <circle
          cx="700"
          cy="100"
          r="80"
          fill={colors.blob4}
          filter="url(#mediumBlur)"
          style={{
            animation: 'floatSlow 18s ease-in-out infinite',
            transformOrigin: '700px 100px',
          }}
        />

        {/* Small accent blob - bottom left */}
        <circle
          cx="100"
          cy="500"
          r="100"
          fill={colors.blob2}
          filter="url(#softBlur)"
          style={{
            animation: 'float 24s ease-in-out infinite',
            transformOrigin: '100px 500px',
          }}
        />
      </svg>

      {/* Subtle grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: NOISE_TEXTURE_SVG,
          backgroundRepeat: 'repeat',
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Soft vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, ${colors.bg} 100%)`,
        }}
      />

      {/* Edge fade for seamless integration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to right, ${colors.bg} 0%, transparent 8%, transparent 92%, ${colors.bg} 100%),
            linear-gradient(to bottom, ${colors.bg} 0%, transparent 8%, transparent 92%, ${colors.bg} 100%)
          `,
        }}
      />
    </div>
  );
}
