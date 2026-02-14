import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMonsterByName, predictEncounter } from "../lib/api.js";
import { validateStats } from "../lib/validate.js";

export default function Builder() {
  const navigate = useNavigate();

  const [partyHp, setPartyHp] = useState(120);
  const [partyAc, setPartyAc] = useState(15);
  const [enemyHp, setEnemyHp] = useState(80);
  const [enemyAc, setEnemyAc] = useState(13);

  const [monsterSearch, setMonsterSearch] = useState("goblin");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [loadingMonster, setLoadingMonster] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);

  const stats = useMemo(
    () => ({
      partyHp: Number(partyHp),
      partyAc: Number(partyAc),
      enemyHp: Number(enemyHp),
      enemyAc: Number(enemyAc),
    }),
    [partyHp, partyAc, enemyHp, enemyAc]
  );

  const [fieldErrors, setFieldErrors] = useState({});

  function resetEncounter() {
    setPartyHp(120);
    setPartyAc(15);
    setEnemyHp(80);
    setEnemyAc(13);
    setMonsterSearch("goblin");
    setStatus("");
    setError("");
    setFieldErrors({});
  }

  async function onSearchMonster() {
    setError("");
    setStatus("");
    setLoadingMonster(true);

    try {
      const data = await fetchMonsterByName(monsterSearch);
      if (data?.found) {
        if (typeof data.hit_points === "number") setEnemyHp(data.hit_points);
        if (typeof data.armor_class === "number") setEnemyAc(data.armor_class);
        setStatus(`Loaded: ${data.name}`);
      } else {
        setStatus(data?.message || "No monster found");
      }
    } catch (e) {
      setError("Open5e request failed. Confirm backend is running.");
    } finally {
      setLoadingMonster(false);
    }
  }

  async function onPredict() {
    setError("");
    setStatus("");

    const errs = validateStats(stats);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoadingPredict(true);
    setStatus("Predicting...");

    try {
      const payload = {
        party_hp: stats.partyHp,
        party_ac: stats.partyAc,
        enemy_hp: stats.enemyHp,
        enemy_ac: stats.enemyAc,
      };

      const prediction = await predictEncounter(payload);

      // Store last prediction in sessionStorage for Results page
      sessionStorage.setItem("bb_last_stats", JSON.stringify(payload));
      sessionStorage.setItem("bb_last_prediction", JSON.stringify(prediction));

      setStatus("Done");
      navigate("/results");
    } catch (e) {
      setError("Predict request failed. Confirm backend is running.");
      setStatus("");
    } finally {
      setLoadingPredict(false);
    }
  }

  return (
    <div className="builderLayout">
      {/* Top row: Party + Enemy */}
      <div className="builderPanels">
        <section className="card panel partyPanel">
          <h2 className="panelTitle">Party</h2>

          <label className="field">
            HP
            <input
              className="input"
              type="number"
              value={partyHp}
              onChange={(e) => setPartyHp(e.target.value)}
            />
            {fieldErrors.partyHp && <div className="fieldError">{fieldErrors.partyHp}</div>}
          </label>

          <label className="field">
            AC
            <input
              className="input"
              type="number"
              value={partyAc}
              onChange={(e) => setPartyAc(e.target.value)}
            />
            {fieldErrors.partyAc && <div className="fieldError">{fieldErrors.partyAc}</div>}
          </label>
        </section>

        <section className="card panel enemyPanel">
          <h2 className="panelTitle">Enemy</h2>

          <label className="field">
            HP
            <input
              className="input"
              type="number"
              value={enemyHp}
              onChange={(e) => setEnemyHp(e.target.value)}
            />
            {fieldErrors.enemyHp && <div className="fieldError">{fieldErrors.enemyHp}</div>}
          </label>

          <label className="field">
            AC
            <input
              className="input"
              type="number"
              value={enemyAc}
              onChange={(e) => setEnemyAc(e.target.value)}
            />
            {fieldErrors.enemyAc && <div className="fieldError">{fieldErrors.enemyAc}</div>}
          </label>

          <div className="divider" />

          <div className="row">
            <label className="field grow">
              Monster
              <input
                className="input"
                type="text"
                value={monsterSearch}
                onChange={(e) => setMonsterSearch(e.target.value)}
                placeholder="e.g., goblin"
              />
            </label>

            <button
              className="btn"
              onClick={onSearchMonster}
              disabled={loadingMonster || !monsterSearch.trim()}
            >
              {loadingMonster ? "Searching..." : "Search"}
            </button>
          </div>
        </section>
      </div>

      {/* Bottom row: Prediction centered under both */}
      <section className="card panel actionPanel builderActions">
        <h2 className="panelTitle">Prediction</h2>

        <button className="btn primary big" onClick={onPredict} disabled={loadingPredict}>
          {loadingPredict ? "Predicting..." : "Predict Encounter"}
        </button>

        <button className="btn subtle" onClick={resetEncounter} disabled={loadingPredict || loadingMonster}>
          Reset
        </button>

        {status && <div className="status ok">{status}</div>}
        {error && <div className="status err">{error}</div>}

        <p className="muted tiny">
          Tip: Use Monster Search to auto-fill enemy stats, then run prediction.
        </p>
      </section>
    </div>
  );
}
