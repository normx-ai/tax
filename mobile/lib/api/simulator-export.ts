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

export async function exportSimulatorPdf(params: ExportParams): Promise<void> {
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
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation-${params.simulatorName}-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    // Mobile : utiliser expo-sharing
    const { shareAsync } = await import("expo-sharing");
    const { cacheDirectory, writeAsStringAsync, EncodingType } = await import("expo-file-system");

    const { data } = await api.post("/simulator/export-pdf", {
      ...params,
      date: new Date().toLocaleDateString("fr-FR"),
    }, { responseType: "arraybuffer" });

    const filePath = `${cacheDirectory}simulation-${params.simulatorName}.pdf`;
    const base64 = Buffer.from(data).toString("base64");
    await writeAsStringAsync(filePath, base64, { encoding: EncodingType.Base64 });
    await shareAsync(filePath, { mimeType: "application/pdf" });
  }
}
