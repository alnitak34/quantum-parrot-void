import { useMemo } from "react";

interface StarsProps {
  count?: number;
  className?: string;
}

const Stars = ({ count = 60, className = "" }: StarsProps) => {
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

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
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
