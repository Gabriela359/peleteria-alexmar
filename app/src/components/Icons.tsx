// Iconos inline SVG (monolínea) usados en la app.

interface IconProps { size?: number; color?: string }

export function LogoIcon({ size = 22, color = '#FFFFFF' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15c2 0 3-1 5-1s3 1 6 1c3 0 6-1 7-3-1-3-4-5-8-6-3-1-6-1-8 1-2 2-2 6-2 8z" />
      <path d="M3 15v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1" />
    </svg>
  )
}

export function AlertTriangleIcon({ size = 20, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

export function SearchIcon({ size = 18, color = '#888B8D' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function BoxIcon({ size = 22, color = '#FFFFFF' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7 12 3 4 7v10l8 4 8-4z" />
      <path d="m4 7 8 4 8-4" />
      <path d="M12 21V11" />
    </svg>
  )
}

export function FileIcon({ size = 20, color = '#FFFFFF' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}

export function ImageIcon({ size = 18, color = '#888B8D' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}
