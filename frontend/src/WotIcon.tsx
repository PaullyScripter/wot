export function WotIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 36 36" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="18" cy="18" r="14" fill="#000080" stroke="#0000c0" strokeWidth="1"/>
      <text x="18" y="23" textAnchor="middle" fontSize="13" fontWeight="bold" fontStyle="italic" fill="white">WOT</text>
    </svg>
  );
}