"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Zap,
  Volume2,
  VolumeX,
  Play,
  Square,
  Usb,
  ShieldCheck,
  AlertTriangle,
  Send,
  RefreshCw,
  CheckCircle2,
  Tv,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiService } from "@/services/apiService";
import { saveAnalysis } from "@/services/mockDataService";

interface HospitalDeviceLinkProps {
  onCaptureComplete?: (analysisData: any) => void;
}

export const HospitalDeviceLink: React.FC<HospitalDeviceLinkProps> = ({
  onCaptureComplete,
}) => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Connection & Streaming state
  const [connectionType, setConnectionType] = useState<"simulator" | "webserial">("simulator");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [serialDeviceName, setSerialDeviceName] = useState<string>("");
  const [audioBeep, setAudioBeep] = useState<boolean>(true);

  // Live Metrics
  const [liveBpm, setLiveBpm] = useState<number>(72);
  const [signalQuality, setSignalQuality] = useState<number>(96);
  const [liveStatus, setLiveStatus] = useState<string>("Normal Sinus Rhythm");
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Signal Buffer
  const signalBufferRef = useRef<number[]>([]);
  const capturedDataRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const sweepXRef = useRef<number>(0);
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastPeakTimeRef = useRef<number>(0);

  // Initialize Web Audio Context for cardiac beep
  const playCardiacBeep = () => {
    if (!audioBeep) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz A5 pitch
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Audio autoplay block silently caught
    }
  };

  // Generate Synthetic ECG Waveform Point
  const generateECGPoint = (t: number, bpmVal: number = 72): number => {
    const period = 60 / bpmVal;
    const phase = (t % period) / period;
    let val = 0;

    // P wave
    if (phase > 0.12 && phase < 0.22) {
      val += 0.15 * Math.sin(((phase - 0.12) / 0.1) * Math.PI);
    }
    // Q wave
    else if (phase >= 0.32 && phase < 0.35) {
      val -= 0.12 * Math.sin(((phase - 0.32) / 0.03) * Math.PI);
    }
    // R peak (QRS)
    else if (phase >= 0.35 && phase < 0.40) {
      val += 1.35 * Math.sin(((phase - 0.35) / 0.05) * Math.PI);
      if (phase >= 0.37 && phase <= 0.38) {
        const now = Date.now();
        if (now - lastPeakTimeRef.current > 400) {
          playCardiacBeep();
          lastPeakTimeRef.current = now;
        }
      }
    }
    // S wave
    else if (phase >= 0.40 && phase < 0.44) {
      val -= 0.35 * Math.sin(((phase - 0.40) / 0.04) * Math.PI);
    }
    // T wave
    else if (phase >= 0.60 && phase < 0.75) {
      val += 0.28 * Math.sin(((phase - 0.60) / 0.15) * Math.PI);
    }

    // Add baseline wander & minor noise
    const noise = (Math.random() - 0.5) * 0.03;
    const baseline = 0.05 * Math.sin(t * 0.5);
    return val + noise + baseline;
  };

  // Connect Web Serial API
  const handleConnectWebSerial = async () => {
    if (!("serial" in navigator)) {
      alert("Web Serial API is not supported on this browser. Please use Chrome or Edge, or switch to Hospital Stream Simulator mode.");
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate });
      serialPortRef.current = port;
      setIsConnected(true);
      setSerialDeviceName("Connected Device (COM)");

      // Read loop
      const decoder = new TextDecoderStream();
      const inputDone = port.readable.pipeTo(decoder.writable);
      const inputStream = decoder.readable;
      const reader = inputStream.getReader();
      serialReaderRef.current = reader;

      readSerialData(reader);
    } catch (err: any) {
      console.error("Serial connection failed:", err);
      alert(`Serial Port Connection Error: ${err?.message || err}`);
    }
  };

  const readSerialData = async (reader: any) => {
    try {
      let lineAcc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          lineAcc += value;
          const lines = lineAcc.split("\n");
          lineAcc = lines.pop() || "";

          for (const line of lines) {
            const num = parseFloat(line.trim());
            if (!isNaN(num)) {
              signalBufferRef.current.push(num);
              if (signalBufferRef.current.length > 3000) {
                signalBufferRef.current.shift();
              }
              if (isRecording) {
                capturedDataRef.current.push(num);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Serial read error", e);
    }
  };

  const handleDisconnect = async () => {
    if (serialReaderRef.current) {
      await serialReaderRef.current.cancel();
    }
    if (serialPortRef.current) {
      await serialPortRef.current.close();
    }
    setIsConnected(false);
    setSerialDeviceName("");
  };

  // Start Oscilloscope animation loop
  useEffect(() => {
    let t = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      t += 0.004;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Generate current value ONLY if real serial hardware is connected
      let val = 0;
      if (isConnected) {
        // Real stream from serial buffer or active hardware feed
        val = signalBufferRef.current[signalBufferRef.current.length - 1] || 0;
        if (isRecording) {
          capturedDataRef.current.push(val);
        }
      } else {
        // Flatline / zero signal when no device is connected
        val = 0;
        signalBufferRef.current.push(0);
        if (signalBufferRef.current.length > width) {
          signalBufferRef.current.shift();
        }
      }

      // Draw Hospital Oscilloscope Background (Grid)
      ctx.fillStyle = "#030712"; // dark grid bg
      ctx.fillRect(0, 0, width, height);

      // Grid lines (Medical Monitor Standard 5mm grid)
      ctx.strokeStyle = "rgba(16, 185, 129, 0.08)";
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Oscilloscope Sweep Line
      sweepXRef.current = (sweepXRef.current + 2) % width;
      const currentX = sweepXRef.current;

      // Draw Signal Trace
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#10b981"; // Emerald green medical phosphor
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 8;

      ctx.beginPath();
      const buffer = signalBufferRef.current;
      const totalPoints = buffer.length;
      const displayPoints = Math.min(totalPoints, width);

      for (let i = 0; i < displayPoints; i++) {
        const x = (i / displayPoints) * width;
        const rawY = buffer[totalPoints - displayPoints + i];
        const y = centerY - rawY * (height * 0.32);

        // Erase zone ahead of sweep bar
        if (Math.abs(x - currentX) < 25) {
          continue;
        }

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Sweep Line Bar (Neon vertical beam)
      const grad = ctx.createLinearGradient(currentX - 15, 0, currentX, 0);
      grad.addColorStop(0, "rgba(16, 185, 129, 0)");
      grad.addColorStop(1, "rgba(52, 211, 153, 0.6)");
      ctx.fillStyle = grad;
      ctx.fillRect(currentX - 15, 0, 15, height);

      ctx.strokeStyle = "#6ee7b7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, height);
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [connectionType, isConnected, liveBpm, audioBeep, isRecording]);

  // Recording Timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 10) {
            handleCompleteRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = () => {
    capturedDataRef.current = [];
    setRecordingSeconds(0);
    setIsRecording(true);
  };

  const handleCompleteRecording = async () => {
    setIsRecording(false);
    setIsAnalyzing(true);

    try {
      // Build CSV string from captured signal
      const signalData = capturedDataRef.current;
      const csvRows = ["timestamp,ecg_amplitude"];
      signalData.forEach((val, index) => {
        const timeSec = (index / 250).toFixed(3);
        csvRows.push(`${timeSec},${val.toFixed(5)}`);
      });
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const formData = new FormData();
      formData.append("file", blob, "hospital_direct_stream.csv");
      formData.append("type", "ECG");
      formData.append("patientName", "Hospital Patient Direct Stream");
      formData.append("patientAge", "54");
      formData.append("patientGender", "Male");

      let analysisObj: any = null;
      try {
        const response = await fetch("http://localhost:8000/api/analysis/upload", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const result = await response.json();
          analysisObj = result.data;
        }
      } catch (e) {
        console.warn("Backend API offline, using internal signal engine:", e);
      }

      if (!analysisObj) {
        const ecgFile = new File([blob], "hospital_direct_stream.csv", { type: "text/csv" });
        const localRes = await apiService.processSignal(ecgFile, "ECG", null, {
          patientName: "Hospital Patient Direct Stream",
          patientAge: 54,
          patientGender: "Male",
          clinicalNotes: "Recorded via Hospital Serial/Oscilloscope Stream",
        });
        analysisObj = localRes.data;
      } else {
        saveAnalysis(analysisObj);
      }

      setIsAnalyzing(false);

      if (onCaptureComplete) {
        onCaptureComplete(analysisObj);
      } else {
        router.push(`/analysis/${analysisObj.id}`);
      }
    } catch (err) {
      console.error("Recording submit error:", err);
      setIsAnalyzing(false);
      alert("Analysis processing error.");
    }
  };

  return (
    <div className="card p-6 bg-white dark:bg-black border border-[#e7eeff] dark:border-neutral-900 rounded-2xl shadow-xl text-slate-900 dark:text-slate-100 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Tv className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#00605b] dark:text-white flex items-center gap-2">
              Hospital Device Direct Link
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                Hospital Mode
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Direct USB/Serial COM link & 250Hz Real-Time Oscilloscope Stream
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setAudioBeep(!audioBeep)}
            className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 text-xs font-medium ${
              audioBeep
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
            title="Toggle Cardiac Sound Beep"
          >
            {audioBeep ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {audioBeep ? "Sound ON" : "Mute"}
          </button>

          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => {
                setConnectionType("simulator");
                handleDisconnect();
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                connectionType === "simulator"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Stream Simulator
            </button>
            <button
              onClick={() => setConnectionType("webserial")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                connectionType === "webserial"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              USB/Serial Hardware
            </button>
          </div>

          {connectionType === "webserial" && (
            <div>
              {!isConnected ? (
                <button
                  onClick={handleConnectWebSerial}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950"
                >
                  <Usb className="w-4 h-4" /> Connect USB ECG
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  Disconnect ({serialDeviceName})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Oscilloscope Monitor Screen */}
      <div className="relative rounded-xl overflow-hidden border-2 border-slate-800 bg-slate-950 shadow-inner">
        {/* Top Status Bar overlay on Canvas */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-mono">
              {isConnected ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-emerald-400">LIVE HARDWARE MONITOR STREAM (250Hz)</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-red-400 font-bold">HARDWARE DISCONNECTED</span>
                </>
              )}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              STATUS: <span className={isConnected ? "text-emerald-300 font-semibold" : "text-slate-500 font-semibold"}>{isConnected ? liveStatus : "AWAITING SERIAL CONNECTION"}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Heart Rate</div>
              <div className="text-3xl font-black font-mono text-emerald-400 leading-none flex items-center gap-1">
                {isConnected ? liveBpm : "--"} <span className="text-xs font-normal text-slate-400">BPM</span>
              </div>
            </div>
            <div className="text-right border-l border-slate-800 pl-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Signal Quality</div>
              <div className="text-xl font-bold font-mono text-emerald-300">
                {isConnected ? `${signalQuality}%` : "0%"} <span className="text-xs font-normal text-slate-400">{isConnected ? "Good" : "No Signal"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center overlay when disconnected */}
        {!isConnected && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Usb className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-extrabold text-white">No ECG Machine Connected</h3>
              <p className="text-xs text-slate-400 mt-1">
                Connect your hardware ECG device (AD8232 / Arduino / Hospital Serial COM port) via USB/Serial to activate live streaming.
              </p>
            </div>
            <button
              onClick={handleConnectWebSerial}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
            >
              <Usb className="w-4 h-4" /> Connect USB / Serial ECG Device
            </button>
          </div>
        )}

        {/* Canvas Display */}
        <canvas
          ref={canvasRef}
          width={800}
          height={320}
          className="w-full h-[320px] block cursor-crosshair"
        />

        {/* Bottom Recording Action Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-300 font-medium">
              Simulated BPM Selector:
            </div>
            <div className="flex gap-1.5">
              {[62, 72, 115, 48].map((bpm) => (
                <button
                  key={bpm}
                  onClick={() => {
                    setLiveBpm(bpm);
                    if (bpm > 100) setLiveStatus("Tachycardia Alert");
                    else if (bpm < 55) setLiveStatus("Bradycardia Alert");
                    else setLiveStatus("Normal Sinus Rhythm");
                  }}
                  className={`px-2.5 py-1 text-xs rounded font-mono font-bold transition-all ${
                    liveBpm === bpm
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {bpm} BPM
                </button>
              ))}
            </div>
          </div>

          <div>
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isAnalyzing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
              >
                <Play className="w-4 h-4 fill-white" /> Capture 10s Window & Run AI
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-mono animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Recording... {recordingSeconds}s / 10s
                </div>
                <button
                  onClick={handleCompleteRecording}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-white" /> Stop & Process
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Spinner modal */}
      {isAnalyzing && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-4 text-emerald-300 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Processing hospital ECG stream through 1D-CNN ML Pipeline & Signal Quality Assessor...
        </div>
      )}
    </div>
  );
};
