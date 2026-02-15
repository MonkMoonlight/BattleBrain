import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMonsterByName, predictEncounter } from "../lib/api.js";
import { validateStats } from "../lib/validate.js";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}

export default function Builder() {
  const navigate = useNavigate();

  const [partyHp, setPartyHp] = useState(120);
  const [partyAc, setPartyAc] = useState(15);

  const [init] = useState(() => {
    const id = newId();
    return {
      id,
      enemies: [{ id, name: "", fullName: "", hp: "", ac: "", qty: 1 }],
    };
  });

  const [enemies, setEnemies] = useState(init.enemies);
  const [selectedEnemyId, setSelectedEnemyId] = useState(init.id);

  const [monsterSearch, setMonsterSearch] = useState("");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [loadingMonster, setLoadingMonster] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);

  const effectiveEnemy = useMemo(() => {
    const totalHp = enemies.reduce((sum, e) => {
      const hp = Number(e.hp) || 0;
      const qty = Number(e.qty) || 1;
      return sum + hp * qty;
    }, 0);

    const maxAc = enemies.reduce((m, e) => {
      const ac = Number(e.ac) || 0;
      return Math.max(m, ac);
    }, 0);

    return { enemyHp: totalHp, enemyAc: maxAc };
  }, [enemies]);

  const stats = useMemo(
    () => ({
      partyHp: Number(partyHp),
      partyAc: Number(partyAc),
      enemyHp: Number(effectiveEnemy.enemyHp),
      enemyAc: Number(effectiveEnemy.enemyAc),
    }),
    [partyHp, partyAc, effectiveEnemy]
  );

  const [fieldErrors, setFieldErrors] = useState({});

  function resetEncounter() {
    setPartyHp(120);
    setPartyAc(15);

    const id = newId();
    setEnemies([{ id, name: "", fullName: "", hp: "", ac: "", qty: 1 }]);
    setSelectedEnemyId(id);

    setMonsterSearch("");
    setStatus("");
    setError("");
    setFieldErrors({});
  }

  function addEnemy() {
    const id = newId();
    setEnemies((prev) => [...prev, { id, name: "", fullName: "", hp: "", ac: "", qty: 1 }]);
    setSelectedEnemyId(id);
  }

  function removeEnemy(id) {
    setEnemies((prev) => {
      const next = prev.filter((e) => e.id !== id);

      if (next.length === 0) {
        const newOne = { id: newId(), name: "", fullName: "", hp: "", ac: "", qty: 1 };
        setSelectedEnemyId(newOne.id);
        return [newOne];
      }

      if (id === selectedEnemyId) setSelectedEnemyId(next[0].id);
      return next;
    });
  }

  function updateEnemy(id, patch) {
    setEnemies((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function onSearchMonster() {
    setError("");
    setStatus("");
    setLoadingMonster(true);

    try {
      if (!selectedEnemyId) {
        setError("Select an enemy row first.");
        return;
      }

      const data = await fetchMonsterByName(monsterSearch);

      if (data?.found) {
        const clean = monsterSearch.trim();

        updateEnemy(selectedEnemyId, {
          name: clean,
          fullName: data.name || clean,
          hp: typeof data.hit_points === "number" ? data.hit_points : "",
          ac: typeof data.armor_class === "number" ? data.armor_class : "",
        });

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

      sessionStorage.setItem("bb_last_stats", JSON.stringify(payload));
      sessionStorage.setItem("bb_last_prediction", JSON.stringify(prediction));
      sessionStorage.setItem("bb_enemy_list", JSON.stringify(enemies));

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
      <div className="builderPanels">
        <section className="card panel partyPanel">
          <h2 className="panelTitle">Party</h2>

          <label className="field">
            HP
            <input className="input" type="number" value={partyHp} onChange={(e) => setPartyHp(e.target.value)} />
            {fieldErrors.partyHp && <div className="fieldError">{fieldErrors.partyHp}</div>}
          </label>

          <label className="field">
            AC
            <input className="input" type="number" value={partyAc} onChange={(e) => setPartyAc(e.target.value)} />
            {fieldErrors.partyAc && <div className="fieldError">{fieldErrors.partyAc}</div>}
          </label>
        </section>

        <section className="card panel enemyPanel">
          <h2 className="panelTitle">Enemies</h2>

          <div style={{ display: "grid", gap: 10 }}>
            {enemies.map((e, idx) => {
              const isSelected = e.id === selectedEnemyId;

              return (
                <div
                  key={e.id}
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    border: isSelected ? "1px solid rgba(100,140,255,.55)" : "1px solid rgba(255,255,255,.10)",
                    background: "rgba(255,255,255,.04)",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => setSelectedEnemyId(e.id)}
                      style={{ padding: "8px 10px" }}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>

                    <div style={{ fontWeight: 700 }}>
                      Enemy {idx + 1}
                      {e.name ? ` — ${e.name}` : ""}
                      {e.fullName && e.fullName !== e.name && (
                        <div className="muted tiny" style={{ marginTop: 6 }}>
                          Open5e: {e.fullName}
                        </div>
                      )}
                    </div>

                    <div style={{ marginLeft: "auto" }}>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => removeEnemy(e.id)}
                        disabled={enemies.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="divider" style={{ margin: "10px 0" }} />

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr .8fr", gap: 10 }}>
                    <label className="field" style={{ marginBottom: 0 }}>
                      Name (optional)
                      <input
                        className="input"
                        type="text"
                        value={e.name}
                        onChange={(ev) => updateEnemy(e.id, { name: ev.target.value })}
                        placeholder="e.g., goblin"
                      />
                    </label>

                    <label className="field" style={{ marginBottom: 0 }}>
                      HP
                      <input className="input" type="number" value={e.hp} onChange={(ev) => updateEnemy(e.id, { hp: ev.target.value })} />
                    </label>

                    <label className="field" style={{ marginBottom: 0 }}>
                      AC
                      <input className="input" type="number" value={e.ac} onChange={(ev) => updateEnemy(e.id, { ac: ev.target.value })} />
                    </label>

                    <label className="field" style={{ marginBottom: 0 }}>
                      Qty
                      <input className="input" type="number" min={1} value={e.qty} onChange={(ev) => updateEnemy(e.id, { qty: ev.target.value })} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="divider" />

          <div className="row">
            <button className="btn" type="button" onClick={addEnemy}>
              + Add Enemy
            </button>

            <div style={{ marginLeft: "auto", color: "rgba(231,238,252,.85)", fontSize: 13 }}>
              Effective Enemy: <b>HP {effectiveEnemy.enemyHp}</b> · <b>AC {effectiveEnemy.enemyAc}</b>
            </div>
          </div>

          <div className="divider" />

          <div className="row">
            <label className="field grow">
              Open5e search (fills selected row)
              <input
                className="input"
                type="text"
                value={monsterSearch}
                onChange={(e) => setMonsterSearch(e.target.value)}
                placeholder="e.g., goblin"
              />
            </label>

            <button className="btn" onClick={onSearchMonster} disabled={loadingMonster || !monsterSearch.trim()}>
              {loadingMonster ? "Searching..." : "Search"}
            </button>
          </div>

          {(fieldErrors.enemyHp || fieldErrors.enemyAc) && (
            <div className="fieldError">
              {fieldErrors.enemyHp ? `${fieldErrors.enemyHp} ` : ""}
              {fieldErrors.enemyAc ? `${fieldErrors.enemyAc}` : ""}
            </div>
          )}
        </section>
      </div>

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
          MVP note: Multi-enemy encounters are aggregated for prediction (HP sum, AC max). Simulation is a future upgrade.
        </p>
      </section>
    </div>
  );
}
