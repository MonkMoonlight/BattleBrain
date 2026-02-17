import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { difficultyLabel } from "../lib/validate.js";

export default function Results() {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("bb_last_stats") || "null");
    } catch {
      return null;
    }
  }, []);

  const prediction = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("bb_last_prediction") || "null");
    } catch {
      return null;
    }
  }, []);

  const [copied, setCopied] = useState(false);

  const enemies = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("bb_enemy_list") || "null");
    } catch {
      return null;
    }
  }, []);

  if (!prediction) {
    return (
      <div className="centerStage">
        <div className="card">
          <h2>No results yet</h2>
          <p className="muted">Run a prediction from the Builder screen first.</p>
          <button className="btn primary" onClick={() => navigate("/builder")}>
            Go to Builder
          </button>
        </div>
      </div>
    );
  }

  const winPct = (prediction.win_probability * 100).toFixed(1);
  const diff = difficultyLabel(prediction.win_probability);

  const encounterSummary = useMemo(() => {
    const partyHp = stats?.party_hp ?? "-";
    const partyAc = stats?.party_ac ?? "-";
    const enemyHp = stats?.enemy_hp ?? "-";
    const enemyAc = stats?.enemy_ac ?? "-";

    const enemyLines = Array.isArray(enemies)
      ? enemies
          .map((e) => {
            const name = (e.name || e.fullName || "Enemy").trim();
            const qty = Number(e.qty) || 1;
            return `${name} x${qty} (HP ${e.hp || "?"}, AC ${e.ac || "?"})`;
          })
          .join("; ")
      : "None";

    return `BattleBrain Encounter Summary
Party: HP ${partyHp}, AC ${partyAc}
Enemies: ${enemyLines}
Effective Enemy: HP ${enemyHp}, AC ${enemyAc}
Win Probability: ${winPct}% (${diff.label})`;
  }, [stats, enemies, winPct, diff.label]);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(encounterSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="resultsWrap">
      <section className="card resultsCard">
        <h2 className="panelTitle">Encounter Results</h2>

        <div className="heroProb">
          <div className="heroLabel">Win Probability</div>
          <div className="heroValue">{winPct}%</div>
          <div className={`pill ${diff.tone}`}>{diff.label}</div>

          <div className="winBar" aria-label="Win probability bar">
            <div
              className="winFill"
              style={{
                width: `${Math.max(0, Math.min(100, Number(winPct)))}%`,
              }}
            />
          </div>
        </div>

        <div className="metricRow">
          <div className="metric">
            <div className="metricLabel">Expected Rounds</div>
            <div className="metricValue">{prediction.expected_rounds}</div>
          </div>
          <div className="metric">
            <div className="metricLabel">Expected Party HP Loss</div>
            <div className="metricValue">{prediction.expected_party_hp_lost}</div>
          </div>
        </div>

        <div className="chartBox">
          <div className="chartTitle">Encounter Summary</div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }} className="muted">
            {encounterSummary}
          </pre>
          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn" onClick={copySummary}>
              Copy Summary
            </button>
            {copied && <span className="muted tiny">Copied!</span>}
          </div>
        </div>

        <div className="row">
          <button
            className="btn"
            onClick={() => {
              sessionStorage.removeItem("bb_last_stats");
              sessionStorage.removeItem("bb_last_prediction");
              sessionStorage.removeItem("bb_enemy_list");
              navigate("/builder");
            }}
          >
            Back to Builder
          </button>

          <button className="btn primary" onClick={() => navigate("/builder")}>
            Edit Encounter
          </button>
        </div>
      </section>

      <aside className="sideStack">
        <div className="card miniPanel partyPanel">
          <h3 className="miniTitle">Party</h3>
          <div className="kv">
            <span>HP</span>
            <b>{stats?.party_hp ?? "-"}</b>
          </div>
          <div className="kv">
            <span>AC</span>
            <b>{stats?.party_ac ?? "-"}</b>
          </div>
        </div>

        <div className="card miniPanel enemyPanel">
          <h3 className="miniTitle">Enemy</h3>
          <div className="kv">
            <span>HP</span>
            <b>{stats?.enemy_hp ?? "-"}</b>
          </div>
          <div className="kv">
            <span>AC</span>
            <b>{stats?.enemy_ac ?? "-"}</b>
          </div>
        </div>
      </aside>
    </div>
  );
}
