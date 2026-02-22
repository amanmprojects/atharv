import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createFirebaseDocument,
  deleteFirebaseDocument,
  listFirebaseDocuments,
} from "../api/client";
import "./DocsCloneDashboard.css";

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function mapDocument(doc) {
  return {
    id: doc?.id || `doc-${Date.now()}`,
    title: doc?.title || "Untitled Document",
    updatedAt: doc?.updatedAt || new Date().toISOString(),
    words: Number(doc?.wordCount || 0),
  };
}

export default function DocsCloneDashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFirebaseDocuments();
      const rows = Array.isArray(data) ? data.map(mapDocument) : [];
      setDocuments(rows);
    } catch (err) {
      setError(err?.message || "Failed to load documents.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const closeMenu = () => setOpenMenuFor(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter((doc) => doc.title.toLowerCase().includes(query));
  }, [documents, searchQuery]);

  const totalWords = useMemo(
    () => documents.reduce((count, doc) => count + (doc.words || 0), 0),
    [documents],
  );

  const createAndOpenDocument = useCallback(async (title = "Untitled Document", shouldOpen = true) => {
    setCreating(true);
    setError(null);
    try {
      const created = await createFirebaseDocument(title);
      const mapped = mapDocument(created);
      setDocuments((prev) => [mapped, ...prev.filter((item) => item.id !== mapped.id)]);
      if (shouldOpen) {
        navigate(`/setup/${mapped.id}`, {
          state: { documentTitle: mapped.title },
        });
      }
      return mapped;
    } catch (err) {
      setError(err?.message || "Failed to create document.");
      return null;
    } finally {
      setCreating(false);
    }
  }, [navigate]);

  const deleteDocument = async (id) => {
    setError(null);
    try {
      await deleteFirebaseDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(err?.message || "Failed to delete document.");
    }
    setOpenMenuFor(null);
  };

  const duplicateDocument = async (doc) => {
    await createAndOpenDocument(`${doc.title} (Copy)`, false);
    setOpenMenuFor(null);
  };

  const openDocument = (docId, title) => {
    navigate(`/editor/${docId}`, {
      state: { documentTitle: title || "Untitled Document" },
    });
  };

  const openCreateModal = useCallback(() => {
    setOpenMenuFor(null);
    setNewTitle("");
    setIsCreateModalOpen(true);
  }, []);

  const handleCreateFromModal = useCallback(async (event) => {
    event.preventDefault();
    const title = newTitle.trim() || "Untitled Document";
    const created = await createAndOpenDocument(title, true);
    if (created) {
      setIsCreateModalOpen(false);
      setNewTitle("");
    }
  }, [createAndOpenDocument, newTitle]);

  return (
    <div className="dc-page">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <div className="dc-shell">
        <header className="dc-app-header">
          <div className="dc-brand-wrap">
            <div className="dc-logo">S</div>
            <Link to="/" className="dc-brand-link">ScriptIQ</Link>
          </div>
          <div className="dc-header-actions">
            <Link to="/editor" className="dc-text-link">Workspace</Link>
            <div className="dc-user-pill">Sharvari</div>
          </div>
        </header>

        <section className="dc-dashboard-header">
          <div className="dc-header-row">
            <div>
              <h1 className="dc-title">Document Dashboard</h1>
              <p className="dc-subtitle">Manage writing drafts and continue editing in one click.</p>
            </div>
            <button
              className="dc-btn dc-btn-primary"
              onClick={openCreateModal}
              disabled={creating}
            >
              + New Document
            </button>
          </div>
          <div className="dc-toolbar-row">
            <input
              className="dc-input"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search documents..."
            />
            <div className="dc-stat-strip">
              <div className="dc-stat">
                <span>Documents</span>
                <strong>{documents.length}</strong>
              </div>
              <div className="dc-stat">
                <span>Total Words</span>
                <strong>{totalWords.toLocaleString()}</strong>
              </div>
              <div className="dc-stat">
                <span>Visible</span>
                <strong>{filteredDocuments.length}</strong>
              </div>
            </div>
          </div>
        </section>

        <main className="dc-content">
          {error && <div className="dc-error">{error}</div>}

          {loading ? (
            <div className="dc-loading">Loading documents...</div>
          ) : null}

          {!loading && filteredDocuments.length === 0 ? (
            <div className="dc-empty">
              <h2>No documents found</h2>
              <p>{searchQuery ? "Try a different search term." : "Create your first document to get started."}</p>
              {!searchQuery ? (
                <button
                  className="dc-btn dc-btn-primary"
                  onClick={openCreateModal}
                  disabled={creating}
                >
                  Create Document
                </button>
              ) : null}
            </div>
          ) : null}

          {!loading && filteredDocuments.length > 0 ? (
            <div className="dc-grid">
              {filteredDocuments.map((doc) => (
                <article key={doc.id} className="dc-card" onClick={() => openDocument(doc.id, doc.title)}>
                  <div className="dc-card-preview">
                    <span className="dc-card-chip">Draft</span>
                    <p>{doc.words.toLocaleString()} words</p>
                  </div>
                  <h3 className="dc-card-title">{doc.title}</h3>
                  <p className="dc-card-meta">{formatRelativeTime(doc.updatedAt)}</p>

                  <button
                    className="dc-menu-trigger"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuFor((current) => (current === doc.id ? null : doc.id));
                    }}
                  >
                    ...
                  </button>

                  {openMenuFor === doc.id && (
                    <div className="dc-card-menu" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => openDocument(doc.id, doc.title)}>Open</button>
                      <button onClick={() => duplicateDocument(doc)}>Duplicate</button>
                      <button className="dc-danger" onClick={() => void deleteDocument(doc.id)}>Delete</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : null}
        </main>
      </div>

      {isCreateModalOpen ? (
        <div className="dc-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="dc-modal" onClick={(event) => event.stopPropagation()}>
            <div className="dc-modal-header">
              <h2>New Document</h2>
              <button onClick={() => setIsCreateModalOpen(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleCreateFromModal} className="dc-modal-body">
              <label htmlFor="new-doc-title">Document Title</label>
              <input
                id="new-doc-title"
                className="dc-input"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Enter document title..."
                autoFocus
              />
              {error ? <p className="dc-modal-error">{error}</p> : null}
              <div className="dc-modal-actions">
                <button
                  className="dc-btn dc-btn-outline"
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button className="dc-btn dc-btn-primary" type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
