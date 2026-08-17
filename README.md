# 🚀 AI-Powered Mock Interview Platform & Placement Readiness Engine

> An intelligent, full-stack career preparation platform that simulates real-world technical interviews, analyzes resumes, calculates placement readiness scores, and provides company-specific hiring simulations.

🔗 **Live Demo:** [https://ai-powered-mock-interview-gules.vercel.app/](https://ai-powered-mock-interview-gules.vercel.app/)

---

## ✨ Features

- **🎙️ Adaptive AI Mock Interviews:** Real-time conversational technical interviews with dynamic difficulty scaling, speech-to-text input, and instant feedback.
- **🏢 AI Recruiter Simulator:** Practice tailored interview rounds based on hiring bars of top companies (Google, Amazon, Microsoft, TCS, Infosys, Startups, and Goldman Sachs) with official hiring verdict reports.
- **📊 AI Placement Readiness Engine:** Calculates unified placement readiness scores across resume strength, interview metrics, and technical diagnostic quizzes with personalized roadmaps.
- **📄 Smart Resume Analyzer:** Upload resumes to automatically extract skills, calculate domain fit percentages, and identify technical gaps.
- **📈 Historical Progress Tracking:** Monitor performance trends, score progressions, and interview history over time.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Vercel Analytics
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT Authentication
- **AI & LLM:** Groq SDK (`openai/gpt-oss-20b`), PDF-Parse

---

## 🏃 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/SheikhAsiyaNoor/AI-Powered-Mock-Interview.git
cd AI-Powered-Mock-Interview
```

### 2. Backend Setup
```bash
cd server
npm install
# Create a .env file with: PORT=5000, MONGO_URI, JWT_SECRET, GROQ_API_KEY
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
# Create a .env.local file with: NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
