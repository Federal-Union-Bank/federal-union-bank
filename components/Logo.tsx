// FUB wordmark — used in all headers.
// Replace with <Image src="/logo.png" .../> once logo.png is saved to /public.
export default function Logo({ className = '', inverted = false }: { className?: string; inverted?: boolean }) {
  const text = inverted ? '#ffffff' : '#0b1e3d'
  const accent = inverted ? '#6ffbbe' : '#1b5cff'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 48"
      className={className}
      aria-label="Federal Union Banking"
      role="img"
      fill="none"
    >
      {/* Hexagon mark */}
      <polygon
        points="20,2 38,2 46,16 38,30 20,30 12,16"
        fill={accent}
        opacity="0.15"
      />
      <text x="16" y="24" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="16" fill={accent}>FUB</text>

      {/* Wordmark */}
      <text x="54" y="16" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="12" fill={text} letterSpacing="1">FEDERAL UNION</text>
      <text x="54" y="30" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="11" fill={inverted ? '#a5c8ff' : '#647084'} letterSpacing="2">BANKING</text>
    </svg>
  )
}
