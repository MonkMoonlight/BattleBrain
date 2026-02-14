import { useMemo } from "react";
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

  return (
    <div className="resultsWrap">
      <section className="card resultsCard">
        <h2 className="panelTitle">Encounter Results</h2>

        <div className="heroProb">
          <div className="heroLabel">Win Probability</div>
          <div className="heroValue">{winPct}%</div>
          <div className={`pill ${diff.tone}`}>{diff.label}</div>
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
          <div className="chartTitle">Outcome Visualization</div>
          <div className="chartPlaceholder">
            {/* Replace with your chart image if you want */}
            <span className="muted">[Chart Placeholder]</span>
          </div>
        </div>

        <div className="row">
          <button className="btn" onClick={() => navigate("/builder")}>
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
