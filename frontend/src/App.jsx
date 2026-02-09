import { useState } from "react";

export default function App() {
  const API_BASE = "http://127.0.0.1:8000";

  const [partyHp, setPartyHp] = useState(120);
  const [partyAc, setPartyAc] = useState(15);
  const [enemyHp, setEnemyHp] = useState(80);
  const [enemyAc, setEnemyAc] = useState(13);

  const [monsterSearch, setMonsterSearch] = useState("goblin");
  const [monsterResult, setMonsterResult] = useState(null);

  const [prediction, setPrediction] = useState(null);
  const [status, setStatus] = useState("");

  async function fetchMonster() {
    try {
      setStatus("Searching Open5e...");
      setMonsterResult(null);

      const url = `${API_BASE}/open5e/monster?name=${encodeURIComponent(monsterSearch)}`;
      const res = await fetch(url);
      const data = await res.json();

      setMonsterResult(data);

      if (data.found) {
        // Prefill enemy stats if present
        if (typeof data.hit_points === "number") setEnemyHp(data.hit_points);
        if (typeof data.armor_class === "number") setEnemyAc(data.armor_class);
        setStatus(`Loaded: ${data.name}`);
      } else {
        setStatus(data.message || "No monster found");
      }
    } catch (err) {
      setStatus("Error calling Open5e endpoint. Is backend running?");
    }
  }

  async function predict() {
    try {
      setStatus("Predicting...");
      setPrediction(null);

      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          party_hp: Number(partyHp),
          party_ac: Number(partyAc),
          enemy_hp: Number(enemyHp),
          enemy_ac: Number(enemyAc),
        }),
      });

      const data = await res.json();
      setPrediction(data);
      setStatus("Done");
    } catch (err) {
      setStatus("Error calling /predict. Is backend running?");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial, sans-serif" }}>
      <h1>BattleBrain R&amp;D Demo</h1>
      <p style={{ color: "#444" }}>
        Enter party/enemy stats, optionally fetch a monster from Open5e, then predict outcome.
      </p>

      <div style={{ display: "flex", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
        <section style={{ flex: "1 1 360px", padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
          <h2>Party</h2>

          <label>
            Party HP
            <input
              type="number"
              value={partyHp}
              onChange={(e) => setPartyHp(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 6, marginBottom: 12 }}
            />
          </label>

          <label>
            Party AC
            <input
              type="number"
              value={partyAc}
              onChange={(e) => setPartyAc(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 6, marginBottom: 12 }}
            />
          </label>
        </section>

        <section style={{ flex: "1 1 360px", padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
          <h2>Enemy</h2>

          <label>
            Enemy HP
            <input
              type="number"
              value={enemyHp}
              onChange={(e) => setEnemyHp(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 6, marginBottom: 12 }}
            />
          </label>

          <label>
            Enemy AC
            <input
              type="number"
              value={enemyAc}
              onChange={(e) => setEnemyAc(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 6, marginBottom: 12 }}
            />
          </label>

          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #eee" }}>
            <h3>Open5e Prefill</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={monsterSearch}
                onChange={(e) => setMonsterSearch(e.target.value)}
                placeholder="e.g., goblin"
                style={{ flex: 1 }}
              />
              <button onClick={fetchMonster}>Search</button>
            </div>

            {monsterResult && (
              <pre style={{ marginTop: 10, background: "#f6f6f6", color: "#000", 
              padding: 10, borderRadius: 6 }}>
                {JSON.stringify(monsterResult, null, 2)}
              </pre>
            )}
          </div>
        </section>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={predict} style={{ padding: "10px 14px", fontSize: 16 }}>
          Predict
        </button>
        <span style={{ marginLeft: 12, color: "#555" }}>{status}</span>
      </div>

      {prediction && (
        <section style={{ marginTop: 20, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
          <h2>Prediction Results</h2>
          <ul>
            <li>
              Win Probability: <b>{(prediction.win_probability * 100).toFixed(1)}%</b>
            </li>
            <li>
              Expected Rounds: <b>{prediction.expected_rounds}</b>
            </li>
            <li>
              Expected Party HP Lost: <b>{prediction.expected_party_hp_lost}</b>
            </li>
          </ul>
          <p style={{ color: "#666" }}>
            (These round/HP-loss values are placeholder estimates for the R&amp;D demo and will be improved later.)
          </p>
        </section>
      )}
    </div>
  );
}
