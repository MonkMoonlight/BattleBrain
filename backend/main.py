from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

OPEN5E_BASE = "https://api.open5e.com/monsters/"

session = requests.Session()
retries = Retry(
    total=3,                 # try up to 3 additional times
    backoff_factor=0.6,      # 0.6s, 1.2s, 2.4s ...
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET"],
    raise_on_status=False,
)
adapter = HTTPAdapter(max_retries=retries)
session.mount("https://", adapter)
session.mount("http://", adapter)

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
    Returns a monster's AC and HP to prefill the UI.
    Uses SRD-first search, prefers exact/startswith matches,
    follows pagination, and fails gracefully on Open5e timeouts.
    Fixes fuzzy search returning unrelated monsters by:
      1) Searching SRD first
      2) Preferring exact name matches
      3) Falling back gracefully
      4) Following pagination
    """
    
    query = name.strip()
    if not query:
        raise HTTPException(status_code=400, detail="name cannot be empty")

    def fetch_all(params, max_pages=3):
        """Fetch up to max_pages of results to improve match quality."""
        results = []
        url = OPEN5E_BASE

        for _ in range(max_pages):
            try:
                r = session.get(url, params=params, timeout=(5, 20))  # ✅ uses retry session
                r.raise_for_status()
            except requests.exceptions.ReadTimeout:
                # graceful timeout
                return {"_error": "timeout"}
            except requests.exceptions.RequestException:
                # graceful generic failure
                return {"_error": "request_failed"}

            data = r.json()
            results.extend(data.get("results", []))

            url = data.get("next")
            if not url:
                break

            # when using "next", params are already baked into the URL
            params = None

        return results


    # 1) SRD-only fuzzy search first (best default for BattleBrain)
    srd_results = fetch_all({"search": query, "document__slug": "5esrd"}, max_pages=3)
    if isinstance(srd_results, dict) and srd_results.get("_error"):
        return {
            "found": False,
            "message": "Open5e timed out (slow response). Try again, or enter HP/AC manually."
            if srd_results["_error"] == "timeout"
            else "Open5e request failed. Try again later."
        }
    
    # helper: exact name match
    def exact_match(results):
        q = query.lower()
        for m in results:
            if (m.get("name") or "").lower() == q:
                return m
        return None

    # helper: best "starts with" match (nice for partial typing like "gob")
    def startswith_match(results):
        q = query.lower()
        for m in results:
            if (m.get("name") or "").lower().startswith(q):
                return m
        return None

    # Try SRD exact -> SRD startswith -> SRD first result
    monster = exact_match(srd_results) or startswith_match(srd_results)
    if not monster and srd_results:
        monster = srd_results[0]

    # 2) If SRD has nothing, broaden search (still try exact first)
    if not monster:
        all_results = fetch_all({"search": query}, max_pages=3)
        if isinstance(all_results, dict) and all_results.get("_error"):
            return {
                "found": False,
                "message": "Open5e timed out (slow response). Try again, or enter HP/AC manually."
                if all_results["_error"] == "timeout"
                else "Open5e request failed. Try again later."
            }

        monster = exact_match(all_results) or startswith_match(all_results) or (all_results[0] if all_results else None)

    if not monster:
        return {"found": False, "message": f"No monster found for '{query}'"}

    return {
        "found": True,
        "name": monster.get("name"),
        "armor_class": monster.get("armor_class"),
        "hit_points": monster.get("hit_points"),
        "document": (monster.get("document__slug") or monster.get("document")),
        "slug": monster.get("slug"),
    }