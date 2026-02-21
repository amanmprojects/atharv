const API_URL = 'http://localhost:8000/api/analysis';

async function analyzeText() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();

    if (!text) {
        alert('Please enter text to analyze.');
        return;
    }

    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const analyzeBtn = document.getElementById('analyzeBtn');

    loading.classList.remove('hidden');
    results.classList.add('hidden');
    analyzeBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                genre: 'fiction',
                mode: 'full',
                enable_narrative: true,
                enable_structural: true,
                enable_emotional: true,
                enable_style: true,
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        console.error('Analysis failed:', error);
        document.getElementById('suggestionsContainer').innerHTML = `
      <div class="suggestion-item" style="border-color: #ef4444;">
        <div class="rule" style="color: #ef4444;">Error</div>
        <div class="reason">Could not connect to ScriptIQ backend. Make sure the server is running at ${API_URL}</div>
      </div>
    `;
        results.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
        analyzeBtn.disabled = false;
    }
}

function displayResults(data) {
    const results = document.getElementById('results');

    document.getElementById('wordCount').textContent = data.word_count || 0;
    document.getElementById('sentenceCount').textContent = data.sentence_count || 0;
    document.getElementById('suggestionCount').textContent = (data.suggestions || []).length;

    const container = document.getElementById('suggestionsContainer');
    container.innerHTML = '';

    if (data.suggestions && data.suggestions.length > 0) {
        data.suggestions.slice(0, 10).forEach(s => {
            const el = document.createElement('div');
            el.className = 'suggestion-item';
            const ruleName = s.rule_triggered.split('.').pop().replace(/_/g, ' ');
            const confidence = Math.round((s.confidence || 0) * 100);
            el.innerHTML = `
        <div class="rule">${ruleName} · ${confidence}%</div>
        <div class="reason">${s.reason || 'No reason provided'}</div>
      `;
            container.appendChild(el);
        });
    } else {
        container.innerHTML = '<div class="suggestion-item"><div class="reason">No suggestions — text looks good! ✨</div></div>';
    }

    // Show style fingerprint if available
    if (data.style_fingerprint) {
        const sf = data.style_fingerprint;
        const sfEl = document.createElement('div');
        sfEl.className = 'result-card';
        sfEl.innerHTML = `
      <div class="label">Style Fingerprint</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 8px; font-size: 11px;">
        <div>Avg Sentence: <strong>${sf.sentence_length_mean?.toFixed(1)} words</strong></div>
        <div>Passive: <strong>${(sf.passive_voice_ratio * 100).toFixed(1)}%</strong></div>
        <div>Vocabulary: <strong>${(sf.vocabulary_complexity * 100).toFixed(0)}%</strong></div>
        <div>Adverbs: <strong>${(sf.adverb_usage_rate * 100).toFixed(1)}%</strong></div>
      </div>
    `;
        container.appendChild(sfEl);
    }

    results.classList.remove('hidden');
}

async function grabPageText() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString(),
        });

        if (result) {
            document.getElementById('textInput').value = result;
        } else {
            alert('No text selected. Select some text on the page first.');
        }
    } catch (error) {
        console.error('Failed to grab text:', error);
        alert('Failed to grab text from page.');
    }
}

// Load saved text from storage on popup open
chrome.storage.local.get(['lastText'], (result) => {
    if (result.lastText) {
        document.getElementById('textInput').value = result.lastText;
    }
});

// Save text to storage before popup closes
window.addEventListener('beforeunload', () => {
    const text = document.getElementById('textInput').value;
    chrome.storage.local.set({ lastText: text });
});
