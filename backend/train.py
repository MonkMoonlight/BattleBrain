import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression


def main():
    # Minimal synthetic dataset for the R&D demo:
    # Features: [party_hp, party_ac, enemy_hp, enemy_ac]
    # Label: win (1) or loss (0)
    rng = np.random.default_rng(42)
    n = 2000

    party_hp = rng.integers(40, 250, size=n)
    party_ac = rng.integers(10, 20, size=n)
    enemy_hp = rng.integers(20, 400, size=n)
    enemy_ac = rng.integers(10, 20, size=n)

    # Simple label rule (placeholder for real simulation later)
    score = (party_hp - enemy_hp) + 10 * (party_ac - enemy_ac)
    win = (score > 0).astype(int)

    df = pd.DataFrame({
        "party_hp": party_hp,
        "party_ac": party_ac,
        "enemy_hp": enemy_hp,
        "enemy_ac": enemy_ac,
        "win": win
    })

    # Save dataset (proves data step exists)
    df.to_csv("dataset.csv", index=False)

    X = df[["party_hp", "party_ac", "enemy_hp", "enemy_ac"]].values
    y = df["win"].values

    model = LogisticRegression(max_iter=300)
    model.fit(X, y)

    # Save trained model to disk (proves persistence)
    joblib.dump(model, "model.pkl")

    print("✅ Saved dataset.csv and model.pkl")

if __name__ == "__main__":
    main()
