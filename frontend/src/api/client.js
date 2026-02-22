const ENV_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();
const DOCS_USER_ID = (import.meta.env.VITE_DOCS_USER_ID || "dev-user-123").trim();
const CANDIDATE_BASES = Array.from(
  new Set([ENV_BASE, "/api", "http://127.0.0.1:8000/api", "http://localhost:8000/api"].filter(Boolean)),
);

function buildUrl(base, path) {
  if (!path.startsWith("/")) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
}

async function tryRequest(path, options = {}, config = {}) {
  const retryableStatuses = config.retryableStatuses || [404, 502, 503];
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
      if (retryableStatuses.includes(response.status)) {
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
  const genre = String(context?.writing?.genre || "fiction").toLowerCase().replace(/\s+/g, "_");
  const body = {
    text,
    genre,
    mode: "full",
    enable_narrative: true,
    enable_structural: true,
    enable_emotional: true,
    enable_style: true,
    enable_seo: false,
    enable_accessibility: false,
    enable_knowledge_graph: true,
  };
  return tryRequest("/analysis/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function generateImages(text, artStyle = "cinematic", mode = "mock", analysisResult = null) {
  const paragraphs = String(text || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);

  const images = paragraphs.map((paragraph, index) => {
    const prompt = `Cinematic ${artStyle} scene ${index + 1}: ${paragraph.slice(0, 140)}`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='840' height='460'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0%' stop-color='#0f172a'/><stop offset='100%' stop-color='#1d4ed8'/></linearGradient></defs><rect width='840' height='460' fill='url(#g)'/><rect x='24' y='24' width='792' height='412' rx='14' fill='none' stroke='#94a3b8' stroke-width='2'/><text x='44' y='82' fill='#e2e8f0' font-family='Georgia, serif' font-size='28'>Scene ${index + 1}</text><text x='44' y='128' fill='#cbd5e1' font-family='Georgia, serif' font-size='18'>${escapeXml(artStyle)}</text><text x='44' y='186' fill='#e2e8f0' font-family='Georgia, serif' font-size='15'>${escapeXml(paragraph.slice(0, 180))}</text><text x='44' y='420' fill='#94a3b8' font-family='Georgia, serif' font-size='13'>Mock image mode (no paid API call)</text></svg>`;
    return {
      scene_id: `scene-${index + 1}`,
      paragraph: index + 1,
      source_text: paragraph,
      prompt,
      mode: "mock",
      status: "generated",
      image_url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      art_style: artStyle,
    };
  });

  if (images.length === 0 && analysisResult?.illustrations?.length > 0) {
    return { images: analysisResult.illustrations };
  }

  return { images };
}

export async function healthCheck() {
  return tryRequest("/health");
}

function withAuth(headers = {}) {
  return {
    ...headers,
    Authorization: `Bearer ${DOCS_USER_ID}`,
  };
}

export function getDocsUserId() {
  return DOCS_USER_ID;
}

export async function listFirebaseDocuments(includeDeleted = false) {
  const query = includeDeleted ? "?include_deleted=true" : "";
  return tryRequest(
    `/firebase/documents${query}`,
    {
      headers: withAuth(),
    },
    { retryableStatuses: [502, 503] },
  );
}

export async function createFirebaseDocument(title = "Untitled Document") {
  return tryRequest(
    "/firebase/documents",
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        title,
        ownerId: DOCS_USER_ID,
      }),
    },
    { retryableStatuses: [502, 503] },
  );
}

export async function getFirebaseDocument(docId) {
  return tryRequest(
    `/firebase/documents/${encodeURIComponent(docId)}`,
    {
      headers: withAuth(),
    },
    { retryableStatuses: [502, 503] },
  );
}

export async function deleteFirebaseDocument(docId) {
  return tryRequest(
    `/firebase/documents/${encodeURIComponent(docId)}`,
    {
      method: "DELETE",
      headers: withAuth(),
    },
    { retryableStatuses: [502, 503] },
  );
}

export async function getFirebaseDocumentContent(docId) {
  return tryRequest(
    `/firebase/documents/${encodeURIComponent(docId)}/content`,
    {
      headers: withAuth(),
    },
    { retryableStatuses: [502, 503] },
  );
}

export async function saveFirebaseDocumentContent(docId, content) {
  return tryRequest(
    `/firebase/documents/${encodeURIComponent(docId)}/content`,
    {
      method: "PUT",
      headers: withAuth({ "Content-Type": "application/json" }),
      body: JSON.stringify({ content }),
    },
    { retryableStatuses: [502, 503] },
  );
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
