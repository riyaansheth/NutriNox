// ApiClient Wrapper
const API_BASE = 'http://localhost:3001';

const ApiClient = {
    async post(endpoint, body) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            return data.data;
        } catch (err) {
            console.error(`API Error on ${endpoint}:`, err);
            throw err;
        }
    }
};

// State
const StateManager = {
    chatHistory: []
};

// UI Helpers
function getSpinner() {
    return document.getElementById('spinnerTpl').content.cloneNode(true);
}

function showResult(boxId, contentHTML) {
    const box = document.getElementById(boxId);
    box.innerHTML = contentHTML;
    box.classList.add('visible');
}

function showError(boxId, message) {
    showResult(boxId, `<div class="text-error">⚠️ ${message}</div>`);
}

function formatAnalysisResult(data) {
    if (!data) return "No data returned.";
    let html = `<p>${data.analysis}</p>`;
    if (data.insights && data.insights.length > 0) {
        html += `<ul>${data.insights.map(i => `<li>${i}</li>`).join('')}</ul>`;
    }
    return html;
}

// NavController
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        const target = e.target;
        target.classList.add('active');
        document.getElementById(target.dataset.tab).classList.add('active');
    });
});

// ChatModule
const ChatModule = {
    historyEl: document.getElementById('chatHistory'),
    inputEl: document.getElementById('chatInput'),
    btnEl: document.getElementById('sendChatBtn'),

    init() {
        this.btnEl.addEventListener('click', () => this.send());
        this.inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });
    },

    appendBubble(role, text) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        div.innerHTML = `
            <div class="avatar">${role === 'user' ? 'U' : 'N'}</div>
            <div class="bubble">${text.replace(/\\n/g, '<br>')}</div>
        `;
        this.historyEl.appendChild(div);
        this.historyEl.scrollTop = this.historyEl.scrollHeight;
    },

    async send() {
        const text = this.inputEl.value.trim();
        if (!text) return;

        this.appendBubble('user', text);
        this.inputEl.value = '';
        this.inputEl.disabled = true;
        this.btnEl.disabled = true;

        // Temporary loading bubble
        const loadingId = 'load-' + Date.now();
        const loadDiv = document.createElement('div');
        loadDiv.className = 'message system';
        loadDiv.id = loadingId;
        loadDiv.innerHTML = `<div class="avatar">N</div><div class="bubble"><div class="spinner"></div></div>`;
        this.historyEl.appendChild(loadDiv);
        this.historyEl.scrollTop = this.historyEl.scrollHeight;

        try {
            const data = await ApiClient.post('/chat', { message: text });
            document.getElementById(loadingId).remove();
            this.appendBubble('system', data.reply);
        } catch (err) {
            document.getElementById(loadingId).remove();
            this.appendBubble('system', `<span class="text-error">Error: ${err.message}</span>`);
        } finally {
            this.inputEl.disabled = false;
            this.btnEl.disabled = false;
            this.inputEl.focus();
        }
    }
};

// FoodLogModule
const FoodLogModule = {
    inputEl: document.getElementById('foodInput'),
    btnEl: document.getElementById('logFoodBtn'),
    statusEl: document.getElementById('logStatus'),
    listEl: document.getElementById('logsList'),

    init() {
        this.btnEl.addEventListener('click', () => this.logFood());
        document.getElementById('refreshLogs').addEventListener('click', () => {
            // In a real app we'd fetch from server. For now, we simulate.
            this.statusEl.innerHTML = "<span class='text-success'>Logs refreshed.</span>";
            setTimeout(()=> this.statusEl.innerHTML = "", 2000);
        });
    },

    async logFood() {
        const text = this.inputEl.value.trim();
        if (!text) return;

        this.btnEl.disabled = true;
        this.statusEl.innerHTML = '';
        this.statusEl.appendChild(getSpinner());

        try {
            const data = await ApiClient.post('/log-food', { text });
            this.inputEl.value = '';
            this.statusEl.innerHTML = '<span class="text-success">Meal logged successfully!</span>';
            
            // Add to UI
            const entry = data.logged;
            const itemHtml = `<div class="log-item">
                <span>${new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                ${entry.raw}
                <div style="color:var(--text-muted); font-size: 0.8rem; margin-top:4px;">
                    Type: ${entry.parsed.meal_type} | Est. cal: ${entry.parsed.calories_estimate}
                </div>
            </div>`;
            
            if (this.listEl.querySelector('.empty-state')) {
                this.listEl.innerHTML = '';
            }
            this.listEl.insertAdjacentHTML('afterbegin', itemHtml);

        } catch (err) {
            this.statusEl.innerHTML = `<span class="text-error">Error: ${err.message}</span>`;
        } finally {
            this.btnEl.disabled = false;
            setTimeout(() => {
                if (this.statusEl.innerText.includes('successfully')) this.statusEl.innerHTML = '';
            }, 3000);
        }
    }
};

// InsightsModule
const InsightsModule = {
    init() {
        document.getElementById('btnSymptom').addEventListener('click', () => this.runAnalyze('symptom', 'symptomInput', 'btnSymptom', 'symptomResult'));
        document.getElementById('btnExplain').addEventListener('click', () => this.runAnalyze('explain', 'explainInput', 'btnExplain', 'explainResult'));
        document.getElementById('btnHabits').addEventListener('click', () => this.runAnalyze('habits', null, 'btnHabits', 'habitResult'));
        document.getElementById('btnSuggest').addEventListener('click', () => this.runSuggest());
    },

    async runAnalyze(type, inputId, btnId, resultId) {
        let input = '';
        if (inputId) {
            input = document.getElementById(inputId).value.trim();
            if (!input) return;
        }

        const btn = document.getElementById(btnId);
        btn.disabled = true;
        showResult(resultId, '<div class="spinner"></div>');

        try {
            const data = await ApiClient.post('/analyze', { type, input });
            showResult(resultId, formatAnalysisResult(data));
        } catch (err) {
            showError(resultId, err.message);
        } finally {
            btn.disabled = false;
        }
    },

    async runSuggest() {
        const input = document.getElementById('cravingInput').value.trim();
        if (!input) return;

        const btn = document.getElementById('btnSuggest');
        const boxId = 'suggestResult';
        btn.disabled = true;
        showResult(boxId, '<div class="spinner"></div>');

        try {
            const data = await ApiClient.post('/suggest', { craving: input });
            if (!data.suggestions || data.suggestions.length === 0) {
                showResult(boxId, "<p>No suggestions found.</p>");
                return;
            }
            let html = '<ul>';
            data.suggestions.forEach(s => {
                html += `<li style="margin-bottom:10px;"><strong>${s.item}</strong><br><span style="color:var(--text-muted);">${s.reason}</span></li>`;
            });
            html += '</ul>';
            showResult(boxId, html);
        } catch (err) {
            showError(boxId, err.message);
        } finally {
            btn.disabled = false;
        }
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => {
    ChatModule.init();
    FoodLogModule.init();
    InsightsModule.init();
});
