export type AssetMapEntry = {
  sourcePath: string;
  localPath: string;
  status: "cached" | "missing" | "failed";
  error?: string;
};

export type AssetMap = Record<string, AssetMapEntry>;

const bungieBaseUrl = "https://www.bungie.net";

export function normalizeBungieAssetPath(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith(bungieBaseUrl)) {
    return trimmed.slice(bungieBaseUrl.length);
  }

  return trimmed;
}

export function isBungieAssetPath(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return value.startsWith("/common/") || value.startsWith(`${bungieBaseUrl}/common/`);
}

export function isLocalDestinyAssetPath(value: string | undefined): boolean {
  return Boolean(value?.startsWith("/assets/destiny/"));
}

export function sourceToLocalAssetPath(sourcePath: string): string {
  const normalized = normalizeBungieAssetPath(sourcePath) ?? sourcePath;
  return `/assets/destiny/${normalized.replace(/^\/+/, "")}`;
}

export function localizeAssetPath(
  sourcePath: string | undefined,
  assetMap: AssetMap
): string | undefined {
  const normalized = normalizeBungieAssetPath(sourcePath);
  if (!normalized) {
    return undefined;
  }

  if (isLocalDestinyAssetPath(normalized)) {
    return normalized;
  }

  const mapped = assetMap[normalized] ?? assetMap[sourcePath ?? ""];
  if (mapped) {
    return mapped.localPath;
  }

  return normalized;
}

