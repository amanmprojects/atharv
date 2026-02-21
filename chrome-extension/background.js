// Background service worker for ScriptIQ Chrome Extension

const API_URL = 'http://localhost:8000/api/analysis';

// Context menu for right-click analysis
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'scriptiq-analyze',
        title: 'Analyze with ScriptIQ',
        contexts: ['selection'],
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'scriptiq-analyze' && info.selectionText) {
        try {
            const response = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: info.selectionText,
                    genre: 'fiction',
                    mode: 'full',
                    enable_narrative: true,
                    enable_structural: true,
                    enable_emotional: false,
                    enable_style: true,
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            // Send results to content script
            chrome.tabs.sendMessage(tab.id, {
                type: 'SCRIPTIQ_RESULTS',
                data: data,
            });
        } catch (error) {
            console.error('ScriptIQ analysis failed:', error);
            chrome.tabs.sendMessage(tab.id, {
                type: 'SCRIPTIQ_ERROR',
                error: 'Failed to connect to ScriptIQ backend.',
            });
        }
    }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ANALYZE_TEXT') {
        fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message.payload),
        })
            .then(r => r.json())
            .then(data => sendResponse({ success: true, data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async response
    }
});
