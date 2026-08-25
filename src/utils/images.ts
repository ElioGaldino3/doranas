/** Troca o tamanho de uma URL de imagem TMDB (w500 → w200, etc.) p/ miniaturas. */
export function thumbUrl(url: string | undefined, size = "w200"): string | undefined {
  if (!url) return undefined;
  return url.replace("/w500/", `/${size}/`);
}