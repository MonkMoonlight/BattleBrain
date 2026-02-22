import { useEffect, useState } from "react";
import { difficultyLabel } from "../lib/validate.js";

export default function PredictionCard({ prediction }) {
  const [barPop, setBarPop] = useState(false);

  useEffect(() => {
    if (!prediction) return;

    // trigger the "pop" animation on every new prediction
    setBarPop(false);
    const t1 = setTimeout(() => setBarPop(true), 30);   // add class after paint
    const t2 = setTimeout(() => setBarPop(false), 350); // remove so it can retrigger next time

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [prediction]);

  if (!prediction) return null;

  const winPct = (prediction.win_probability * 100).toFixed(1);
  const diff = difficultyLabel(prediction.win_probability);

  // card glow class based on difficulty (safe/risky/deadly)
  const toneClass = `tone-${diff.tone}`;

  // little flavor line (optional but fun)
  const flavor =
    diff.tone === "safe"
      ? "Looks winnable. You’ve got room for mistakes."
      : diff.tone === "risky"
      ? "This could swing either way. Bring tactics."
      : "High danger. Consider retreat or resources.";

  return (
    <div className={`card resultsCard ${toneClass}`} style={{ marginTop: 16 }}>
      <h2 className="panelTitle">Encounter Results</h2>

      <div className="heroProb">
        <div className="heroLabel">Win Probability</div>
        <div className="heroRow">
          <div className="heroValue">{winPct}%</div>
          <div className={`pill ${diff.tone}`}>{diff.label}</div>
        </div>

        <div className="heroFlavor">{flavor}</div>

        <div className="winBar" aria-label="Win probability bar">
          <div
            className={`winFill ${barPop ? "show" : ""}`}
            style={{ width: `${Math.max(0, Math.min(100, Number(winPct)))}%` }}
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
    </div>
  );
}