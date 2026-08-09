# CardioAI Frontend — Product Requirements Document

**Product:** CardioAI — AI-Assisted Cardiac Screening Platform  
**Version:** 1.0  
**Date:** August 2026  
**Status:** Hackathon Build  

---

## 📋 Document Overview

This PRD defines all frontend requirements for CardioAI. It is organized by:
- Product vision & scope
- User personas & journeys
- Feature specifications (organized by priority)
- Technical architecture
- UI/UX guidelines
- Implementation roadmap

---

## 🎯 Product Vision

**CardioAI** is an AI-assisted cardiac screening platform that enables users to upload ECG/PPG signals, visualize waveforms, receive AI-powered predictions with explainability, track health trends, and generate screening reports.

**Key positioning:**
- **NOT** a diagnostic tool
- **IS** a screening/research prototype
- Emphasizes transparency, explainability, and human-in-the-loop workflows

---

## 👥 User Personas

### Persona 1: Patient/User (Primary)
- **Goal:** Upload ECG/PPG recordings and understand AI results
- **Pain points:** Confusion about what results mean, unclear signal quality, no historical context
- **Needs:** Clear visualization, easy upload, understandable explanations, trend tracking

### Persona 2: Healthcare Professional/Doctor (Secondary)
- **Goal:** Review multiple patient recordings and validate AI predictions
- **Pain points:** Manual review of many results, no unified dashboard, unclear prioritization
- **Needs:** Multi-patient dashboard, clear alerts, review interface, downloadable reports

### Persona 3: Admin/Data Manager (Tertiary)
- **Goal:** Monitor system health, manage users, track model performance
- **Pain points:** No visibility into system status, user management overhead
- **Needs:** Admin dashboard, user management, model metrics, error logs

---

## 🚀 Core User Journeys

### Journey 1: Patient First-Time Analysis
```
Sign Up → Login → Dashboard → Upload ECG → 
Quality Check → AI Prediction → Results → Report Download
```

### Journey 2: Patient Trend Monitoring
```
Login → Dashboard → View History → Compare Results → 
Generate Trend Report → Ask AI Questions
```

### Journey 3: Doctor Patient Review
```
Login → Assigned Patients → Select Patient → 
Review Recording → Mark Confidence → Generate Report
```

---

## 📦 Feature Specifications

Features are organized by **PRIORITY TIER** and **MODULE**.

### 🔴 TIER 1: MUST HAVE (Hackathon MVP)

#### 1.1 Authentication & User Management

**Feature:** User Registration & Login

| Requirement | Specification |
|---|---|
| **Scope** | Email/password signup & login, forgot password, logout |
| **UI** | Clean form with email/password fields, remember me option |
| **Validation** | Email format, password strength, session persistence |
| **Error handling** | Invalid credentials, account locked (after 5 attempts), network error |
| **API Integration** | POST /auth/register, POST /auth/login, POST /auth/logout |
| **Security** | HTTPS only, JWT tokens, secure token storage (httpOnly cookies) |

**Acceptance Criteria:**
- [ ] User can create account with email and password
- [ ] User can log in with valid credentials
- [ ] Invalid credentials show clear error message
- [ ] Session persists across page refresh
- [ ] Logout clears session and redirects to login

---

**Feature:** User Profile Setup

| Requirement | Specification |
|---|---|
| **Scope** | Collect minimal user info: name, age, gender, height, weight |
| **UI** | Simple form (no unnecessary fields for hackathon) |
| **Storage** | User ID tied to all analyses |
| **Optional** | Medical history (future) |

**Acceptance Criteria:**
- [ ] User can complete profile after signup
- [ ] Profile data is displayed on dashboard
- [ ] User can edit profile information

---

#### 1.2 Main Dashboard

**Feature:** User Dashboard (Post-Login)

| Requirement | Specification |
|---|---|
| **Cards** | Total Analyses, Normal, Needs Review, Poor Quality |
| **Quick stats** | Latest heart rate, latest AI result, model confidence, signal quality |
| **Buttons** | + New Analysis, View History, View Reports |
| **Layout** | Responsive grid (4 cards on desktop, 2 on tablet, 1 on mobile) |
| **Real-time updates** | Show latest analysis without page refresh |

**Dashboard Card Specification:**

```
┌─────────────────────┐
│   Total Analyses    │
│        12           │
└─────────────────────┘

┌─────────────────────┐
│      Normal         │
│         8           │
└─────────────────────┘

┌─────────────────────┐
│   Needs Review      │
│         3           │
└─────────────────────┘

┌─────────────────────┐
│   Poor Quality      │
│         1           │
└─────────────────────┘
```

**Recent Activity Section:**

```
Latest Analysis
Date: Today, 2:30 PM
Type: ECG
Heart Rate: 72 BPM
AI Result: Normal
Confidence: 96.8%
Quality: Good
```

**Acceptance Criteria:**
- [ ] All 4 cards display correct counts
- [ ] Dashboard loads within 2 seconds
- [ ] Latest analysis updates immediately after new upload
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] All navigation buttons are functional

---

#### 1.3 ECG/PPG Upload

**Feature:** File Upload Interface

| Requirement | Specification |
|---|---|
| **Supported formats** | CSV, TXT, EDF |
| **File size limit** | 100 MB |
| **UI** | Drag-and-drop + file picker button |
| **Validation** | Before sending to backend |
| **Feedback** | Upload progress, success/error messages |

**Upload Component Spec:**

```
┌────────────────────────────────────┐
│     Upload ECG / PPG Signal        │
│                                    │
│  Drag & Drop your file here        │
│                                    │
│        or                          │
│                                    │
│   [ Choose File ]                  │
│                                    │
│   Supported: CSV, TXT, EDF         │
│   Max size: 100 MB                 │
└────────────────────────────────────┘

[ Analyze Signal ]  (disabled until valid file)
```

**Pre-Upload Validation:**
- File size < 100 MB
- File format is CSV/TXT/EDF
- File is not corrupted

**Post-Upload Validation** (backend will handle):
- Sampling frequency valid
- Number of samples sufficient
- Data format correct
- No missing values (or acceptable amount)

**Acceptance Criteria:**
- [ ] Drag-and-drop accepts valid file formats
- [ ] File picker works on all browsers
- [ ] Upload progress bar shows percentage
- [ ] Invalid files show specific error message
- [ ] Analyze button disabled until valid file selected
- [ ] Success message after upload
- [ ] User redirected to signal visualization

---

#### 1.4 Raw Signal Visualization

**Feature:** Waveform Display

| Requirement | Specification |
|---|---|
| **Chart library** | Recharts or Chart.js or ECharts (any production-grade library) |
| **Signals shown** | ECG or PPG waveform with amplitude over time |
| **X-axis** | Time (seconds) |
| **Y-axis** | Amplitude (mV or arbitrary units) |
| **Controls** | Zoom, pan, reset, time selection |
| **Time window** | 0–5s, 5–10s, 10–15s quick buttons |
| **Full screen** | Toggle full-screen graph view |

**Waveform Display Spec:**

```
Signal Visualization

┌──────────────────────────────────────┐
│         ECG Waveform                 │
│                                      │
│     /\        /\        /\           │
│    /  \      /  \      /  \          │
│___/    \____/    \____/    \____     │
│                                      │
│  0s    5s    10s   15s    20s        │
└──────────────────────────────────────┘

Time Range:
[ 0–5s ]  [ 5–10s ]  [ 10–15s ]

Controls:
[ 🔍+ ]  [ 🔍- ]  [ ↔️ Pan ]  [ ↻ Reset ]  [ ⛶ Full Screen ]
```

**Chart Interactions:**
- Zoom: Scroll wheel or pinch to zoom in/out
- Pan: Click and drag to move left/right
- Time window: Click quick buttons to jump to time range
- Reset: Return to original view

**Acceptance Criteria:**
- [ ] Waveform renders within 1 second of upload
- [ ] Chart is smooth and responsive
- [ ] Zoom works (5x magnification min)
- [ ] Pan works smoothly without lag
- [ ] Time window buttons update chart correctly
- [ ] Full-screen view is usable on desktop
- [ ] Mobile: Pinch-to-zoom works

---

#### 1.5 Signal Quality Assessment

**Feature:** AI Signal Quality Detection

| Requirement | Specification |
|---|---|
| **Display** | Quality percentage (0–100%) with visual indicator |
| **Categories** | Green (Good: 80–100%), Yellow (Moderate: 50–79%), Red (Poor: <50%) |
| **Factors** | Noise level, missing samples, baseline drift, saturation |
| **Poor signal response** | Show message: "The recording contains significant noise. AI analysis may be unreliable." |
| **Timing** | Display after preprocessing (during analysis) |

**Quality Display Spec:**

```
SIGNAL QUALITY

        91%

██████████████████░░  (progress bar with color)

🟢 GOOD QUALITY

Quality Score: 91%
Noise Level: Low
Baseline Stability: Excellent
Signal Duration: Valid
```

**Acceptance Criteria:**
- [ ] Quality score displays after upload
- [ ] Color indicator matches quality level
- [ ] Explanation shows quality factors
- [ ] Poor signal shows warning message
- [ ] User can proceed or re-upload decision is clear

---

#### 1.6 AI Classification Result

**Feature:** Prediction Display

| Requirement | Specification |
|---|---|
| **Prediction classes** | Normal, Bradycardia, Tachycardia, Irregular Rhythm, Other |
| **Display format** | Large, clear, centered on screen |
| **Confidence** | Percentage (0–100%) with visual bar |
| **Color coding** | Green (Normal), Yellow (Review), Red (Abnormal) |
| **UI** | Card layout with large text |

**Result Display Spec:**

```
AI PREDICTION

┌────────────────────────────────────┐
│           TACHYCARDIA              │
│                                    │
│    Model Confidence: 91.4%         │
│                                    │
│    ████████████████░░ 91%          │
│                                    │
│    Normal        5.2%              │
│    Bradycardia   1.4%              │
│    Tachycardia  91.4%              │
│    Other         2.0%              │
└────────────────────────────────────┘
```

**Confidence interpretation:**
- 🟢 High (>85%): High confidence in prediction
- 🟡 Moderate (65–85%): Moderate confidence
- 🔴 Low (<65%): Low confidence, recommend review

**Acceptance Criteria:**
- [ ] Prediction displays prominently
- [ ] Confidence percentage shown
- [ ] Confidence bar visual and color-coded
- [ ] Class distribution shown
- [ ] User understands this is not a diagnosis

---

#### 1.7 Heart Rate Analysis

**Feature:** Heart Rate Calculation & Display

| Requirement | Specification |
|---|---|
| **Metrics** | Average BPM, Min BPM, Max BPM, beat-to-beat intervals |
| **ECG-specific** | RR intervals |
| **PPG-specific** | Pulse intervals |
| **Display** | Card with metrics table |

**Heart Rate Card Spec:**

```
Heart Rate Analysis

Average Heart Rate
┌──────────────────┐
│     72 BPM       │
└──────────────────┘

Detailed Metrics:
┌─────────────────────┐
│ Minimum: 68 BPM    │
│ Average: 72 BPM    │
│ Maximum: 79 BPM    │
│ Variability: Low   │
└─────────────────────┘
```

**Acceptance Criteria:**
- [ ] Heart rate calculates and displays correctly
- [ ] Min/max/average shown in table
- [ ] Metrics update with different recordings
- [ ] Display matches actual model output

---

#### 1.8 Analysis History

**Feature:** View Past Analyses

| Requirement | Specification |
|---|---|
| **Display** | Table with columns: Date, Type, Result, Confidence, Quality |
| **Pagination** | Show 10 per page, pagination controls |
| **Sorting** | By date (newest first), by result type |
| **Click to view** | Click any row to open full analysis details |
| **Actions** | Download report, delete analysis (own data only) |

**History Table Spec:**

```
Analysis History

┌────────┬───────┬──────────────┬────────────┬─────────┐
│ Date   │ Type  │ Result       │ Confidence │ Quality │
├────────┼───────┼──────────────┼────────────┼─────────┤
│ Aug 8  │ ECG   │ Normal       │ 96.8%      │ Good    │
│ Aug 6  │ ECG   │ Normal       │ 94.2%      │ Good    │
│ Aug 4  │ PPG   │ Needs Review │ 61.3%      │ Moderate│
│ Aug 1  │ ECG   │ Tachycardia  │ 89.4%      │ Good    │
└────────┴───────┴──────────────┴────────────┴─────────┘

[ ← Previous ]  Page 1 of 3  [ Next → ]
```

**Acceptance Criteria:**
- [ ] History table loads and displays correctly
- [ ] Click row opens analysis detail page
- [ ] Pagination works (if >10 analyses)
- [ ] Sorting by date works
- [ ] Delete confirmation appears before deletion
- [ ] Table responsive on mobile (collapse columns)

---

### 🟠 TIER 2: HIGH-VALUE (Add if time permits)

#### 2.1 Explainable AI Visualization

**Feature:** Model Attention/Focus Area Highlighting

| Requirement | Specification |
|---|---|
| **Display** | Waveform with highlighted region(s) where model focused |
| **Highlighting method** | Color overlay or shaded region on waveform |
| **Time range** | Show exact seconds (e.g., "3.2–4.1 sec") |
| **Explanation** | "This signal segment influenced the model's prediction" |
| **UI** | Highlight shown on main waveform, with annotation |

**Explainable AI Spec:**

```
WAVEFORM WITH AI FOCUS

┌──────────────────────────────────────┐
│         ECG Waveform                 │
│                                      │
│     /\        ████    /\             │
│    /  \      /████\  /  \            │
│___/    \____/████ \__/    \____      │
│           ↑ Model attention  ↑       │
│                                      │
│  0s    5s    10s   15s    20s        │
└──────────────────────────────────────┘

AI Focus Area
Timeframe: 3.2–4.1 seconds
Significance: This signal segment had the 
strongest influence on the model's 
tachycardia classification.
```

**Important disclaimer:** "This region influenced the model's prediction, not necessarily a medical indicator."

**Acceptance Criteria:**
- [ ] Highlighted region displays on waveform
- [ ] Time range accurate and shown
- [ ] Disclaimer clearly visible
- [ ] Highlight easy to distinguish from normal waveform
- [ ] Works on mobile/desktop

---

#### 2.2 AI Screening Summary

**Feature:** Complete Analysis Summary Card

| Requirement | Specification |
|---|---|
| **Sections** | Prediction, Confidence, Heart Rate, Signal Quality, Model Observation |
| **Model observation** | Plain language summary (e.g., "Elevated heart rate detected in the analyzed recording.") |
| **Tone** | Factual, not alarmist |
| **Layout** | Card with sections |

**Summary Card Spec:**

```
AI ANALYSIS SUMMARY

Prediction
Tachycardia

Confidence
91%

Heart Rate
126 BPM

Signal Quality
Good (91%)

Model Observation
Elevated heart rate detected in the 
analyzed recording. This result is an 
AI screening output, not a diagnosis.

[ View Detailed Analysis ]  [ Download Report ]
```

**Acceptance Criteria:**
- [ ] Summary displays all required sections
- [ ] Text is clear and non-technical
- [ ] Disclaimer prominent
- [ ] Buttons link to appropriate actions

---

#### 2.3 Heart Rate Trend Graph

**Feature:** Historical Heart Rate Tracking

| Requirement | Specification |
|---|---|
| **Graph type** | Line chart showing BPM over time |
| **X-axis** | Date (last 30 days by default) |
| **Y-axis** | BPM (60–120 range, adaptive) |
| **Data points** | Each analysis shown as dot on line |
| **Interactivity** | Hover shows exact date/BPM, click to view analysis |
| **Time filter** | Last 7 days, Last 30 days, Last 90 days buttons |

**Trend Graph Spec:**

```
Heart Rate Trend (Last 30 Days)

BPM
120 |               ●
100 |          ●         ●
 80 | ●   ●          ●       ●
 60 |
    └──────────────────────────────
      M  T  W  T  F  S  S  M  T  W

Filters:  [ Last 7 Days ]  [ Last 30 Days ]  [ Last 90 Days ]

Average: 78 BPM
Trend: Stable
```

**Acceptance Criteria:**
- [ ] Graph displays correctly with sample data
- [ ] Hover tooltip shows date and BPM
- [ ] Time filters work
- [ ] Line connects data points smoothly
- [ ] Responsive on mobile (rotatable/scrollable)

---

#### 2.4 Anomaly Detection Indicator

**Feature:** Show Unusual Pattern Detection

| Requirement | Specification |
|---|---|
| **Display** | Anomaly score (0–1 or 0–100) with explanation |
| **Threshold** | Scores >0.7 flagged as "unusual pattern detected" |
| **UI** | Card with score bar and interpretation |
| **Context** | Compare to user's baseline if available |

**Anomaly Detection Spec:**

```
ANOMALY DETECTION

Anomaly Score

0.76

████████████░░░░

Unusual pattern detected.

Comparison to your baseline:
Previous anomaly average: 0.42
Current recording: 0.76
Change: +0.34 (Increased)
```

**Acceptance Criteria:**
- [ ] Anomaly score displays
- [ ] Score is color-coded (green/yellow/red)
- [ ] Interpretation is clear
- [ ] Baseline comparison shown if available

---

#### 2.5 PDF Report Generation

**Feature:** Download Analysis Report

| Requirement | Specification |
|---|---|
| **Sections** | Patient info, recording info, signal quality, HR stats, AI classification, confidence, waveform image, disclaimer |
| **Format** | Clean, professional PDF |
| **Branding** | CardioAI header/footer |
| **Disclaimer** | Prominent "Not a medical diagnosis" statement |
| **Download button** | On results page and analysis detail page |

**PDF Report Structure:**

```
═══════════════════════════════════════
              CARDIOAI
        CARDIAC SCREENING REPORT
═══════════════════════════════════════

Patient Information
─────────────────────
Patient ID: P001
Name: John Doe
Age: 45
Gender: Male
Date Generated: Aug 8, 2026

Recording Information
─────────────────────
Recording ID: ECG_001
Type: ECG
Date of Recording: Aug 8, 2026, 2:30 PM
Duration: 30 seconds

Signal Quality
──────────────
Quality Score: 91%
Status: GOOD

Heart Rate Analysis
───────────────────
Average: 72 BPM
Minimum: 68 BPM
Maximum: 79 BPM
Variability: Low

AI Classification
─────────────────
Prediction: NORMAL
Confidence: 96.8%

[Waveform Image Here]

AI Observation
───────────────
No significant abnormal pattern was 
detected by the current model.

═══════════════════════════════════════
DISCLAIMER

This report is generated by CardioAI, 
an AI screening prototype. Results are 
not a medical diagnosis. Consult a 
healthcare professional for evaluation.
═══════════════════════════════════════
```

**Acceptance Criteria:**
- [ ] PDF downloads without errors
- [ ] All sections included and readable
- [ ] Waveform image embedded correctly
- [ ] Professional formatting
- [ ] Disclaimer clear and prominent

---

#### 2.6 CardioAI Assistant (AI Chat)

**Feature:** In-App Q&A Chatbot

| Requirement | Specification |
|---|---|
| **Scope** | Answer questions about current analysis results only |
| **Questions** | "Why was my result flagged?", "What does confidence mean?", "Why is signal quality low?" |
| **Architecture** | Backend LLM + current analysis data (no hallucination) |
| **Tone** | Friendly, explanatory, non-diagnostic |
| **Limitations** | Does not provide medical advice; always disclaims |

**AI Assistant Chat Spec:**

```
Ask CardioAI

┌─────────────────────────────────────┐
│ Why was my signal flagged?          │
│ What does confidence mean?          │
│ Why is my signal quality low?       │
│ Explain my report                   │
│ What should I do next?              │
│ (+ Any custom question)             │
└─────────────────────────────────────┘

User: "Why was I marked as tachycardia?"

CardioAI: "Your recording showed an 
average heart rate of 126 BPM, which 
the model classified as tachycardia with 
91% confidence. This is an AI screening 
result and should not replace medical 
evaluation by a healthcare professional."

[ Thumbs up ]  [ Thumbs down ]
```

**Safe Response Example:**

User question → Extract analysis data → Format for LLM → LLM generates explanation → Add disclaimer → Display

**Acceptance Criteria:**
- [ ] Chat interface appears on results page
- [ ] User can type and submit questions
- [ ] Responses appear in chat bubble
- [ ] Responses reference actual analysis data
- [ ] Disclaimer always included
- [ ] Response time <3 seconds

---

### 🟢 TIER 3: NICE-TO-HAVE (If substantial time remains)

#### 3.1 Doctor Dashboard (Multi-Patient)

**Feature:** Healthcare Professional Patient List

| Requirement | Specification |
|---|---|
| **View** | List of assigned patients with latest analysis status |
| **Columns** | Patient name, latest result, confidence, signal quality, date |
| **Quick actions** | Click to review, download report, send message |
| **Filtering** | By result type (Normal, Needs Review, Poor Quality) |
| **Sorting** | By date, by result type, alphabetical |

**Doctor Dashboard Spec:**

```
My Assigned Patients

Filter by:
[ All ]  [ Normal ]  [ Needs Review ]  [ Poor Quality ]

┌──────────────────┬──────────────┬────────────┬──────────┐
│ Patient Name     │ Latest Result│ Confidence │ Quality  │
├──────────────────┼──────────────┼────────────┼──────────┤
│ John Doe (P001)  │ Normal       │ 96.8%      │ Good     │
│ Jane Smith (P002)│ Needs Review │ 67%        │ Moderate │
│ Bob Johnson(P003)│ Normal       │ 94.2%      │ Good     │
└──────────────────┴──────────────┴────────────┴──────────┘

[ Review ]  [ Download Report ]  [ View History ]
```

**Acceptance Criteria:**
- [ ] Doctor sees assigned patients only
- [ ] Filter buttons work
- [ ] Sorting works
- [ ] Click opens patient review interface
- [ ] Download report button functional

---

#### 3.2 Human-in-the-Loop Review

**Feature:** Doctor Validation Interface

| Requirement | Specification |
|---|---|
| **Display** | AI result + waveform + option to confirm/flag |
| **Actions** | "Confirm AI Result", "Needs Further Review", "AI Result Not Reliable" |
| **Notes** | Doctor can add notes on the analysis |
| **Save** | Review saved to database with timestamp |

**Review Interface Spec:**

```
Patient: John Doe (P001)

AI PREDICTION: TACHYCARDIA
Confidence: 91%
Heart Rate: 126 BPM
Signal Quality: Good

[Waveform displayed]

Doctor Review

Your Assessment:
( ) Confirm AI Result
( ) Needs Further Review
( ) AI Result Not Reliable

Additional Notes:
[Text field]

[ Save Review ]
```

**Acceptance Criteria:**
- [ ] Doctor can view AI result clearly
- [ ] Assessment options available
- [ ] Notes field functional
- [ ] Save updates database
- [ ] Confirmation message on save

---

#### 3.3 Smart Alerts System

**Feature:** Flag Important Analyses

| Requirement | Specification |
|---|---|
| **Triggers** | Low confidence (<65%), poor signal, abnormal result, repeated abnormal |
| **Display** | Alert badge on dashboard and history |
| **Notification** | (Optional) In-app notification |
| **Message** | "⚠️ New Review Required: Patient P002 has a new analysis requiring manual review" |

**Alert Display Spec:**

```
Dashboard

┌────────────────────────────────────┐
│ ⚠️ Alerts                           │
│                                    │
│ New Review Required (3)            │
│ Patient P002: Confidence 53%       │
│ Patient P005: Poor Signal Quality  │
│ Patient P008: Abnormal Pattern     │
└────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Alerts display on dashboard
- [ ] Alerts linked to specific analyses
- [ ] Doctor can dismiss alerts
- [ ] Alert count updates in real-time

---

### 🔵 TIER 4: FUTURE / OUT OF SCOPE

These features are beyond the hackathon scope but documented for reference:

- ESP32/MAX30102 sensor integration
- Real-time Bluetooth streaming
- Wearable smartwatch integration
- Mobile native app (iOS/Android)
- Multi-hospital network integration
- HIPAA compliance certification
- Advanced admin panel with user analytics
- A/B model comparison UI
- Personalized risk scoring

---

## 🎨 Design & UI Guidelines

### Color Scheme

**Primary:**
- Brand: #2563eb (Blue)
- Accent: #10b981 (Green)

**Status Colors:**
- 🟢 Good/Normal: #10b981 (Green)
- 🟡 Moderate/Review: #f59e0b (Amber)
- 🔴 Poor/Abnormal: #ef4444 (Red)

**Neutrals:**
- Background: #f9fafb (Light Gray)
- Card: #ffffff (White)
- Text: #111827 (Dark Gray)
- Border: #e5e7eb (Light Gray)

### Typography

- **Headlines:** Inter, 28px–32px, bold (600)
- **Subheadings:** Inter, 18px–20px, semibold (600)
- **Body:** Inter, 14px–16px, regular (400)
- **Captions:** Inter, 12px, regular (400)

### Spacing

- Padding: 8px, 16px, 24px, 32px (consistent grid)
- Margins: 16px, 24px, 32px
- Card padding: 24px
- Gap between cards: 16px

### Components

**Buttons:**
- Primary: Blue background, white text, 12px padding, rounded corners (6px)
- Secondary: White background, blue text, border
- Disabled: Gray background, gray text (50% opacity)

**Cards:**
- White background, subtle shadow, rounded corners (8px), 24px padding
- Border: 1px light gray

**Forms:**
- Input field: 12px height, 12px padding, border, focus state
- Labels: Above input, 12px, semibold
- Error messages: Red text, 12px

**Tables:**
- Striped rows (alternating background)
- Hover state: Light blue background
- Responsive: Hide columns on mobile, use card layout

---

## 📱 Responsive Design

### Desktop (1024px+)
- 2-column layout for cards
- Full-size waveform chart
- Side navigation (if applicable)
- Multi-column tables

### Tablet (768px–1023px)
- Single-column card layout
- Waveform chart takes full width
- Stack-friendly tables
- Touch-friendly buttons (44px min height)

### Mobile (320px–767px)
- Single-column layout
- Waveform in collapsible card
- Vertical stacked tables (card per row)
- Bottom navigation
- Large touch targets (48px)

---

## 🔒 Security & Privacy

### Frontend Security
- No sensitive data in localStorage (use secure httpOnly cookies)
- Sanitize user input (prevent XSS)
- HTTPS only
- Never log API keys or tokens to console

### Privacy
- User ECG/PPG data is theirs; explain data handling upfront
- GDPR/privacy notice on signup
- User can request data deletion (future)
- Doctor/patient data separated by access control

---

## ⚙️ Technical Architecture

### Frontend Stack (Recommended)

| Layer | Technology |
|---|---|
| **Framework** | React 18+ or Next.js 13+ |
| **UI Components** | Tailwind CSS or Material-UI |
| **Charts** | Recharts, Chart.js, or ECharts |
| **State Management** | TanStack Query (React Query) or Zustand |
| **HTTP Client** | Axios or Fetch API |
| **Authentication** | JWT (stored in httpOnly cookie) |
| **PDF Generation** | jsPDF or similar |
| **Deployment** | Vercel, Netlify, or Render |

### API Integration Points

```
Frontend          Backend API          ML/Processing
─────────────────────────────────────────────────────
Upload file   → POST /api/upload       → Signal stored
              ← File ID, status

Analyze      → POST /api/analyze/{id}  → ML prediction
              ← Prediction, confidence, explanation

Fetch result → GET /api/analysis/{id}  → Results retrieved
              ← Full analysis object

Get history  → GET /api/history        → User's analyses
              ← Array of analyses

Generate PDF → POST /api/report/{id}   → PDF created
              ← PDF file download
```

### Data Models

**Analysis Object:**
```javascript
{
  id: "analysis_001",
  userId: "user_001",
  fileType: "ECG",
  fileName: "ECG_recording.csv",
  uploadedAt: "2026-08-08T14:30:00Z",
  signalQuality: {
    score: 91,
    status: "GOOD",
    factors: { noise: "low", baseline: "stable" }
  },
  heartRate: {
    average: 72,
    min: 68,
    max: 79
  },
  aiPrediction: {
    class: "Normal",
    confidence: 0.968,
    classDistribution: {
      "Normal": 0.968,
      "Bradycardia": 0.014,
      "Tachycardia": 0.014,
      "Other": 0.004
    }
  },
  anomalyScore: 0.42,
  focusArea: { startTime: 3.2, endTime: 4.1 },
  processingTime: 2.3,
  status: "COMPLETED"
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core MVP (Weeks 1–2 of Hackathon)
- [x] Authentication (login/signup)
- [x] Dashboard
- [x] File upload interface
- [x] Waveform visualization
- [x] AI result display
- [x] Signal quality indicator
- [x] Heart rate display
- [x] Analysis history table

**Deliverable:** Basic app with upload→analysis→result flow

---

### Phase 2: Enhanced UX (Weeks 2–3 of Hackathon)
- [x] Explainable AI highlighting
- [x] Heart rate trend graph
- [x] PDF report generation
- [x] Anomaly detection display
- [x] AI assistant chatbot (if backend ready)
- [x] Analysis summary card

**Deliverable:** Polished, feature-complete user-facing product

---

### Phase 3: Healthcare Features (If time + priority)
- [x] Doctor dashboard (multi-patient)
- [x] Review interface
- [x] Smart alerts
- [x] Admin panel

**Deliverable:** End-to-end healthcare workflow

---

### Phase 4: Post-Hackathon
- [ ] Mobile app (React Native)
- [ ] Sensor integration
- [ ] Real-time monitoring
- [ ] Advanced reporting
- [ ] Compliance (HIPAA, GDPR, ISO 13485)

---

## 📊 Success Metrics

### Functional
- [ ] All TIER 1 features functional and tested
- [ ] All TIER 2 features functional (if time allows)
- [ ] <2 second page load time
- [ ] <3 second API response time
- [ ] Zero console errors

### UX
- [ ] User can complete upload→result flow in <30 seconds
- [ ] <3 clicks to view analysis history
- [ ] Mobile responsive and usable
- [ ] All buttons/links functional

### Code Quality
- [ ] No hard-coded API URLs
- [ ] Environment variables for config
- [ ] Code comments on complex logic
- [ ] Consistent component structure
- [ ] No console warnings/errors

---

## 🏆 Judging Demo Sequence

1. **Login:** Show you have authentication
2. **Upload:** Upload a valid ECG file with nice drag-and-drop UX
3. **Processing:** Show signal quality check and progress
4. **Results:** Display AI prediction with confidence, heart rate, quality
5. **Explanation:** Highlight model focus area on waveform
6. **Trend:** Show historical analysis if available
7. **Report:** Download and show PDF report
8. **Disclaimer:** Emphasize "screening prototype, not diagnosis"

**Key talking points:**
- "This is a screening tool, not a diagnostic system."
- "We prioritize explainability and human-in-the-loop validation."
- "Our model achieved 78% accuracy on [dataset]."
- "Here's where the AI focused when making this prediction."

---

## 🐛 Known Limitations & Disclaimers

1. **Model accuracy:** 78% on training data; generalization unknown
2. **Not FDA approved:** This is a research/hackathon prototype
3. **Not a medical diagnosis:** All results require professional review
4. **Data privacy:** Explain data handling upfront
5. **Sensor integration:** Out of scope for hackathon; future work
6. **Offline mode:** Not supported; internet required

---

## 📞 Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 08 Aug 2026 | CardioAI Team | Initial PRD created for hackathon build |

---

## 📝 Sign-Off

**Product Manager:** CardioAI Team  
**Last Updated:** August 8, 2026  
**Status:** Active – Hackathon Build Phase

---

**END OF PRD**

This document is the source of truth for frontend development. All features, UI, and acceptance criteria are defined here. Deviations should be documented and approved.
