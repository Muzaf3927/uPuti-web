const API_BASE = "https://api.uputi.net/api";

export async function trackDownload(type) {
  try {
    await fetch(`${API_BASE}/count/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type }),
    });
  } catch {
    // тихо игнорируем ошибку трекинга
  }
}

