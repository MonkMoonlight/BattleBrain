import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMonsterByName, predictEncounter } from "../lib/api.js";
import { validateStats } from "../lib/validate.js";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}

const PARTY_CLASSES = [
  "Artificer",
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

export default function Builder() {
  const navigate = useNavigate();

  const [init] = useState(() => {
    const enemyId = newId();
    const memberId = newId();
    return {
      enemyId,
      memberId,
      enemies: [{ id: enemyId, label: "", name: "", fullName: "", hp: "0", ac: "0", qty: 1 }],
      party: [{ id: memberId, name: "", className: "Fighter", hp: "0", ac: "0" }],
    };
  });

  const [enemies, setEnemies] = useState(init.enemies);
  const [selectedEnemyId, setSelectedEnemyId] = useState(init.enemyId);

  const [partyMembers, setPartyMembers] = useState(init.party);

  const [monsterSearch, setMonsterSearch] = useState("");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [loadingMonster, setLoadingMonster] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);

  useEffect(() => {
    try {
      const lastStatsRaw = sessionStorage.getItem("bb_last_stats");
      const enemyListRaw = sessionStorage.getItem("bb_enemy_list");
      const partyListRaw = sessionStorage.getItem("bb_party_list");

      if (enemyListRaw) {
        const list = JSON.parse(enemyListRaw);
        if (Array.isArray(list) && list.length > 0) {
          setEnemies(list);
          if (list[0]?.id) setSelectedEnemyId(list[0].id);
        }
      }

      if (partyListRaw) {
        const list = JSON.parse(partyListRaw);
        if (Array.isArray(list) && list.length > 0) {
          setPartyMembers(
            list.map((m) => ({
              id: m.id || newId(),
              name: typeof m.name === "string" ? m.name : "",
              className: PARTY_CLASSES.includes(m.className) ? m.className : "Fighter",
              hp: m.hp ?? "",
              ac: m.ac ?? "",
            }))
          );
        }
      } else if (lastStatsRaw) {
        const lastStats = JSON.parse(lastStatsRaw);
        const hp = typeof lastStats.party_hp === "number" ? lastStats.party_hp : "";
        const ac = typeof lastStats.party_ac === "number" ? lastStats.party_ac : "";
        setPartyMembers([{ id: newId(), name: "", className: "Fighter", hp, ac }]);
      }
    } catch {
      // ignore invalid storage
    }
  }, []);

  const effectiveParty = useMemo(() => {
    const totalHp = partyMembers.reduce((sum, m) => sum + (Number(m.hp) || 0), 0);

    const acNums = partyMembers
      .map((m) => Number(m.ac))
      .filter((n) => Number.isFinite(n) && n > 0);

    const avgAc = acNums.length > 0 ? Math.round(acNums.reduce((a, b) => a + b, 0) / acNums.length) : 0;

    return { partyHp: totalHp, partyAc: avgAc };
  }, [partyMembers]);

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
      partyHp: Number(effectiveParty.partyHp),
      partyAc: Number(effectiveParty.partyAc),
      enemyHp: Number(effectiveEnemy.enemyHp),
      enemyAc: Number(effectiveEnemy.enemyAc),
    }),
    [effectiveParty, effectiveEnemy]
  );

  const [fieldErrors, setFieldErrors] = useState({});

  const isValidEncounter = stats.partyHp > 0 && stats.partyAc > 0 && stats.enemyHp > 0 && stats.enemyAc > 0;

  function resetEncounter() {
    const enemyId = newId();
    const memberId = newId();

    setPartyMembers([{ id: memberId, name: "", className: "Fighter", hp: "0", ac: "0" }]);
    setEnemies([{ id: enemyId, label: "", name: "", fullName: "", hp: "0", ac: "0", qty: 1 }]);
    setSelectedEnemyId(enemyId);

    setMonsterSearch("");
    setStatus("");
    setError("");
    setFieldErrors({});
  }

  function addPartyMember() {
    const id = newId();
    setPartyMembers((prev) => [...prev, { id, name: "", className: "Fighter", hp: "0", ac: "0" }]);
    setTimeout(() => {
      const el = document.getElementById(`pm-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function removePartyMember(id) {
    setPartyMembers((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (next.length === 0) return [{ id: newId(), name: "", className: "Fighter", hp: "0", ac: "0" }];
      return next;
    });
  }

  function updatePartyMember(id, patch) {
    setPartyMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function addEnemy() {
    const id = newId();
    setEnemies((prev) => [...prev, { id, label: "", name: "", fullName: "", hp: "0", ac: "0", qty: 1 }]);
    setSelectedEnemyId(id);

    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function removeEnemy(id) {
    setEnemies((prev) => {
      const next = prev.filter((e) => e.id !== id);

      if (next.length === 0) {
        const newOne = { id: newId(), label: "", name: "", fullName: "", hp: "0", ac: "0", qty: 1 };
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
    } catch {
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
      sessionStorage.setItem("bb_party_list", JSON.stringify(partyMembers));

      setStatus("Done");
      navigate("/results");
    } catch {
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
          <h2 className="panelTitle">Party Members</h2>

          <div style={{ display: "grid", gap: 10 }}>
            {partyMembers.map((m, idx) => {
              return (
                <div
                  id={`pm-${m.id}`}
                  key={m.id}
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,.10)",
                    background: "rgba(255,255,255,.04)",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ fontWeight: 700 }}>
                      {m.name ? m.name : `Member ${idx + 1}`}
                      {m.className ? ` — ${m.className}` : ""}
                    </div>

                    <div style={{ marginLeft: "auto" }}>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => removePartyMember(m.id)}
                        disabled={partyMembers.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="divider" style={{ margin: "10px 0" }} />

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 10 }}>
                    <label className="field" style={{ marginBottom: 0 }}>
                      Name (optional)
                      <input
                        className="input"
                        type="text"
                        value={m.name}
                        onChange={(ev) => updatePartyMember(m.id, { name: ev.target.value })}
                        placeholder="e.g., Kira"
                      />
                    </label>

                    <label className="field" style={{ marginBottom: 0 }}>
                      Class
                      <select
                        className="input"
                        value={m.className}
                        onChange={(ev) => updatePartyMember(m.id, { className: ev.target.value })}
                      >
                        {PARTY_CLASSES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field" style={{ marginBottom: 0 }}>
                      HP
                      <input
                        className="input"
                        type="number"
                        value={m.hp}
                        onChange={(ev) => updatePartyMember(m.id, { hp: ev.target.value })}
                      />
                    </label>

                    <label className="field" style={{ marginBottom: 0 }}>
                      AC
                      <input
                        className="input"
                        type="number"
                        value={m.ac}
                        onChange={(ev) => updatePartyMember(m.id, { ac: ev.target.value })}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="divider" />

          <div className="row">
            <button className="btn" type="button" onClick={addPartyMember}>
              + Add Member
            </button>

            <div style={{ marginLeft: "auto", color: "rgba(231,238,252,.85)", fontSize: 13 }}>
              Effective Party: <b>HP {effectiveParty.partyHp}</b> · <b>AC {effectiveParty.partyAc}</b>
            </div>
          </div>

          {fieldErrors.partyHp && <div className="fieldError">{fieldErrors.partyHp}</div>}
          {fieldErrors.partyAc && <div className="fieldError">{fieldErrors.partyAc}</div>}
        </section>

        <section className="card panel enemyPanel">
          <h2 className="panelTitle">Enemies</h2>

          <div style={{ display: "grid", gap: 10 }}>
            {enemies.map((e, idx) => {
              const isSelected = e.id === selectedEnemyId;

              return (
                <div
                  id={e.id}
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
                      {e.label ? e.label : `Enemy ${idx + 1}`}
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
                        value={e.label}
                        onChange={(ev) => updateEnemy(e.id, { label: ev.target.value })}
                        placeholder="e.g., Jim"
                      />
                    </label>

                    <label className="field" style={{ marginBottom: 0 }}>
                      HP
                      <input
                        className="input"
                        type="number"
                        value={e.hp}
                        onChange={(ev) => updateEnemy(e.id, { hp: ev.target.value })}
                      />
                    </label>

                    <label className="field" style={{ marginBottom: 0 }}>
                      AC
                      <input
                        className="input"
                        type="number"
                        value={e.ac}
                        onChange={(ev) => updateEnemy(e.id, { ac: ev.target.value })}
                      />
                    </label>

                    <label className="field" style={{ marginBottom: 0 }}>
                      Qty
                      <input
                        className="input"
                        type="number"
                        min={1}
                        value={e.qty}
                        onChange={(ev) => updateEnemy(e.id, { qty: ev.target.value })}
                      />
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

            <button
              className="btn"
              onClick={onSearchMonster}
              disabled={loadingMonster || !monsterSearch.trim()}
              title={!monsterSearch.trim() ? "Enter a monster name to search Open5e" : ""}
            >
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

        <button
          className="btn primary big"
          onClick={onPredict}
          disabled={loadingPredict || !isValidEncounter}
          title={!isValidEncounter ? "Enter valid Party and Enemy stats to enable prediction." : ""}
        >
          {loadingPredict ? "Predicting..." : "Predict Encounter"}
        </button>

        <button className="btn subtle" onClick={resetEncounter} disabled={loadingPredict || loadingMonster}>
          Reset
        </button>

        {status && <div className="status ok">{status}</div>}
        {error && <div className="status err">{error}</div>}
      </section>
    </div>
  );
}