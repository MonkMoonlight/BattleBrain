# BattleBrain

BattleBrain is a proof-of-concept web application that predicts tabletop RPG encounter outcomes using machine learning.

This project demonstrates a full-stack workflow:
React frontend → FastAPI backend → ML model inference → Open5e external API.

---

## Tech Stack
- React (Vite)
- FastAPI (Python)
- scikit-learn
- Open5e API

---

## Run Backend

cd backend

# create virtual environment
python -m venv .venv

# activate (PowerShell)
.\.venv\Scripts\Activate.ps1

# install dependencies
pip install fastapi uvicorn scikit-learn requests joblib

# start server
uvicorn main:app --reload

Backend runs at:
http://127.0.0.1:8000

API docs:
http://127.0.0.1:8000/docs

---

## Run Frontend

cd frontend

npm install
npm run dev

Frontend runs at:
http://localhost:5173

---

## Features Demonstrated (Proof of Concept)

- Party/enemy stat input
- Monster lookup via Open5e API
- ML encounter prediction
- Win probability + metrics displayed
- Frontend ↔ backend communication

---

## Project Structure

BattleBrain/
  frontend/
  backend/
