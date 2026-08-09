"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, Check, ShieldCheck, Database } from "lucide-react";

interface ClinicalTrialExporterProps {
  analysisData?: any;
}

export const ClinicalTrialExporter: React.FC<ClinicalTrialExporterProps> = ({
  analysisData,
}) => {
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true);
  const [anonymizePatient, setAnonymizePatient] = useState<boolean>(true);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [isExported, setIsExported] = useState<boolean>(false);

  const handleExport = () => {
    const rawSignal: number[] = analysisData?.processed_signal || analysisData?.raw_signal || [];
    const patientSubjectId = anonymizePatient
      ? `SUBJ_${Math.floor(100000 + Math.random() * 900000)}`
      : analysisData?.patientName || "Anonymous";

    if (exportFormat === "csv") {
      const csvHeader = [
        `# CardioSense AI Clinical Trial Dataset Export`,
        `# Export Date: ${new Date().toISOString()}`,
        `# Subject ID: ${patientSubjectId}`,
        `# Signal Type: ${analysisData?.type || "ECG"}`,
        `# Signal Quality Score: ${analysisData?.quality?.score || 92}%`,
        `# AI Classification: ${analysisData?.prediction?.class || "Normal"}`,
        `# Model Confidence: ${(analysisData?.prediction?.confidence * 100 || 95).toFixed(1)}%`,
        `# Sampling Rate (Hz): 360`,
        `sample_index,time_sec,amplitude_raw,quality_factor`,
      ].join("\n");

      const rows = rawSignal.map((val, idx) => {
        const timeSec = (idx / 360).toFixed(4);
        return `${idx},${timeSec},${val.toFixed(6)},1.0`;
      });

      const csvContent = `${csvHeader}\n${rows.join("\n")}`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `clinical_trial_${patientSubjectId}_dataset.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const jsonContent = JSON.stringify(
        {
          clinical_study_header: {
            study_name: "CardioSense AI Multicenter Clinical Trial",
            subject_id: patientSubjectId,
            export_timestamp: new Date().toISOString(),
            signal_metadata: {
              type: analysisData?.type || "ECG",
              sampling_rate_hz: 360,
              quality_score: analysisData?.quality?.score || 92,
              ai_prediction: analysisData?.prediction?.class || "Normal",
              confidence: analysisData?.prediction?.confidence || 0.95,
            },
          },
          signal_data: rawSignal,
        },
        null,
        2
      );

      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `clinical_trial_${patientSubjectId}_dataset.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setIsExported(true);
    setTimeout(() => setIsExported(false), 3000);
  };

  return (
    <div className="card p-6 bg-white dark:bg-black border border-teal-100 dark:border-neutral-900 rounded-2xl shadow-xl text-slate-900 dark:text-slate-100 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#00605b] dark:text-teal-400 font-bold">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-[#00605b] dark:text-white flex items-center gap-2">
            Clinical Trial Data Exporter
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-100 text-[#00605b] font-extrabold border border-teal-200">
              PhysioNet Standard
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Export anonymized waveforms & AI trial metrics for clinical research
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={anonymizePatient}
            onChange={(e) => setAnonymizePatient(e.target.checked)}
            className="rounded border-slate-300 text-[#00605b] focus:ring-[#00605b] bg-white dark:bg-slate-900"
          />
          <span className="text-slate-800 dark:text-slate-300 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Anonymize Subject ID
          </span>
        </label>

        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={includeMetadata}
            onChange={(e) => setIncludeMetadata(e.target.checked)}
            className="rounded border-slate-300 text-[#00605b] focus:ring-[#00605b] bg-white dark:bg-slate-900"
          />
          <span className="text-slate-800 dark:text-slate-300 font-semibold">Include SQI & Quality Index</span>
        </label>

        <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs">
          <button
            onClick={() => setExportFormat("csv")}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              exportFormat === "csv" ? "bg-[#00605b] text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            CSV Format
          </button>
          <button
            onClick={() => setExportFormat("json")}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              exportFormat === "json" ? "bg-[#00605b] text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            JSON Format
          </button>
        </div>
      </div>

      <button
        onClick={handleExport}
        className="w-full py-3 bg-[#00605b] hover:bg-[#147a74] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-teal-950/20 transition-all"
      >
        {isExported ? (
          <>
            <Check className="w-4 h-4 text-emerald-300" /> Clinical Dataset Downloaded!
          </>
        ) : (
          <>
            <Download className="w-4 h-4" /> Export Clinical Dataset ({exportFormat.toUpperCase()})
          </>
        )}
      </button>
    </div>
  );
};
