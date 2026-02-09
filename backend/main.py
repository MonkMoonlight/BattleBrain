from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import requests

app = FastAPI(title="BattleBrain R&D API")

# Allow React dev server to call FastAPI during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model ONCE at server startup (inference only during requests)
MODEL_PATH = "model.pkl"
model = joblib.load(MODEL_PATH)

class Encounter(BaseModel):
    party_hp: float
    party_ac: float
    enemy_hp: float
    enemy_ac: float

@app.get("/")
def root():
    return {"message": "BattleBrain backend is running"}

@app.post("/predict")
def predict(enc: Encounter):
    X = [[enc.party_hp, enc.party_ac, enc.enemy_hp, enc.enemy_ac]]
    win_prob = float(model.predict_proba(X)[0][1])

    # Simple derived outputs for R&D demo (replace later with true models)
    expected_rounds = max(1, int(6 - (win_prob * 4)))   # ~2–6
    expected_hp_lost = int((1 - win_prob) * 60)         # ~0–60

    return {
        "win_probability": win_prob,
        "expected_rounds": expected_rounds,
        "expected_party_hp_lost": expected_hp_lost
    }

@app.get("/open5e/monster")
def open5e_monster(name: str):
    """
    Minimal proof of external API integration.
    Returns first matching monster's AC and HP to prefill the UI.
    """
    url = "https://api.open5e.com/monsters/"
    r = requests.get(url, params={"search": name}, timeout=10)
    r.raise_for_status()
    data = r.json()

    results = data.get("results", [])
    if not results:
        return {"found": False, "message": "No monster found"}

    m = results[0]
    return {
        "found": True,
        "name": m.get("name"),
        "armor_class": m.get("armor_class"),
        "hit_points": m.get("hit_points"),
    }
