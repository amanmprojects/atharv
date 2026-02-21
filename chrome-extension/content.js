// Content script for ScriptIQ Chrome Extension
// Injects inline analysis UI on web pages

(() => {
    let tooltipEl = null;

    // Listen for results from background
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'SCRIPTIQ_RESULTS') {
            showResultsTooltip(message.data);
        }
        if (message.type === 'SCRIPTIQ_ERROR') {
            showErrorTooltip(message.error);
        }
    });

    function showResultsTooltip(data) {
        removeTooltip();

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        tooltipEl = document.createElement('div');
        tooltipEl.id = 'scriptiq-tooltip';
        tooltipEl.innerHTML = `
      <div class="scriptiq-header">
        <span class="scriptiq-logo">⚡ ScriptIQ</span>
        <button class="scriptiq-close" onclick="document.getElementById('scriptiq-tooltip')?.remove()">✕</button>
      </div>
      <div class="scriptiq-stats">
        <span>${data.word_count} words</span>
        <span>${data.suggestions?.length || 0} suggestions</span>
      </div>
      <div class="scriptiq-body">
        ${(data.suggestions || []).slice(0, 5).map(s => `
          <div class="scriptiq-suggestion">
            <div class="scriptiq-rule">${s.rule_triggered.split('.').pop().replace(/_/g, ' ')}</div>
            <div class="scriptiq-reason">${s.reason}</div>
          </div>
        `).join('')}
        ${(!data.suggestions || data.suggestions.length === 0) ? '<p class="scriptiq-empty">No issues found ✨</p>' : ''}
      </div>
    `;

        tooltipEl.style.cssText = `
      position: fixed;
      top: ${Math.min(rect.bottom + 10, window.innerHeight - 320)}px;
      left: ${Math.min(rect.left, window.innerWidth - 340)}px;
      z-index: 999999;
    `;

        document.body.appendChild(tooltipEl);

        // Auto-remove after 30s
        setTimeout(() => removeTooltip(), 30000);
    }

    function showErrorTooltip(error) {
        removeTooltip();

        tooltipEl = document.createElement('div');
        tooltipEl.id = 'scriptiq-tooltip';
        tooltipEl.innerHTML = `
      <div class="scriptiq-header">
        <span class="scriptiq-logo">⚡ ScriptIQ</span>
        <button class="scriptiq-close" onclick="document.getElementById('scriptiq-tooltip')?.remove()">✕</button>
      </div>
      <div class="scriptiq-body">
        <p class="scriptiq-error">${error}</p>
      </div>
    `;

        tooltipEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
    `;

        document.body.appendChild(tooltipEl);
        setTimeout(() => removeTooltip(), 5000);
    }

    function removeTooltip() {
        if (tooltipEl) {
            tooltipEl.remove();
            tooltipEl = null;
        }
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (tooltipEl && !tooltipEl.contains(e.target)) {
            removeTooltip();
        }
    });
})();
