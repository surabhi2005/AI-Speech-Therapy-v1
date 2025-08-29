# 🗣️ AI-Speech-Therapy-v1

A full-stack AI-powered speech therapy application with:
- **Frontend:** React (UI/UX for patients & therapists)  
- **AI MOdel:** Python (ASR, scoring, interactive sessions)

---

## 📦 Repository Structure
```

AI-Speech-Therapy-v1/
├── reactapp/
│   └── my-app/                # React frontend
└── speech_therapy_ml/         # ML backend
├── api/                   # FastAPI endpoints
├── asr/                   # Automatic Speech Recognition
├── interactive/           # Interactive therapy sessions
├── scoring/               # Scoring & feedback
├── venv/ (ignored)        # Virtual environment
├── .env                   # Environment variables (local only)
└── requirements.txt

````

---

## 🚀 Backend (speech_therapy_ml)

### 1️⃣ Setup (Windows)
```powershell
cd speech_therapy_ml
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
python -m venv venv
venv\Scripts\Activate
pip install -r requirements.txt
````

### 2️⃣ Run API server

```powershell
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

* API runs at: [http://localhost:8000](http://localhost:8000)

---

## 🧪 CLI Examples (Backend)

### Record example (ASR)

```powershell
python asr/record_example.py --mode batch --duration 20
```

### Interactive therapy session

```powershell
python -m interactive.session --duration 4 --age kid
```

### Scoring & feedback

```powershell
python -m scoring.cli_example --mode batch --duration 4 --expected "You are a warm, concise speech-therapy coach." --age kid
```

---

## 🎨 Frontend (reactapp/my-app)

### 1️⃣ Setup

```powershell
cd reactapp/my-app
npm install
```

### 2️⃣ Run frontend

```powershell
npm start
```

* App runs at: [http://localhost:3000](http://localhost:3000)
---
