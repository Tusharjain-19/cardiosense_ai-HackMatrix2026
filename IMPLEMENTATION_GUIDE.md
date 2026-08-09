# Cardiosense AI

Frontend — Step-by-Step Implementation Guide

**Purpose:** Complete, detailed instructions for building a multipage CardioAI web application  
**Tech Stack:** React 18+, Next.js 13+, Tailwind CSS, Recharts, TypeScript  
**Target:** Production-ready hackathon submission

---

## 📐 Architecture Overview

```
cardioai-frontend/
├── public/                    # Static assets
├── src/
│   ├── components/           # Reusable UI components
│   ├── pages/               # Next.js pages (routes)
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API client functions
│   ├── context/             # React Context for state
│   ├── types/               # TypeScript interfaces
│   ├── utils/               # Helper functions
│   ├── styles/              # Global styles
│   └── app.tsx              # Root component
├── .env.local              # Environment variables
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

---

## 🚀 STEP 1: Project Setup (30 minutes)

### 1.1 Create Next.js Project

```bash
# Use create-next-app with TypeScript and Tailwind
npx create-next-app@latest cardioai-frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app

cd cardioai-frontend
```

### 1.2 Install Dependencies

```bash
npm install \
  axios \
  recharts \
  date-fns \
  zustand \
  @tanstack/react-query \
  react-hot-toast \
  lucide-react \
  clsx \
  tailwind-merge \
  jspdf \
  html2canvas

npm install -D typescript @types/react @types/node
```

### 1.3 Project Structure Setup

```bash
# Create folder structure
mkdir -p src/{components,pages,hooks,services,context,types,utils,styles}

# Key folders:
# - components/     → Auth, Dashboard, Upload, Results, Doctor, Admin
# - pages/         → index, login, signup, dashboard, analysis, history, doctor, admin
# - services/      → API client (authService, analysisService, userService)
# - context/       → Global auth state, user state
# - types/         → TypeScript interfaces
# - utils/         → Helpers (formatters, validators, storage)
```

### 1.4 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=CardioAI
NEXT_PUBLIC_APP_VERSION=1.0
```

### 1.5 Tailwind Configuration

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      spacing: {
        card: "24px",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 🏗️ STEP 2: Core Type Definitions (20 minutes)

Create `src/types/index.ts`:

```typescript
// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  height: number;
  weight: number;
  role: "patient" | "doctor" | "admin";
  createdAt: string;
  updatedAt: string;
}

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest extends LoginRequest {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Analysis Types
export interface AnalysisFile {
  file: File;
  type: "ECG" | "PPG";
}

export interface SignalQuality {
  score: number; // 0-100
  status: "GOOD" | "MODERATE" | "POOR";
  factors: {
    noise: "low" | "moderate" | "high";
    baseline: "stable" | "drift" | "unstable";
    saturation: "none" | "partial" | "full";
  };
}

export interface HeartRate {
  average: number;
  min: number;
  max: number;
  variability: "low" | "moderate" | "high";
}

export interface AIPrediction {
  class: string; // 'Normal', 'Bradycardia', 'Tachycardia', etc.
  confidence: number; // 0-1
  classDistribution: Record<string, number>;
}

export interface FocusArea {
  startTime: number;
  endTime: number;
  description: string;
}

export interface Analysis {
  id: string;
  userId: string;
  fileType: "ECG" | "PPG";
  fileName: string;
  uploadedAt: string;
  signalQuality: SignalQuality;
  heartRate: HeartRate;
  aiPrediction: AIPrediction;
  anomalyScore: number;
  focusArea: FocusArea;
  rawSignal: number[]; // Waveform data points
  processingTime: number;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}
```

---

## 🎨 STEP 3: Global Styles & Components Setup (30 minutes)

### 3.1 Create Global Styles

Create `src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-gray-50 text-gray-900 font-sans;
}

/* Utility Classes */
.container-main {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}

.card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors;
}

.btn-danger {
  @apply bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors;
}

.input-field {
  @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.status-good {
  @apply text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium;
}

.status-warning {
  @apply text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm font-medium;
}

.status-danger {
  @apply text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium;
}
```

### 3.2 Create Base Layout Component

Create `src/components/Layout.tsx`:

```typescript
'use client'

import React from 'react'
import Navigation from './Navigation'
import { Toaster } from 'react-hot-toast'

interface LayoutProps {
  children: React.ReactNode
  hideNav?: boolean
}

export default function Layout({ children, hideNav = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNav && <Navigation />}
      <main>
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  )
}
```

### 3.3 Create Navigation Component

Create `src/components/Navigation.tsx`:

```typescript
'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/context/authContext'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navigation() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user) return null

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
          🫀 CardioAI
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6 items-center">
          <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
            Dashboard
          </Link>
          {user.role === 'doctor' && (
            <Link href="/doctor/patients" className="text-gray-700 hover:text-blue-600">
              My Patients
            </Link>
          )}
          {user.role === 'admin' && (
            <Link href="/admin" className="text-gray-700 hover:text-blue-600">
              Admin Panel
            </Link>
          )}
          <Link href="/history" className="text-gray-700 hover:text-blue-600">
            History
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Items */}
      {menuOpen && (
        <div className="md:hidden bg-gray-50 p-4 space-y-2">
          <Link href="/dashboard" className="block text-gray-700 hover:text-blue-600 py-2">
            Dashboard
          </Link>
          <Link href="/history" className="block text-gray-700 hover:text-blue-600 py-2">
            History
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left text-gray-600 hover:text-red-600 py-2"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
```

---

## 🔐 STEP 4: Authentication System (45 minutes)

### 4.1 Create Auth Context

Create `src/context/authContext.ts`:

```typescript
import { create } from "zustand";
import { User, AuthResponse } from "@/types";

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data: AuthResponse = await response.json();
      localStorage.setItem("token", data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (error) {
      console.error("Login failed:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (data: any) => {
    set({ isLoading: true });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const result: AuthResponse = await response.json();
      localStorage.setItem("token", result.token);
      set({ user: result.user, token: result.token, isLoading: false });
    } catch (error) {
      console.error("Signup failed:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  setUser: (user: User) => {
    set({ user });
  },
}));
```

### 4.2 Create Login Page

Create `src/app/login/page.tsx`:

```typescript
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/context/authContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(email, password)
      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (error) {
      toast.error('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">🫀 CardioAI</h1>
          <p className="text-gray-600">AI-Assisted Cardiac Screening Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### 4.3 Create Signup Page

Create `src/app/signup/page.tsx`:

```typescript
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/context/authContext'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const signup = useAuthStore((state) => state.signup)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'height' || name === 'weight' ? parseInt(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signup(formData)
      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error) {
      toast.error('Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">🫀 CardioAI</h1>
          <p className="text-gray-600 text-sm">Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          {/* Age, Gender, Height, Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 STEP 5: Dashboard Page (1 hour)

### 5.1 Create Dashboard Statistics Component

Create `src/components/DashboardStats.tsx`:

```typescript
'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DashboardStatsProps {
  totalAnalyses: number
  normalCount: number
  reviewCount: number
  poorQualityCount: number
  latestAnalysis: any
}

export default function DashboardStats({
  totalAnalyses,
  normalCount,
  reviewCount,
  poorQualityCount,
  latestAnalysis,
}: DashboardStatsProps) {
  const stats = [
    {
      label: 'Total Analyses',
      value: totalAnalyses,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Normal',
      value: normalCount,
      color: 'bg-green-50 border-green-200',
    },
    {
      label: 'Needs Review',
      value: reviewCount,
      color: 'bg-amber-50 border-amber-200',
    },
    {
      label: 'Poor Quality',
      value: poorQualityCount,
      color: 'bg-red-50 border-red-200',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`card ${stat.color} text-center`}
          >
            <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Latest Analysis */}
      {latestAnalysis && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Latest Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Heart Rate</p>
              <p className="text-xl font-bold">{latestAnalysis.heartRate.average} BPM</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">AI Result</p>
              <p className="text-xl font-bold text-blue-600">{latestAnalysis.aiPrediction.class}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Confidence</p>
              <p className="text-xl font-bold">{(latestAnalysis.aiPrediction.confidence * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quality</p>
              <p className={`text-xl font-bold ${
                latestAnalysis.signalQuality.status === 'GOOD'
                  ? 'text-green-600'
                  : latestAnalysis.signalQuality.status === 'MODERATE'
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}>
                {latestAnalysis.signalQuality.status}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 5.2 Create Dashboard Page

Create `src/app/dashboard/page.tsx`:

```typescript
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/context/authContext'
import DashboardStats from '@/components/DashboardStats'
import { Plus, History, FileText } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [analyses, setAnalyses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchAnalyses()
  }, [user])

  const fetchAnalyses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await response.json()
      setAnalyses(data.data || [])
    } catch (error) {
      console.error('Failed to fetch analyses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = () => {
    const normal = analyses.filter((a) => a.aiPrediction.class === 'Normal').length
    const needsReview = analyses.filter((a) => a.aiPrediction.confidence < 0.65).length
    const poorQuality = analyses.filter((a) => a.signalQuality.status === 'POOR').length

    return {
      total: analyses.length,
      normal,
      needsReview,
      poorQuality,
      latest: analyses[0] || null,
    }
  }

  const stats = calculateStats()

  return (
    <div className="container-main">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-gray-600">Monitor your cardiac health with AI screening</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/upload"
          className="flex items-center gap-3 bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          <span className="font-medium">New Analysis</span>
        </Link>
        <Link
          href="/history"
          className="flex items-center gap-3 bg-gray-200 text-gray-900 p-4 rounded-lg hover:bg-gray-300 transition"
        >
          <History size={20} />
          <span className="font-medium">View History</span>
        </Link>
        <button className="flex items-center gap-3 bg-gray-200 text-gray-900 p-4 rounded-lg hover:bg-gray-300 transition">
          <FileText size={20} />
          <span className="font-medium">View Reports</span>
        </button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading your data...</p>
        </div>
      ) : (
        <DashboardStats
          totalAnalyses={stats.total}
          normalCount={stats.normal}
          reviewCount={stats.needsReview}
          poorQualityCount={stats.poorQuality}
          latestAnalysis={stats.latest}
        />
      )}
    </div>
  )
}
```

---

## 📤 STEP 6: Upload Page (1 hour)

### 6.1 Create File Upload Component

Create `src/components/FileUpload.tsx`:

```typescript
'use client'

import React, { useRef, useState } from 'react'
import { Upload, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  onFileSelected: (file: File) => void
  isLoading?: boolean
}

export default function FileUpload({ onFileSelected, isLoading = false }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

  const ALLOWED_TYPES = ['text/csv', 'text/plain', 'application/x-edf']
  const MAX_SIZE = 100 * 1024 * 1024 // 100MB

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.edf')) {
      setError('Invalid file format. Supported: CSV, TXT, EDF')
      return false
    }

    // Check file size
    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum size: 100MB')
      return false
    }

    setError('')
    return true
  }

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelected(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        accept=".csv,.txt,.edf"
        disabled={isLoading}
      />

      <Upload size={40} className="mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Upload ECG / PPG Signal</h3>
      <p className="text-gray-600 mb-4">Drag and drop your file here or click to browse</p>
      <p className="text-sm text-gray-500 mb-6">
        Supported formats: CSV, TXT, EDF (Max 100MB)
      </p>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="btn-primary"
      >
        {isLoading ? 'Uploading...' : 'Choose File'}
      </button>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  )
}
```

### 6.2 Create Upload Page

Create `src/app/upload/page.tsx`:

```typescript
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import toast from 'react-hot-toast'

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'ECG' | 'PPG'>('ECG')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleFileSelected = (file: File) => {
    setSelectedFile(file)
    toast.success('File selected: ' + file.name)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('type', fileType)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      )

      const data = await response.json()
      toast.success('File uploaded! Processing...')
      router.push(`/analysis/${data.data.id}`)
    } catch (error) {
      toast.error('Upload failed. Please try again.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container-main max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Upload ECG / PPG Signal</h1>
      <p className="text-gray-600 mb-8">
        Upload a signal recording to analyze with our AI model
      </p>

      {/* File Type Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Signal Type
        </label>
        <div className="flex gap-4">
          {(['ECG', 'PPG'] as const).map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="fileType"
                value={type}
                checked={fileType === type}
                onChange={(e) => setFileType(e.target.value as 'ECG' | 'PPG')}
                className="w-4 h-4"
              />
              <span className="text-gray-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <FileUpload onFileSelected={handleFileSelected} isLoading={isLoading} />

      {/* Selected File Info */}
      {selectedFile && (
        <div className="mt-6 card bg-blue-50 border-blue-200">
          <p className="text-sm text-gray-600">Selected File:</p>
          <p className="font-medium text-gray-900">{selectedFile.name}</p>
          <p className="text-sm text-gray-600 mt-2">
            Size: {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {/* Analyze Button */}
      <div className="mt-8">
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || isLoading}
          className="w-full btn-primary"
        >
          {isLoading ? 'Uploading & Analyzing...' : 'Analyze Signal'}
        </button>
      </div>
    </div>
  )
}
```

---

## 📊 STEP 7: Analysis Result Page (1.5 hours)

### 7.1 Create Waveform Chart Component

Create `src/components/WaveformChart.tsx`:

```typescript
'use client'

import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface WaveformChartProps {
  data: number[]
  samplingRate?: number
  focusArea?: { startTime: number; endTime: number }
}

export default function WaveformChart({
  data,
  samplingRate = 100,
  focusArea,
}: WaveformChartProps) {
  const [zoomStart, setZoomStart] = useState(0)
  const [zoomEnd, setZoomEnd] = useState(Math.min(500, data.length))

  const SEGMENT_SIZE = 500
  const segments = [
    { label: '0–5s', start: 0, end: samplingRate * 5 },
    { label: '5–10s', start: samplingRate * 5, end: samplingRate * 10 },
    { label: '10–15s', start: samplingRate * 10, end: samplingRate * 15 },
  ]

  const chartData = data.slice(zoomStart, zoomEnd).map((value, idx) => ({
    time: ((zoomStart + idx) / samplingRate).toFixed(2),
    amplitude: value,
    isFocus:
      focusArea &&
      (zoomStart + idx) / samplingRate >= focusArea.startTime &&
      (zoomStart + idx) / samplingRate <= focusArea.endTime,
  }))

  const handleZoomIn = () => {
    const newRange = (zoomEnd - zoomStart) / 2
    setZoomStart(Math.max(0, zoomStart + newRange / 2))
    setZoomEnd(Math.min(data.length, zoomEnd - newRange / 2))
  }

  const handleZoomOut = () => {
    const currentRange = zoomEnd - zoomStart
    setZoomStart(Math.max(0, zoomStart - currentRange / 2))
    setZoomEnd(Math.min(data.length, zoomEnd + currentRange / 2))
  }

  const handleReset = () => {
    setZoomStart(0)
    setZoomEnd(Math.min(500, data.length))
  }

  const handleSegment = (start: number, end: number) => {
    setZoomStart(start)
    setZoomEnd(Math.min(end, data.length))
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
              formatter={(value) => value.toFixed(2)}
            />
            <Line
              type="monotone"
              dataKey="amplitude"
              stroke="#2563eb"
              dot={false}
              isAnimationActive={false}
            />
            {focusArea && (
              <Line
                type="monotone"
                dataKey={(point) => (point.isFocus ? point.amplitude : null)}
                stroke="#f59e0b"
                dot={false}
                name="AI Focus Area"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleZoomIn}
          className="flex items-center gap-1 btn-secondary text-sm"
        >
          <ZoomIn size={16} /> Zoom In
        </button>
        <button
          onClick={handleZoomOut}
          className="flex items-center gap-1 btn-secondary text-sm"
        >
          <ZoomOut size={16} /> Zoom Out
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 btn-secondary text-sm"
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      {/* Time Range Buttons */}
      <div className="flex flex-wrap gap-2">
        {segments.map((segment) => (
          <button
            key={segment.label}
            onClick={() => handleSegment(segment.start, segment.end)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              zoomStart === segment.start && zoomEnd === segment.end
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            {segment.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### 7.2 Create Analysis Result Page

Create `src/app/analysis/[id]/page.tsx`:

```typescript
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import WaveformChart from '@/components/WaveformChart'
import { Analysis } from '@/types'
import { Loader, Download, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const analysisId = params.id as string

  useEffect(() => {
    fetchAnalysis()
  }, [analysisId])

  const fetchAnalysis = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/${analysisId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await response.json()
      setAnalysis(data.data)
    } catch (error) {
      toast.error('Failed to load analysis')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/${analysisId}/report`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analysis_${analysisId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Report downloaded!')
    } catch (error) {
      toast.error('Failed to download report')
    }
  }

  if (isLoading) {
    return (
      <div className="container-main flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={32} />
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="container-main text-center py-12">
        <p className="text-red-600">Analysis not found</p>
      </div>
    )
  }

  const isAbnormal = analysis.aiPrediction.class !== 'Normal'
  const isLowConfidence = analysis.aiPrediction.confidence < 0.65
  const isPoorQuality = analysis.signalQuality.status === 'POOR'

  return (
    <div className="container-main max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analysis Results</h1>
        <p className="text-gray-600">Recorded: {new Date(analysis.uploadedAt).toLocaleString()}</p>
      </div>

      {/* Signal Quality Alert */}
      {isPoorQuality && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-red-900">Poor Signal Quality</p>
            <p className="text-red-800 text-sm">
              The recording contains significant noise. AI analysis may be unreliable.
            </p>
          </div>
        </div>
      )}

      {/* Signal Quality Score */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Signal Quality</h2>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-5xl font-bold text-blue-600">{analysis.signalQuality.score}%</p>
          </div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  analysis.signalQuality.score >= 80
                    ? 'bg-green-600'
                    : analysis.signalQuality.score >= 50
                    ? 'bg-amber-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${analysis.signalQuality.score}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {analysis.signalQuality.status} QUALITY
            </p>
          </div>
        </div>
      </div>

      {/* Waveform */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Signal Waveform</h2>
        <WaveformChart
          data={analysis.rawSignal}
          focusArea={analysis.focusArea}
        />
        {analysis.focusArea && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
            <p className="font-medium text-amber-900">AI Focus Area</p>
            <p className="text-amber-800">
              Time: {analysis.focusArea.startTime.toFixed(2)}–{analysis.focusArea.endTime.toFixed(2)}s
            </p>
            <p className="text-amber-700 text-xs mt-2">
              This signal segment influenced the model's prediction.
            </p>
          </div>
        )}
      </div>

      {/* Heart Rate */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Heart Rate Analysis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Average</p>
            <p className="text-2xl font-bold">{analysis.heartRate.average} BPM</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Minimum</p>
            <p className="text-2xl font-bold">{analysis.heartRate.min} BPM</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Maximum</p>
            <p className="text-2xl font-bold">{analysis.heartRate.max} BPM</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Variability</p>
            <p className="text-2xl font-bold capitalize">{analysis.heartRate.variability}</p>
          </div>
        </div>
      </div>

      {/* AI Prediction */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">AI Prediction</h2>
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">Classification</p>
            <p className={`text-4xl font-bold mb-4 ${
              isAbnormal ? 'text-orange-600' : 'text-green-600'
            }`}>
              {analysis.aiPrediction.class}
            </p>
            <p className="text-sm text-gray-600 mb-2">Model Confidence</p>
            <div className="flex items-center gap-3">
              <div className="w-48 bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    analysis.aiPrediction.confidence >= 0.85
                      ? 'bg-green-600'
                      : analysis.aiPrediction.confidence >= 0.65
                      ? 'bg-amber-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${analysis.aiPrediction.confidence * 100}%` }}
                />
              </div>
              <p className="text-xl font-bold">
                {(analysis.aiPrediction.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Class Distribution */}
          <div className="w-full md:w-64">
            <p className="text-sm text-gray-600 mb-3">Class Distribution</p>
            <div className="space-y-2">
              {Object.entries(analysis.aiPrediction.classDistribution).map(([cls, prob]) => (
                <div key={cls} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{cls}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded h-2">
                      <div
                        className="bg-blue-600 h-2 rounded"
                        style={{ width: `${(prob as number) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {((prob as number) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Warnings */}
        {isLowConfidence && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
            <AlertCircle className="text-amber-600 mt-0.5" size={18} />
            <div>
              <p className="font-medium text-amber-900 text-sm">Low Model Confidence</p>
              <p className="text-amber-800 text-sm">
                The model confidence is below 65%. Manual review recommended.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>⚠️ Important:</strong> This report is generated by CardioAI, an AI screening prototype. Results are not a medical diagnosis. Consult a healthcare professional for evaluation.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-2 btn-primary"
        >
          <Download size={18} /> Download Report
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
```

---

## 📚 STEP 8: History & Analytics Page (45 minutes)

### 8.1 Create History Table Component

Create `src/components/HistoryTable.tsx`:

```typescript
'use client'

import React from 'react'
import Link from 'next/link'
import { Analysis } from '@/types'
import { format } from 'date-fns'

interface HistoryTableProps {
  analyses: Analysis[]
  onDelete?: (id: string) => void
}

export default function HistoryTable({ analyses, onDelete }: HistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-semibold">Date</th>
            <th className="text-left px-4 py-3 text-sm font-semibold">Type</th>
            <th className="text-left px-4 py-3 text-sm font-semibold">Result</th>
            <th className="text-left px-4 py-3 text-sm font-semibold">Confidence</th>
            <th className="text-left px-4 py-3 text-sm font-semibold">Quality</th>
            <th className="text-left px-4 py-3 text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {analyses.map((analysis, idx) => (
            <tr
              key={analysis.id}
              className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}
            >
              <td className="px-4 py-3 text-sm">
                {format(new Date(analysis.uploadedAt), 'MMM dd, yyyy HH:mm')}
              </td>
              <td className="px-4 py-3 text-sm font-medium">{analysis.fileType}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  analysis.aiPrediction.class === 'Normal'
                    ? 'status-good'
                    : 'status-warning'
                }`}>
                  {analysis.aiPrediction.class}
                </span>
              </td>
              <td className="px-4 py-3 text-sm font-medium">
                {(analysis.aiPrediction.confidence * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  analysis.signalQuality.status === 'GOOD'
                    ? 'status-good'
                    : analysis.signalQuality.status === 'MODERATE'
                    ? 'status-warning'
                    : 'status-danger'
                }`}>
                  {analysis.signalQuality.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <Link
                  href={`/analysis/${analysis.id}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {analyses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No analyses yet. Upload your first ECG/PPG signal!</p>
        </div>
      )}
    </div>
  )
}
```

### 8.2 Create History Page

Create `src/app/history/page.tsx`:

```typescript
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import HistoryTable from '@/components/HistoryTable'
import { Analysis } from '@/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

export default function HistoryPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'result'>('date')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await response.json()
      setAnalyses(data.data || [])
    } catch (error) {
      toast.error('Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }

  const getSortedAnalyses = () => {
    if (sortBy === 'date') {
      return [...analyses].sort((a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )
    }
    return analyses
  }

  const trendData = analyses
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    .map((a) => ({
      date: new Date(a.uploadedAt).toLocaleDateString(),
      hr: a.heartRate.average,
      confidence: Math.round(a.aiPrediction.confidence * 100),
    }))

  return (
    <div className="container-main">
      <h1 className="text-3xl font-bold mb-2">Analysis History</h1>
      <p className="text-gray-600 mb-8">View all your previous ECG/PPG analyses</p>

      {/* Trend Graph */}
      {trendData.length > 1 && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">Heart Rate Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hr"
                stroke="#2563eb"
                name="Heart Rate (BPM)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="confidence"
                stroke="#10b981"
                name="AI Confidence (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'result')}
            className="input-field"
          >
            <option value="date">Latest First</option>
            <option value="result">By Result</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading history...</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <HistoryTable analyses={getSortedAnalyses()} />
        </div>
      )}
    </div>
  )
}
```

---

## 🏆 STEP 9: Doctor Dashboard (45 minutes) - TIER 2

### 9.1 Create Doctor Patient List

Create `src/app/doctor/patients/page.tsx`:

```typescript
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/context/authContext'

export default function DoctorPatientsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [patients, setPatients] = useState<any[]>([])
  const [filterBy, setFilterBy] = useState<'all' | 'normal' | 'review' | 'poor'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'doctor') {
      router.push('/dashboard')
      return
    }
    fetchPatients()
  }, [user])

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctor/patients`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await response.json()
      setPatients(data.data || [])
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredPatients = () => {
    if (filterBy === 'all') return patients
    if (filterBy === 'normal')
      return patients.filter((p) => p.latestAnalysis?.aiPrediction.class === 'Normal')
    if (filterBy === 'review')
      return patients.filter((p) => p.latestAnalysis?.aiPrediction.confidence < 0.65)
    if (filterBy === 'poor')
      return patients.filter((p) => p.latestAnalysis?.signalQuality.status === 'POOR')
    return patients
  }

  return (
    <div className="container-main">
      <h1 className="text-3xl font-bold mb-2">My Patients</h1>
      <p className="text-gray-600 mb-8">Review analyses from your assigned patients</p>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {(['all', 'normal', 'review', 'poor'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterBy(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterBy === filter
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            {filter === 'all'
              ? 'All Patients'
              : filter === 'review'
              ? 'Needs Review'
              : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Patients Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading patients...</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">Patient Name</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Latest Result</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Confidence</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Quality</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredPatients().map((patient) => (
                <tr key={patient.id} className="border-b hover:bg-blue-50">
                  <td className="px-4 py-3 text-sm font-medium">{patient.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="status-good">
                      {patient.latestAnalysis?.aiPrediction.class || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {patient.latestAnalysis
                      ? `${(patient.latestAnalysis.aiPrediction.confidence * 100).toFixed(1)}%`
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="status-good">
                      {patient.latestAnalysis?.signalQuality.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/doctor/review/${patient.latestAnalysis?.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {getFilteredPatients().length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No patients match this filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## 🔒 STEP 10: Protection & Error Handling (30 minutes)

### 10.1 Create Auth Guard

Create `src/components/ProtectedRoute.tsx`:

```typescript
'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/context/authContext'
import { Loader } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'patient' | 'doctor' | 'admin'
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isChecking, setIsChecking] = React.useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (requiredRole && user.role !== requiredRole) {
      router.push('/dashboard')
    }
    setIsChecking(false)
  }, [user, router, requiredRole])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin" size={32} />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole && user.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}
```

### 10.2 Create Error Boundary

Create `src/components/ErrorBoundary.tsx`:

```typescript
'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-lg shadow p-8 max-w-md">
            <AlertCircle className="text-red-600 mb-4" size={32} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

## 🚀 STEP 11: Environment & Deployment (30 minutes)

### 11.1 Create Production Build

```bash
# Build optimized production bundle
npm run build

# Test production build locally
npm run start
```

### 11.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_APP_NAME
```

### 11.3 Create .env.production

```env
NEXT_PUBLIC_API_URL=https://api.cardioai.com/api
NEXT_PUBLIC_APP_NAME=CardioAI
NEXT_PUBLIC_APP_VERSION=1.0
```

---

## 📝 Implementation Checklist

### Phase 1: Core MVP ✅

- [ ] Project setup & dependencies
- [ ] Type definitions
- [ ] Auth system (login/signup)
- [ ] Dashboard page
- [ ] File upload
- [ ] Analysis results page
- [ ] History page
- [ ] Navigation & routing

### Phase 2: Polish ✅

- [ ] Explainable AI visualization
- [ ] Heart rate trends
- [ ] PDF report generation
- [ ] Error handling
- [ ] Responsive design
- [ ] Loading states
- [ ] Toast notifications

### Phase 3: Healthcare Features 🔄

- [ ] Doctor dashboard
- [ ] Doctor review interface
- [ ] Admin panel
- [ ] Smart alerts

### Phase 4: Production 🔄

- [ ] Performance optimization
- [ ] SEO setup
- [ ] Analytics
- [ ] Monitoring
- [ ] CI/CD pipeline

---

## 🏁 Quick Start Commands

```bash
# Start development server
npm run dev
# Visit: http://localhost:3000

# Build production
npm run build
npm run start

# Run linter
npm run lint

# Format code
npm run format
```

---

## 📞 Troubleshooting

**Issue:** API connection fails

- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running
- Check CORS headers

**Issue:** Waveform chart not rendering

- Verify `recharts` is installed
- Check data format matches chart expectations

**Issue:** Auth token not persisting

- Check browser's localStorage is enabled
- Verify token is being stored after login

---

## 🎓 Key Concepts

1. **Client-side routing:** Next.js App Router handles page navigation
2. **State management:** Zustand for auth, React Query for API data
3. **Component composition:** Reusable components (FileUpload, Charts, etc.)
4. **Type safety:** Full TypeScript coverage
5. **Error handling:** Try-catch, error boundaries, toast notifications
6. **Responsive design:** Tailwind CSS breakpoints (sm, md, lg, xl)

---

**END OF IMPLEMENTATION GUIDE**

This guide provides everything needed to build CardioAI frontend from scratch. Each step includes code snippets, file locations, and configuration details.

For questions or issues, refer back to the PRD.md for specifications and requirements.
