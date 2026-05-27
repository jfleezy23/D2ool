import "dotenv/config";
import { join } from "node:path";
import { ensureDir, writeJson } from "./lib/fs";
import { latestManifestPath, rawDataDir } from "./lib/paths";
import { requiredDefinitionNames } from "./lib/manifestLoader";

const bungieBaseUrl = "https://www.bungie.net";
const manifestUrl = `${bungieBaseUrl}/Platform/Destiny2/Manifest/`;

type BungieManifestResponse = {
  Response?: {
    version?: string;
    jsonWorldComponentContentPaths?: Record<string, Record<string, string>>;
  };
  ErrorCode?: number;
  Message?: string;
};

function requiredApiKey(): string {
  const apiKey = process.env.BUNGIE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "BUNGIE_API_KEY is missing. Create .env with BUNGIE_API_KEY=your_key_here."
    );
  }

  return apiKey;
}

function safeDirectoryName(version: string): string {
  return version.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function fetchJson<T>(url: string, apiKey: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "X-API-Key": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed ${response.status} ${response.statusText}: ${url}`);
  }

  return response.json() as Promise<T>;
}

async function main(): Promise<void> {
  const apiKey = requiredApiKey();
  const locale = process.env.BUNGIE_LOCALE ?? "en";
  const manifest = await fetchJson<BungieManifestResponse>(manifestUrl, apiKey);
  const version = manifest.Response?.version;
  const componentPaths = manifest.Response?.jsonWorldComponentContentPaths?.[locale];

  if (!version || !componentPaths) {
    throw new Error(
      `Bungie manifest response did not include JSON component paths for locale "${locale}".`
    );
  }

  const manifestDirectory = join(rawDataDir, safeDirectoryName(version));
  await ensureDir(manifestDirectory);
  await writeJson(join(manifestDirectory, "manifest-response.json"), manifest);

  const definitionPaths: Record<string, string> = {};
  const sourceUrls: Record<string, string> = {};

  for (const definitionName of requiredDefinitionNames) {
    const definitionPath = componentPaths[definitionName];
    if (!definitionPath) {
      throw new Error(
        `Manifest is missing ${definitionName} for locale "${locale}".`
      );
    }

    const sourceUrl = `${bungieBaseUrl}${definitionPath}`;
    const definition = await fetchJson<unknown>(sourceUrl, apiKey);
    const outputPath = join(manifestDirectory, `${definitionName}.json`);

    await writeJson(outputPath, definition);
    definitionPaths[definitionName] = outputPath;
    sourceUrls[definitionName] = sourceUrl;
    console.log(`Downloaded ${definitionName}`);
  }

  await writeJson(latestManifestPath, {
    manifestVersion: version,
    downloadedAt: new Date().toISOString(),
    locale,
    manifestUrl,
    definitionPaths,
    sourceUrls,
    rawDirectory: manifestDirectory
  });

  console.log(`Saved manifest ${version} to ${manifestDirectory}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

