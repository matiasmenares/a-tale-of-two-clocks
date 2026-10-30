"use client";

import katex from "katex";
import { useMemo } from "react";

export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false }),
    [children, block],
  );
  return <span className={block ? "block my-2 overflow-x-auto" : ""} dangerouslySetInnerHTML={{ __html: html }} />;
}
