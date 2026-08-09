<div align="center">
  
  <img src="frontend/public/favicon.ico" alt="Cardiosense AI Logo" width="120" />

  # Cardiosense AI
  **Clinical Cardiac Signal Screening & Explainability Platform**
  
  <p align="center">
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <br/>
    <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
    <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Deep_Learning-FF6F00?style=for-the-badge&logo=keras&logoColor=white" alt="Deep Learning" /></a>
  </p>

</div>

---

## 📖 Overview

**Cardiosense AI** is an advanced, AI-assisted research and clinical screening prototype designed to democratize cardiac health monitoring. By analyzing complex electrophysiological (ECG) and optical (PPG) waveforms, our platform provides rapid, explainable insights and risk stratification, empowering both patients and healthcare professionals.

## 🚀 Key Features

*   **⚡ Real-Time Signal Analysis**: Upload raw CSV/TXT/EDF clinical waveform data (ECG/PPG) for instant cardiovascular analysis.
*   **🧠 Explainable AI (XAI)**: We don't just provide a classification. Our interactive interface highlights the exact segments of the cardiac waveform that the AI model focused on to make its prediction, building clinical trust.
*   **🌍 Multi-Language PDF Reporting**: Generate formal clinical reports in multiple regional languages (English, Hindi, Tamil, Telugu, Gujarati, Marathi, Bengali) using a robust native PDF rendering engine to ensure complex fonts are displayed flawlessly.
*   **👨‍⚕️ Role-Based Portals**: Secure, tailored dashboards for Patients, Doctors, and Administrators to manage recordings and patient cohorts efficiently.
*   **🎨 Stunning UI/UX**: Built with modern web design principles featuring smooth animations, light/dark modes, and interactive elements for a highly premium user experience.

---

## 🏗 Architecture & Flow

```mermaid
graph TD;
    Client["Client (Next.js / React)"] -->|Uploads ECG/PPG CSV| API["FastAPI Backend"];
    API -->|Data Preprocessing| ML["Deep Learning Inference Engine"];
    ML -->|Risk Stratification & XAI Heatmaps| API;
    API -->|JSON Response| Client;
    
    Client -->|Renders Interactive Charts| UI["Clinical Dashboard"];
    UI -->|Triggers Report Generation| PDF["Local Multi-Language PDF Engine"];
```

---

## ⚙️ Installation & Setup

To run Cardiosense AI locally on your machine, follow these steps.

### 1. Clone the repository
```bash
git clone https://github.com/Tusharjain-19/cardiosense_ai.git
cd cardiosense_ai
```

### 2. Frontend Setup (Next.js)
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).
```bash
cd frontend
npm install
npm run dev
```
*The frontend will start at `http://localhost:3000`.*

### 3. Backend Setup (FastAPI & Python)
Ensure you have [Python](https://www.python.org/) installed (3.10+ recommended).
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
uvicorn main:app --reload
```
*The backend API will start at `http://localhost:8000`.*

---

## 📂 Project Structure

```text
cardiosense_ai/
├── frontend/                 # Next.js 14 App Router
│   ├── src/
│   │   ├── app/              # Page routes (Dashboard, Upload, Doctor Portal)
│   │   ├── components/       # Reusable UI elements & Interactive charts
│   │   ├── context/          # Global State & Language Localization (i18n)
│   │   └── utils/            # Native PDF generation engine & utilities
│   └── public/               # Static assets & Sample clinical recordings
│
├── backend/                  # FastAPI Python Server
│   ├── main.py               # Core API routing
│   └── requirements.txt      # Python dependencies
└── README.md
```

---

## 🛠️ Technology Stack

### Frontend Architecture
*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Charting**: [Recharts](https://recharts.org/) (Interactive clinical graphs)
*   **PDF Generation**: Native browser rendering via `html2canvas` & `jsPDF` for unparalleled multi-language support.

### Backend Infrastructure
*   **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) (High-performance Python routing)
*   **Language**: [Python 3.10+](https://www.python.org/)
*   **Machine Learning**: Pre-trained deep learning inference algorithms for physiological signal classification.

---

## 🤝 The Team

| Name | Role |
| :--- | :--- |
| **[Niranjan K](https://github.com/Niranjan-png)** | Head of Tech (Backend) |
| **[Tushar Jain](https://tusharjain.in)** | Assistant (Frontend) |

---

## ⚠️ Medical Disclaimer

**Important:** Cardiosense AI is a research and screening prototype. The deep learning models, algorithms, and generated reports provided by this application **do not constitute a formal medical diagnosis**, medical advice, or a definitive clinical evaluation. The system is designed to assist, not replace, certified healthcare professionals. 

If you are experiencing chest pain, shortness of breath, or any medical emergency, please seek immediate medical attention or call your local emergency services.

---

<div align="center">
  <p>&copy; 2026 Cardiosense AI Team. All rights reserved.</p>
</div>
