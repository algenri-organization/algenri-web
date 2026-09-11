export function studioFileBaseName(project: any) {
  const preferred = project?.commercialLink?.origin === "client"
    ? String(project?.commercialLink?.clientName || project?.name || "Projeto Studio")
    : String(project?.name || "Projeto Studio");
  const normalized = preferred
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return normalized || "Projeto-Studio";
}

export function studioSceneFilename(project: any, sceneIndex: number, version: number) {
  return `${studioFileBaseName(project)}-Cena-${String(sceneIndex).padStart(2, "0")}-V${String(version).padStart(2, "0")}.mp4`;
}

export function studioFinalFilename(project: any) {
  return `${studioFileBaseName(project)}-Video-Final.mp4`;
}
