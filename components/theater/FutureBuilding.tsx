import { useId } from "react";

/** Viviendas del futuro: terrazas habitables, fachadas con profundidad y jardines elevados. */
export function FutureBuilding({ x, w, h, base, style, night, seed }: { x: number; w: number; h: number; base: number; style: number; night: number; seed: number }) {
  const id = useId();
  const height = Math.min(h * (style === 3 ? 1.12 : 1), base - 22);
  const top = base - height;
  const cx = x + w / 2;
  const dome = style >= 4;
  const outline = dome
    ? `M${x - 4} ${base} C${x - 5} ${top + height * 0.35} ${cx - w * 0.3} ${top} ${cx} ${top} C${cx + w * 0.4} ${top} ${x + w + 7} ${top + height * 0.4} ${x + w + 4} ${base}Z`
    : seed % 2 === 0
      ? `M${x} ${base} L${x + w * 0.12} ${top + 12} Q${cx} ${top - 9} ${x + w * 0.78} ${top + 4} L${x + w} ${base}Z`
      : `M${x} ${base} L${x} ${top + height * 0.28} L${x + w * 0.2} ${top + height * 0.28} L${x + w * 0.2} ${top + 5} Q${cx} ${top - 5} ${x + w * 0.8} ${top + 5} L${x + w * 0.8} ${top + height * 0.15} L${x + w} ${top + height * 0.15} V${base}Z`;
  const floors = Math.floor((height - 14) / 12);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-facade`} x1="0" y1="0" x2="1" y2="0.3">
          <stop stopColor={seed % 2 ? "#71939c" : "#8aa3ad"} />
          <stop offset="0.25" stopColor="#405e70" />
          <stop offset="0.7" stopColor="#263d55" />
          <stop offset="1" stopColor="#15273c" />
        </linearGradient>
        <clipPath id={`${id}-clip`}><path d={outline} /></clipPath>
      </defs>
      <path d={outline} fill={`url(#${id}-facade)`} stroke="#172a3b" strokeWidth="1" />
      <g clipPath={`url(#${id}-clip)`}>
        <path d={`M${cx + w * 0.18} ${top - 5} L${cx + w * 0.05} ${base} H${x + w + 5} V${top}Z`} fill="#071a2c" opacity="0.32" />
        <path d={`M${x + 4} ${base} L${cx - w * 0.15} ${top} H${cx} L${x + w * 0.22} ${base}Z`} fill="#b0deeb" opacity="0.12" />
        {Array.from({ length: floors }, (_, r) => {
          const y = top + 14 + r * 12;
          const garden = r % 4 === seed % 4;
          return <g key={r}>
            <path d={`M${x - 4} ${y + 7} H${x + w + 4}`} stroke="#a1bac3" strokeWidth={garden ? 1.7 : 0.65} opacity={garden ? 0.8 : 0.4} />
            {[0, 1, 2, 3].map(c => <rect key={c} x={x + 5 + c * (w - 8) / 4} y={y} width={(w - 14) / 4} height="5" rx="0.5" fill={(r * 7 + c * 3 + seed) % 5 < 2 ? "#f7dba2" : "#a9dbe7"} opacity={0.14 + night * ((r + c + seed) % 3 ? 0.7 : 0.12)} />)}
            {garden && <>
              <path d={`M${x + 4} ${y + 6} q4 -6 8 -2 q4 -7 9 -1 q5 -5 9 2 H${x + 4}Z`} fill="#57866a" />
              <path d={`M${x + 3} ${y + 8} H${x + w - 4}`} stroke="#233e43" strokeWidth="2" />
              <path d={`M${x + 5} ${y + 9} H${x + w - 5}`} stroke="#bbd3ce" strokeWidth="0.6" />
            </>}
          </g>;
        })}
        {dome && <>
          <path d={`M${cx} ${top} Q${x} ${top + height * 0.4} ${x + 8} ${base} M${cx} ${top} Q${x + w} ${top + height * 0.4} ${x + w - 8} ${base}`} fill="none" stroke="#b9e0df" strokeWidth="1.4" opacity="0.5" />
          <path d={`M${cx} ${top} V${base}`} stroke="#b9e0df" strokeWidth="0.8" opacity="0.35" />
        </>}
      </g>
      {!dome && <>
        <path d={`M${x + w * 0.23} ${top + 6} Q${cx} ${top - 2} ${x + w * 0.73} ${top + 6}`} stroke="#d0e4df" strokeWidth="1.3" fill="none" />
        <path d={`M${cx - 6} ${top + 4} q1 -7 4 -3 q3 -8 5 -1 l3 5Z`} fill="#699578" />
      </>}
      <path d={`M${cx - 4} ${base} v-9 q4 -4 8 0 v9`} fill="#122335" stroke="#86bec8" strokeWidth="0.6" />
    </g>
  );
}
