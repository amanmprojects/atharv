import axios from "axios";

export const analyzeText = async (text, style, threshold, context) => {
  const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
  const res = await axios.post(`${base}/analysis/analyze`, {
    text,
    genre: context?.writing?.genre || "fiction",
    setup_context: context,
    mode: "full",
    enable_narrative: true,
    enable_structural: true,
    enable_emotional: true,
    enable_style: true,
  });
  return res.data;
};
