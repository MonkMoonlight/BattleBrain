const API_BASE = "http://127.0.0.1:8000";

export async function fetchMonsterByName(name) {
  const url = `${API_BASE}/open5e/monster?name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open5e request failed (${res.status})`);
  return res.json();
}

export async function predictEncounter(payload) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Predict request failed (${res.status})`);
  return res.json();
}
