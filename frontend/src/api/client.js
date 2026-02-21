// DevHacks 2026 - Challenge 2: AI-Powered Writer
// File: frontend/src/api/client.js

const ENV_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();
const CANDIDATE_BASES = Array.from(
  new Set([ENV_BASE, "/api", "http://127.0.0.1:8000", "http://localhost:8000"].filter(Boolean)),
);

function buildUrl(base, path) {
  if (!path.startsWith("/")) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
}

async function tryRequest(path, options = {}) {
  let networkError = null;
  let lastApiError = null;

  for (const base of CANDIDATE_BASES) {
    try {
      const response = await fetch(buildUrl(base, path), options);
      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        return payload;
      }

      // These often indicate wrong base/proxy path; try next candidate.
      if ([404, 502, 503].includes(response.status)) {
        continue;
      }

      lastApiError = payload?.detail || payload?.message || `API request failed (${response.status})`;
    } catch (error) {
      networkError = error;
    }
  }

  if (lastApiError) {
    throw new Error(lastApiError);
  }

  if (networkError) {
    throw new Error("Backend is unreachable. Start FastAPI on port 8000.");
  }

  throw new Error("Backend is unreachable. Verify API base URL or proxy settings.");
}

export async function analyzeText(text, targetStyle = "formal", similarityThreshold = 0.25, context = null) {
  const body = {
    text,
    target_style: targetStyle,
    similarity_threshold: similarityThreshold,
  };
  if (context && Object.keys(context).length > 0) {
    body.context = context;
  }
  return tryRequest("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function generateImages(text, artStyle = "cinematic", mode = "mock", analysisResult = null) {
  return tryRequest("/generate-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      art_style: artStyle,
      mode,
      analysis_result: analysisResult,
    }),
  });
}

export async function healthCheck() {
  return tryRequest("/health");
}
