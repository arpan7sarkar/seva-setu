/**
 * SevaSetu Logo — Concept 3: Unity Heart
 */
const Logo = ({ size = 32, className = '', opacity = 1 }) => {
  return (
    <div 
      className={`logo-wrapper ${className}`} 
      style={{ 
        width: size, 
        height: size, 
        opacity,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '22%',
        overflow: 'hidden',
        background: 'var(--color-surface-secondary)',
        border: '1px solid var(--color-border)'
      }}
    >
      <img 
        src="/logo.png" 
        alt="SevaSetu Logo" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover' 
        }} 
      />
    </div>
  );
};

export default Logo;
