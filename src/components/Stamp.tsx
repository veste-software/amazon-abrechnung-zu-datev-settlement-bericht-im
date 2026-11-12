interface Props {
  /** 'ok' = green SALDO STIMMT, 'diff' = red DIFFERENZ with the amount */
  state: 'ok' | 'diff';
  /** formatted amount for the red state, e.g. "1,00 €" */
  amount?: string;
  /** unique per page, filter ids must not clash */
  id?: string;
}

/** Hand-built inline SVG rubber stamp. Rotated -3 degrees, uneven ink via feTurbulence. */
export default function Stamp({ state, amount = '', id = 'stamp' }: Props) {
  const ok = state === 'ok';
  const word = ok ? 'SALDO STIMMT' : `DIFFERENZ ${amount}`.trim();
  const colour = ok ? 'var(--green)' : 'var(--red)';
  const width = Math.max(260, 28 + word.length * 17);
  return (
    <svg
      class="stamp"
      data-state={state}
      data-press=""
      width={width}
      height="84"
      viewBox={`0 0 ${width} 84`}
      role="img"
      aria-label={ok ? 'Saldo stimmt' : `Differenz ${amount}`}
      style={{ color: colour }}
    >
      <defs>
        <filter id={`${id}-ink`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
        </filter>
      </defs>
      <g filter={`url(#${id}-ink)`} fill="none" stroke="currentColor" transform={`rotate(-3 ${width / 2} 42)`}>
        <path d={`M6 8 L${width - 5} 6 L${width - 7} 78 L5 76 Z`} stroke-width="3" />
        <path d={`M13 15 L${width - 12} 14 L${width - 14} 70 L12 69 Z`} stroke-width="1.5" />
        <text
          x={width / 2}
          y="52"
          text-anchor="middle"
          fill="currentColor"
          stroke="none"
          font-family="'IBM Plex Mono', ui-monospace, monospace"
          font-weight="600"
          font-size="24"
          letter-spacing="3"
        >
          {word}
        </text>
      </g>
    </svg>
  );
}
