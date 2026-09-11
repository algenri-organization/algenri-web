import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { StudioFinalRenderScene, StudioFinalRenderManifest } from "@/lib/studio/final-render";

function wrapWords(value: string, max: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > max) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function layoutFor(scene: StudioFinalRenderScene, height: number) {
  const align = scene.overlay.align;
  const position = scene.overlay.position;
  const justifyContent = position === "top" ? "flex-start" : position === "bottom" ? "flex-end" : "center";
  const alignItems = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  return {
    justifyContent,
    alignItems,
    textAlign: align,
    paddingTop: Math.round(height * 0.09),
    paddingBottom: Math.round(height * 0.09),
  } as const;
}

async function brandMarkDataUri() {
  try {
    const svg = await readFile(path.join(process.cwd(), "public", "algenri-mark.svg"), "utf8");
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderStudioSceneOverlayImage(
  scene: StudioFinalRenderScene,
  aspectRatio: StudioFinalRenderManifest["aspectRatio"],
) {
  const width = aspectRatio === "9:16" || aspectRatio === "1:1" ? 1080 : 1920;
  const height = aspectRatio === "9:16" ? 1920 : 1080;
  const overlay = scene.overlay;
  const layout = layoutFor(scene, height);
  const mark = overlay.showBrand ? await brandMarkDataUri() : null;
  const maxWidth = aspectRatio === "9:16" ? Math.round(width * 0.82) : Math.round(width * 0.68);
  const lineBase = aspectRatio === "9:16" ? 30 : 42;

  const field = (key: string, text: string, size: number, weight: number, maxChars: number) => {
    if (!text.trim()) return null;
    return (
      <div
        key={key}
        style={{
          display: "flex",
          flexDirection: "column",
          background: "rgba(3, 8, 20, 0.52)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: Math.round(height * 0.012),
          padding: `${Math.round(height * 0.010)}px ${Math.round(width * 0.018)}px`,
          color: "white",
          fontSize: size,
          fontWeight: weight,
          lineHeight: 1.14,
          letterSpacing: key === "eyebrow" ? "0.12em" : "normal",
          maxWidth,
          whiteSpace: "pre-wrap",
        }}
      >
        {wrapWords(text, maxChars).join("\n")}
      </div>
    );
  };

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: layout.justifyContent,
          alignItems: layout.alignItems,
          paddingLeft: Math.round(width * 0.07),
          paddingRight: Math.round(width * 0.07),
          paddingTop: layout.paddingTop,
          paddingBottom: layout.paddingBottom,
          background: "transparent",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {overlay.enabled ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: layout.alignItems,
              gap: Math.round(height * 0.014),
              maxWidth,
            }}
          >
            {mark ? (
              <img
                src={mark}
                width={Math.round(height * 0.075)}
                height={Math.round(height * 0.075)}
                alt=""
              />
            ) : null}
            {field("eyebrow", overlay.eyebrow, Math.round(height * 0.026), 700, lineBase + 10)}
            {field("headline", overlay.headline, Math.round(height * 0.047), 800, lineBase)}
            {field("body", overlay.body, Math.round(height * 0.024), 450, lineBase + 14)}
            {field("cta", overlay.cta, Math.round(height * 0.023), 700, lineBase + 4)}
          </div>
        ) : null}
      </div>
    ),
    { width, height },
  );

  return Buffer.from(await response.arrayBuffer());
}
