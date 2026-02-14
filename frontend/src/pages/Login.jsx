import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="centerStage">
      <div className="card loginCard">
        <div className="loginLogo" aria-hidden="true" />
        <h1 className="loginTitle">BattleBrain</h1>
        <p className="muted">Encounter prediction for tabletop RPGs</p>

        <label className="field">
          Email
          <input className="input" type="email" placeholder="you@example.com" />
        </label>

        <label className="field">
          Password
          <input className="input" type="password" placeholder="••••••••" />
        </label>

        <button className="btn primary" onClick={() => navigate("/builder")}>
          Enter BattleBrain
        </button>

        <p className="muted tiny">
          (Login is a Low Priority – Non-Core feature. Prototype navigation continues to the app.)
        </p>
      </div>
    </div>
  );
}
