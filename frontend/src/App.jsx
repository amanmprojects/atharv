import { Navigate, Route, Routes } from "react-router-dom";
import AIWriterWorkbench from "./AIWriterWorkbench";
import ScriptIQLanding from "./pages/ScriptIQLanding";
import "./scriptiq-shell.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ScriptIQLanding />} />
      <Route path="/editor" element={<AIWriterWorkbench initialView="editor" />} />
      <Route path="/setup" element={<AIWriterWorkbench initialView="form" />} />
      <Route path="/dashboard" element={<AIWriterWorkbench initialView="issues" />} />
      <Route path="/character-universe" element={<AIWriterWorkbench initialView="universe" />} />
      <Route path="/timeline" element={<AIWriterWorkbench initialView="timeline" />} />
      <Route path="/consistency" element={<AIWriterWorkbench initialView="consistency" />} />
      <Route path="/pacing" element={<AIWriterWorkbench initialView="pacing" />} />
      <Route path="/vibe-graph" element={<AIWriterWorkbench initialView="vibe" />} />
      <Route path="/plot-arc" element={<AIWriterWorkbench initialView="arc" />} />
      <Route path="/genre-profile" element={<AIWriterWorkbench initialView="genre" />} />
      <Route path="/dialogue-voice" element={<AIWriterWorkbench initialView="dialogue" />} />
      <Route path="/trends" element={<AIWriterWorkbench initialView="trends" />} />
      <Route path="/illustrations" element={<AIWriterWorkbench initialView="illustrations" />} />
      <Route path="/explainability" element={<AIWriterWorkbench initialView="explain" />} />
      <Route path="/issues" element={<AIWriterWorkbench initialView="issues" />} />
      <Route path="/settings" element={<AIWriterWorkbench initialView="editor" />} />

      {/* Backward-compatible aliases */}
      <Route path="/compare" element={<Navigate to="/explainability" replace />} />
      <Route path="/style-profile" element={<Navigate to="/dialogue-voice" replace />} />
      <Route path="/seo" element={<Navigate to="/genre-profile" replace />} />
      <Route path="/accessibility" element={<Navigate to="/pacing" replace />} />
      <Route path="/watermark" element={<Navigate to="/vibe-graph" replace />} />
      <Route path="/admin" element={<Navigate to="/plot-arc" replace />} />

      <Route path="*" element={<Navigate to="/editor" replace />} />
    </Routes>
  );
}
