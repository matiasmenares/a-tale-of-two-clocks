"use client";

import { useEffect, useRef, useState } from "react";

const W = 800;
const H = 300;

/**
 * Encuadre de una escena de 800×300. En pantallas anchas se ve completa; en las angostas (celular, tablet
 * vertical) solo cabe una parte, así que la cámara sigue a `focusX` con un paneo suave en vez de recortar
 * siempre el centro.
 */
export function useFocusView(focusX: number) {
  const ref = useRef<SVGSVGElement>(null);
  const [aspect, setAspect] = useState(W / H);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setAspect(width / height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Paneo suave: la escena se redibuja en cada fotograma, así que basta con acercarse un poco cada vez.
  const cam = useRef(focusX);
  cam.current += (focusX - cam.current) * 0.08;
  if (Math.abs(focusX - cam.current) < 0.5) cam.current = focusX;
  if (aspect >= W / H) return { ref, viewBox: `0 0 ${W} ${H}` };
  const vw = H * aspect;
  const x0 = Math.max(0, Math.min(W - vw, cam.current - vw / 2));
  return { ref, viewBox: `${x0.toFixed(1)} 0 ${vw.toFixed(1)} ${H}` };
}
