"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, RefreshCw, CheckCircle2, Play, Square, Activity, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiService } from "@/services/apiService";
import { saveAnalysis } from "@/services/mockDataService";

interface WebcamPPGScannerProps {
  onScanComplete?: (analysisData: any) => void;
}

export const WebcamPPGScanner: React.FC<WebcamPPGScannerProps> = ({
  onScanComplete,
}) => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSeconds, setScanSeconds] = useState<number>(0);
  const [estimatedBpm, setEstimatedBpm] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const ppgBufferRef = useRef<number[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera permission denied or camera not available.");
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
  };

  // Process frames for Optical PPG (rPPG)
  useEffect(() => {
    if (!isCameraActive || !isScanning) return;

    let sampleCount = 0;
    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = frame.data;

          // Sum green channel (Green light absorption correlates highest with arterial pulse)
          let greenSum = 0;
          for (let i = 0; i < data.length; i += 4) {
            greenSum += data[i + 1]; // G channel
          }
          const avgGreen = greenSum / (data.length / 4);

          // Standardize signal
          ppgBufferRef.current.push(avgGreen);
          if (ppgBufferRef.current.length > 500) {
            ppgBufferRef.current.shift();
          }

          // Calculate approximate BPM from peak intervals
          if (ppgBufferRef.current.length > 60 && sampleCount % 15 === 0) {
            const calculatedBpm = calculateSimpleBpm(ppgBufferRef.current);
            if (calculatedBpm > 45 && calculatedBpm < 180) {
              setEstimatedBpm(calculatedBpm);
            }
          }
          sampleCount++;
        }
      }

      drawPulseChart();
      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCameraActive, isScanning]);

  const drawPulseChart = () => {
    const chartCanvas = chartCanvasRef.current;
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext("2d");
    if (!ctx) return;

    const width = chartCanvas.width;
    const height = chartCanvas.height;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, width, height);

    const buffer = ppgBufferRef.current;
    if (buffer.length < 2) return;

    const min = Math.min(...buffer);
    const max = Math.max(...buffer);
    const range = max - min || 1;

    ctx.strokeStyle = "#00605b"; // Bold clinical teal pulse trace
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < buffer.length; i++) {
      const x = (i / buffer.length) * width;
      const normY = (buffer[i] - min) / range;
      const y = height - 10 - normY * (height - 20);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const calculateSimpleBpm = (signal: number[]): number => {
    let peaks = 0;
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > mean && signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) {
        peaks++;
      }
    }
    const durationSeconds = signal.length / 30; // ~30 fps
    const bpm = Math.round((peaks / durationSeconds) * 60);
    return isNaN(bpm) || bpm < 40 ? 75 : bpm;
  };

  // Timer effect
  useEffect(() => {
    let timer: any;
    if (isScanning) {
      timer = setInterval(() => {
        setScanSeconds((prev) => {
          if (prev >= 10) {
            handleCompleteScan();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setScanSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isScanning]);

  const startScan = () => {
    ppgBufferRef.current = [];
    setScanSeconds(0);
    setIsScanning(true);
  };

  const handleCompleteScan = async () => {
    setIsScanning(false);
    setIsAnalyzing(true);

    try {
      const buffer = ppgBufferRef.current;
      const csvRows = ["timestamp,ppg_amplitude"];
      buffer.forEach((val, idx) => {
        csvRows.push(`${(idx / 30).toFixed(3)},${val.toFixed(4)}`);
      });
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const formData = new FormData();
      formData.append("file", blob, "webcam_ppg_scan.csv");
      formData.append("type", "PPG");
      formData.append("patientName", "Webcam PPG Patient");

      let analysisObj: any = null;
      try {
        const response = await fetch("http://localhost:8000/api/analysis/upload", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const res = await response.json();
          analysisObj = res.data;
        }
      } catch (e) {
        console.warn("Backend API offline, using internal signal engine:", e);
      }

      if (!analysisObj) {
        const ppgFile = new File([blob], "webcam_ppg_scan.csv", { type: "text/csv" });
        const localRes = await apiService.processSignal(ppgFile, "PPG", null, {
          patientName: "Webcam PPG Patient",
          clinicalNotes: "Optical pulse scan via webcam rPPG",
        });
        analysisObj = localRes.data;
      } else {
        saveAnalysis(analysisObj);
      }

      setIsAnalyzing(false);

      if (onScanComplete) {
        onScanComplete(analysisObj);
      } else {
        router.push(`/analysis/${analysisObj.id}`);
      }
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
      alert("PPG scan error.");
    }
  };

  return (
    <div className="card p-6 bg-white dark:bg-black border border-[#e7eeff] dark:border-neutral-900 rounded-2xl shadow-xl text-slate-900 dark:text-slate-100 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#00605b] dark:text-white flex items-center gap-2">
              Webcam Photoplethysmography (rPPG)
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/30">
                Optical Sensor
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Measure pulse waveform and heart rate using camera optical density sampling
            </p>
          </div>
        </div>

        <div>
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-[#00605b] hover:bg-[#147a74] text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-all"
            >
              <Camera className="w-4 h-4" /> Enable Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all"
            >
              Turn Off Camera
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          {cameraError}
        </div>
      )}

      {/* Main Scanner Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Video feed box */}
        <div className="relative bg-slate-100 border-2 border-slate-200 rounded-2xl overflow-hidden aspect-video flex items-center justify-center shadow-inner">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${!isCameraActive && "hidden"}`}
            playsInline
            muted
          />
          <canvas ref={canvasRef} width={160} height={120} className="hidden" />

          {!isCameraActive && (
            <div className="text-center p-6 text-slate-600 space-y-2">
              <Camera className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-xs font-medium">Click "Enable Camera" and cover camera with fingertip or align face.</p>
            </div>
          )}

          {isCameraActive && (
            <div className="absolute inset-0 border-2 border-sky-500/30 rounded-xl pointer-events-none flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-sky-600/60 animate-spin" />
            </div>
          )}
        </div>

        {/* Real-time PPG Pulse Graph & Metrics */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
              <span>REAL-TIME OPTICAL PPG WAVEFORM</span>
              <span className="text-[#00605b] font-mono">30 FPS</span>
            </div>
            <canvas ref={chartCanvasRef} width={400} height={120} className="w-full h-[120px] rounded-xl block border border-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Estimated Pulse</div>
              <div className="text-2xl font-black font-mono text-[#00605b] mt-1">
                {estimatedBpm ? `${estimatedBpm} BPM` : "-- BPM"}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Scan Progress</div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                {scanSeconds}s / 10s
              </div>
            </div>
          </div>

          {isCameraActive && (
            <div>
              {!isScanning ? (
                <button
                  onClick={startScan}
                  className="w-full py-3 bg-[#00605b] hover:bg-[#147a74] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-teal-950/20 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" /> Start 10s Optical Scan & Analyze
                </button>
              ) : (
                <button
                  onClick={() => setIsScanning(false)}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Square className="w-4 h-4 fill-white" /> Stop Scan
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isAnalyzing && (
        <div className="p-4 bg-sky-950/40 border border-sky-500/30 rounded-xl flex items-center gap-4 text-sky-300 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Analyzing Optical PPG waveform data via Backend ML Engine...
        </div>
      )}
    </div>
  );
};
