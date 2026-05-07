import type { CapacitorConfig } from "@capacitor/cli";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return {};
  }

  const contents = readFileSync(filePath, "utf8");
  const values: Record<string, string> = {};

  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    values[key] = value;
  });

  return values;
}

const localEnv = loadEnvFile(resolve(process.cwd(), ".env.local"));
const lifecycleEvent = process.env.npm_lifecycle_event ?? "";
const localFallbackUrl =
  lifecycleEvent.includes("apk") || lifecycleEvent.includes("android")
    ? "http://10.0.2.2:3000"
    : "http://localhost:3000";
const configuredUrl =
  process.env.CAPACITOR_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  localEnv.CAPACITOR_APP_URL ||
  localEnv.NEXT_PUBLIC_SITE_URL ||
  localEnv.NEXT_PUBLIC_APP_URL ||
  localFallbackUrl;
const appUrl = configuredUrl.replace(/\/$/, "");
const isSecureUrl = appUrl.startsWith("https://");
const hostname = appUrl.replace(/^https?:\/\//, "").split("/")[0] || "*";

const config: CapacitorConfig = {
  appId: "com.vendarevistaswhatsapp.app",
  appName: "Venda Revistas",
  webDir: "mobile-shell",
  server: {
    url: appUrl,
    cleartext: !isSecureUrl,
    allowNavigation: [hostname],
  },
  android: {
    allowMixedContent: !isSecureUrl,
  },
};

export default config;
