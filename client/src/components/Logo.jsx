/**
 * SevaSetu Logo — Two hands reaching toward each other,
 * forming a bridge (setu). Gradient from sky to indigo.
 */
const Logo = ({ size = 32, className = '' }) => {
  const id = `logo-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>

      {/* Background rounded square */}
      <rect width="64" height="64" rx="16" fill={`url(#${id})`} />

      {/* Left hand (reaching right) */}
      <g fill="white">
        {/* Palm */}
        <path d="M12 38 C12 34, 14 30, 18 28 L24 26 C26 25, 28 27, 26 29 L22 33 C21 34.5, 22 36, 24 35 L30 31 C31.5 30, 33 31.5, 31.5 33 L27 38" />
        {/* Fingers reaching */}
        <path d="M18 28 L20 22 C20.5 20, 22.5 20, 23 22 L22 26" opacity="0.9" />
        <path d="M21 26 L22 20 C22.5 18, 24.5 18, 25 20 L24 25" opacity="0.9" />
        <path d="M24 25 L24.5 19 C25 17, 27 17, 27 19 L26 25" opacity="0.9" />
        {/* Wrist */}
        <path d="M12 38 C10 40, 10 44, 12 46 L16 48 C18 48, 20 46, 18 44 L14 40 Z" opacity="0.7" />
      </g>

      {/* Right hand (reaching left) — mirrored */}
      <g fill="white">
        {/* Palm */}
        <path d="M52 38 C52 34, 50 30, 46 28 L40 26 C38 25, 36 27, 38 29 L42 33 C43 34.5, 42 36, 40 35 L34 31 C32.5 30, 31 31.5, 32.5 33 L37 38" />
        {/* Fingers reaching */}
        <path d="M46 28 L44 22 C43.5 20, 41.5 20, 41 22 L42 26" opacity="0.9" />
        <path d="M43 26 L42 20 C41.5 18, 39.5 18, 39 20 L40 25" opacity="0.9" />
        <path d="M40 25 L39.5 19 C39 17, 37 17, 37 19 L38 25" opacity="0.9" />
        {/* Wrist */}
        <path d="M52 38 C54 40, 54 44, 52 46 L48 48 C46 48, 44 46, 46 44 L50 40 Z" opacity="0.7" />
      </g>

      {/* Connection spark — small glow between the hands */}
      <circle cx="32" cy="32" r="2.5" fill="white" opacity="0.9" />
      <circle cx="32" cy="32" r="5" fill="white" opacity="0.2" />
    </svg>
  );
};

export default Logo;
