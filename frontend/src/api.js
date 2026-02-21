import axios from "axios";

export const analyzeText = async (text) => {
  const res = await axios.post("http://localhost:8000/analyze", {
    text: text,
    target_style: "formal"
  });
  return res.data;
};