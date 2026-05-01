import { useMemo } from "react";

interface StarsProps {
  count?: number;
  className?: string;
  /** Number of tiny dust particles in addition to twinkle stars */
  particleCount?: number;
  /** Show faint nebula streaks */
  streaks?: boolean;
}

const Stars = ({
  count = 60,
  className = "",
  particleCount = 120,
  streaks = true,
}: StarsProps) => {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 4,
        hue: Math.random() > 0.7 ? 326 : Math.random() > 0.5 ? 280 : 0,
      })),
    [count]
  );

  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.2 + 0.3,
        opacity: 0.2 + Math.random() * 0.5,
      })),
    [particleCount]
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Faint nebula streaks */}
      {streaks && (
        <>
          <div
            className="absolute -left-[10%] top-[18%] h-[2px] w-[55%] rotate-[-12deg]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, hsl(326 100% 75% / 0.35) 50%, transparent 100%)",
              filter: "blur(2px)",
            }}
          />
          <div
            className="absolute right-[-10%] top-[62%] h-[3px] w-[60%] rotate-[8deg]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, hsl(280 100% 70% / 0.28) 50%, transparent 100%)",
              filter: "blur(3px)",
            }}
          />
        </>
      )}

      {/* Tiny dust particles */}
      {particles.map((p) => (
        <span
          key={`p-${p.id}`}
          className="absolute rounded-full"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: "white",
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Twinkle stars */}
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full animate-twinkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: s.hue === 0 ? "white" : `hsl(${s.hue} 100% 80%)`,
            boxShadow: `0 0 ${s.size * 3}px hsl(${s.hue || 0} 100% 80% / 0.8)`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Stars;
