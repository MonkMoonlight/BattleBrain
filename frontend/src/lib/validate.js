export function validateStats({ partyHp, partyAc, enemyHp, enemyAc }) {
  const errors = {};

  const hpMin = 1;
  const acMin = 1;

  if (!Number.isFinite(partyHp) || partyHp < hpMin) errors.partyHp = "Party HP must be 1 or higher.";
  if (!Number.isFinite(enemyHp) || enemyHp < hpMin) errors.enemyHp = "Enemy HP must be 1 or higher.";

  if (!Number.isFinite(partyAc) || partyAc < acMin) errors.partyAc = "Party AC must be 1 or higher.";
  if (!Number.isFinite(enemyAc) || enemyAc < acMin) errors.enemyAc = "Enemy AC must be 1 or higher.";

  return errors;
}

export function difficultyLabel(winProb) {
  if (winProb >= 0.75) return { label: "Safe", tone: "safe" };
  if (winProb >= 0.45) return { label: "Risky", tone: "risky" };
  return { label: "Deadly", tone: "deadly" };
}
