import { api, API_URL } from "./client";
import { Platform } from "react-native";

interface SimulatorLine {
  label: string;
  value: string;
  type?: "header" | "normal" | "result" | "total";
}

interface ExportParams {
  simulatorName: string;
  inputs: Record<string, string>;
  results: SimulatorLine[];
  reference?: string;
}

/**
 * Recupere le PDF du simulateur depuis le backend.
 * Web : retourne une blob URL pour apercu (iframe).
 * Mobile : retourne un filePath local pour apercu natif.
 */
export async function fetchSimulatorPdf(params: ExportParams): Promise<{ url: string; filename: string }> {
  const filename = `simulation-${params.simulatorName}-${Date.now()}.pdf`;

  if (Platform.OS === "web") {
    const { useAuthStore } = require("@/lib/store/auth");
    const token = await useAuthStore.getState().getToken();
    const response = await fetch(`${API_URL}/simulator/export-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...params,
        date: new Date().toLocaleDateString("fr-FR"),
      }),
    });

    if (!response.ok) throw new Error("Erreur export PDF");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return { url, filename };
  }

  // Mobile : ecrire en cache et retourner le chemin local
  const { cacheDirectory, writeAsStringAsync, EncodingType } = await import("expo-file-system/legacy");
  const { data } = await api.post("/simulator/export-pdf", {
    ...params,
    date: new Date().toLocaleDateString("fr-FR"),
  }, { responseType: "arraybuffer" });

  const filePath = `${cacheDirectory}${filename}`;
  const base64 = Buffer.from(data).toString("base64");
  await writeAsStringAsync(filePath, base64, { encoding: EncodingType.Base64 });
  return { url: filePath, filename };
}

/**
 * Declenche le telechargement du PDF apres apercu.
 * Web : download via <a href>. Mobile : shareAsync.
 */
export async function downloadSimulatorPdf(url: string, filename: string): Promise<void> {
  if (Platform.OS === "web") {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  const { shareAsync } = await import("expo-sharing");
  await shareAsync(url, { mimeType: "application/pdf" });
}

/** Libere la blob URL (web uniquement) quand l'apercu est ferme. */
export function releaseSimulatorPdf(url: string): void {
  if (Platform.OS === "web" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

/** @deprecated Utiliser fetchSimulatorPdf + apercu + downloadSimulatorPdf */
export async function exportSimulatorPdf(params: ExportParams): Promise<void> {
  const { url, filename } = await fetchSimulatorPdf(params);
  await downloadSimulatorPdf(url, filename);
  releaseSimulatorPdf(url);
}
