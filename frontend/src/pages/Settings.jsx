export default function Settings() {
  return (
    <div className="centerStage">
      <div className="card settingsCard">
        <h2 className="panelTitle">Settings</h2>

        <div className="settingsGroup">
          <h3 className="miniTitle">Preferences</h3>
          <div className="kvRow">
            <span>Theme</span>
            <span className="muted">Light / Dark (placeholder)</span>
          </div>
          <div className="kvRow">
            <span>Auto-fill monster stats</span>
            <span className="muted">On/Off (placeholder)</span>
          </div>
          <div className="kvRow">
            <span>Default difficulty</span>
            <span className="muted">Safe/Risky/Deadly (placeholder)</span>
          </div>
        </div>

        <div className="divider" />

        <div className="settingsGroup">
          <h3 className="miniTitle">Account</h3>
          <button className="btn subtle">Log out (placeholder)</button>
          <button className="btn danger">Delete account (placeholder)</button>
        </div>

        <p className="muted tiny">
          Settings are Low Priority – Non-Core. This screen represents future product structure.
        </p>
      </div>
    </div>
  );
}
