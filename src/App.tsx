import { useState } from "react";

type AnalysisResult = {
  incidentType: string[];
  rootCause: string;
  confidenceScore: number; // 0..1
  classificationReasoning: string;
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function chipStyle(type: string) {
  const t = type.toUpperCase();
  if (t.includes("DATABASE")) return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  if (t.includes("PAYMENT")) return "bg-red-500/15 text-red-200 border-red-500/30";
  if (t.includes("AUTH")) return "bg-purple-500/15 text-purple-200 border-purple-500/30";
  if (t.includes("INVENTORY")) return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
  return "bg-sky-500/15 text-sky-200 border-sky-500/30";
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const canSubmit = !!file && !loading;

  const handleFile = (selected?: File) => {
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".log")) {
      setError("Only .log files are allowed.");
      return;
    }

    setError(null);
    setResult(null);
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const uploadFile = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("log", file);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("http://localhost:3000/incident", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">AI Log Analyzer</h1>
            <p className="mt-2 text-slate-400">
              Upload a .log file and get incident classification + root-cause summary.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upload Card */}
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 backdrop-blur-lg shadow-2xl">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Upload</h2>
                {file && (
                  <button
                    type="button"
                    onClick={clearFile}
                    className="inline-flex items-center gap-2 rounded-full
                              bg-slate-800 text-slate-200
                              border border-slate-600
                              px-3 py-1.5 text-xs font-semibold
                              hover:bg-slate-700 hover:text-white
                              transition-colors"
                  >
                    Clear file
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              )}

              <input
                id="logFile"
                type="file"
                accept=".log"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.currentTarget.files?.[0]);
                  e.currentTarget.value = ""; // lets you re-select same file
                }}
              />

              <label
                htmlFor="logFile"
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(false);
                  const dropped = e.dataTransfer.files?.[0];
                  handleFile(dropped);
                }}
                className={[
                  "mt-5 block rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer select-none",
                  dragOver ? "border-blue-400 bg-blue-500/10" : "border-slate-600 hover:border-blue-500",
                ].join(" ")}
              >
                {!file ? (
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Drop your .log file here</p>
                    <p className="text-sm text-slate-400">or click to browse</p>

                    <div className="pt-2">
                      <span className="inline-flex items-center justify-center rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700">
                        Choose file
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">Only .log files</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-emerald-300 font-semibold">File ready</p>
                    <p className="text-sm text-slate-200">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                    <p className="text-xs text-slate-500">Click to replace</p>
                  </div>
                )}
              </label>

              {/* Submit */}
              <button
                onClick={uploadFile}
                disabled={!canSubmit}
                className="mt-6 w-full rounded-2xl py-3 font-semibold text-white
                           bg-gradient-to-r from-blue-500 to-indigo-600
                           hover:from-blue-600 hover:to-indigo-700
                           shadow-lg shadow-blue-900/30
                           transition-all duration-200
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Analyzing logs…
                  </span>
                ) : (
                  "Upload & Analyze"
                )}
              </button>

              <div className="mt-4 text-xs text-slate-500">
                Tip: keep one log entry per line for best analysis.
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 backdrop-blur-lg shadow-2xl">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Results</h2>
                {result && (
                  <span className="text-xs rounded-full border border-slate-600 px-3 py-1 text-slate-300">
                    Completed
                  </span>
                )}
              </div>

              {!result ? (
                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/30 p-6 text-sm text-slate-400">
                  Upload a .log file to see incident types, confidence score, and root cause.
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {/* Incident types */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-5">
                    <h3 className="text-blue-300 font-semibold mb-3">Detected incidents</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.incidentType.map((type) => (
                        <span
                          key={type}
                          className={`px-3 py-1 text-sm rounded-full border ${chipStyle(type)}`}
                        >
                          {type.replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Root cause */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-5">
                    <h3 className="text-blue-300 font-semibold mb-2">Root cause</h3>
                    <p className="text-slate-200 text-sm leading-relaxed">{result.rootCause}</p>
                  </div>

                  {/* Confidence */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-blue-300 font-semibold">Confidence</h3>
                      <span className="text-sm text-slate-300">
                        {(result.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="mt-3 h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.max(0, Math.min(1, result.confidenceScore)) * 100}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Higher confidence means stronger evidence in the logs for the classification.
                    </p>
                  </div>

                  {/* Reasoning */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-5">
                    <h3 className="text-blue-300 font-semibold mb-2">Reasoning</h3>
                    <p className="text-slate-200 text-sm leading-relaxed">
                      {result.classificationReasoning}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          Only .log files supported for now.
        </div>
      </div>
    </div>
  );
}