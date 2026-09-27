import client from "./client";

export async function exportData() {
  const { data } = await client.get("/api/export");
  return data;
}

export async function importData(payload) {
  const { data } = await client.post("/api/import", payload);
  return data;
}

/** Triggers a browser download of the current user's data as a JSON file. */
export function downloadExport(exportPayload, username) {
  const date = new Date().toISOString().slice(0, 10);
  const filename = `otakushelf-export-${username}-${date}.json`;
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
