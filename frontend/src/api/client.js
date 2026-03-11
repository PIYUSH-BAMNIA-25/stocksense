const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchJSON(url, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${url}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`API call failed: ${url}`, err);
        throw err;
    }
}

// --- Predictions ---
export const getPredictions = () => fetchJSON('/predictions/all');
export const getPrediction = (ticker) => fetchJSON(`/predictions/${ticker}`);

// --- Prices ---
export const getPriceHistory = (ticker, days = 30) =>
    fetchJSON(`/prices/${ticker}?days=${days}`);

// --- History ---
export const getHistory = (ticker, days = 30) =>
    fetchJSON(`/history/${ticker}?days=${days}`);

// --- Stats ---
export const getModelAccuracy = () => fetchJSON('/stats/model-accuracy');
export const getMarketRegime = () => fetchJSON('/market/regime');

// --- Game ---
export const submitPrediction = (data) =>
    fetchJSON('/game/predict', {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const getGameResults = (date) => fetchJSON(`/game/results/${date}`);
export const getGameScores = (sessionId) => fetchJSON(`/game/scores/${sessionId}`);
export const getLeaderboard = (period = 'alltime') =>
    fetchJSON(`/game/leaderboard?period=${period}`);

// --- Session Management ---
export function getSessionId() {
    let id = localStorage.getItem('stocksense_session_id');
    if (!id) {
        id = 'ss_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
        localStorage.setItem('stocksense_session_id', id);
    }
    return id;
}

export function getUsername() {
    return localStorage.getItem('stocksense_username') || null;
}

export function setUsername(name) {
    localStorage.setItem('stocksense_username', name);
}
