import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ALGENRI — Soluções Digitais, IA e Automação";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 82px",
          background:
            "radial-gradient(circle at 82% 22%, rgba(0,229,255,.24), transparent 30%), radial-gradient(circle at 14% 85%, rgba(249,115,22,.20), transparent 30%), linear-gradient(135deg, #06111f 0%, #0a1c2d 100%)",
          color: "white",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 58,
              height: 58,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              border: "1px solid rgba(103,232,249,.5)",
              background: "rgba(255,255,255,.05)",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>
            ALGENRI
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
          <div style={{ display: "flex", fontSize: 64, lineHeight: 1.03, fontWeight: 800, letterSpacing: -2.5 }}>
            Tecnologia que impulsiona o seu amanhã.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 27,
              lineHeight: 1.35,
              color: "rgba(255,255,255,.72)",
            }}
          >
            Sites, inteligência artificial, automações e sistemas sob medida para empresas que querem evoluir no digital.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 20 }}>
          <div style={{ display: "flex", color: "rgba(255,255,255,.52)" }}>Soluções Digitais • IA • Automação</div>
          <div style={{ display: "flex", color: "#67e8f9", fontWeight: 700 }}>algenri.com.br</div>
        </div>
      </div>
    ),
    size,
  );
}
