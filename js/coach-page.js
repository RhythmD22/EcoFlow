import { EcoData } from './data.js';
import { EcoCoach } from './coach.js';
import { escapeHTML } from './utils.js';

let pendingPrompt = null;
let serverApiStatus = { gemini: false, openweathermap: false };

async function checkServerApiStatus() {
  try {
    const response = await fetch('/api/api-status');
    if (response.ok) {
      serverApiStatus = await response.json();
      return serverApiStatus;
    }
  } catch (err) { /* ignore */ }
  return serverApiStatus;
}

function setPendingPrompt(prompt) {
  pendingPrompt = prompt;
}

function initCoach() {
  const appData = EcoData.load();

  const input = document.getElementById('coach-input');
  const sendBtn = document.getElementById('btn-send');
  const chat = document.getElementById('coach-chat');
  const typingEl = document.getElementById('coach-typing');
  const suggestionsContainer = document.getElementById('coach-suggestions');
  const messagesContainer = document.getElementById('coach-messages');
  const apiStatus = document.getElementById('coach-api-status');
  const clearBtn = document.getElementById('btn-clear-chat');
  const coachError = document.getElementById('coach-error');

  checkServerApiStatus().then(() => {
    updateApiStatusText(apiStatus);
  });

  if (apiStatus) {
    if (EcoCoach.hasAPIKey() || serverApiStatus.gemini) {
      apiStatus.textContent = 'AI powered by Google Gemini';
    } else {
      apiStatus.textContent = 'Using offline responses. Add a Gemini API key in Settings for personalized AI coaching.';
    }
  }

  if (pendingPrompt && input) {
    input.value = pendingPrompt;
    pendingPrompt = null;
  }

  const suggestionsOriginalDisplay = suggestionsContainer ? getComputedStyle(suggestionsContainer).display : 'flex';

  suggestionChips(suggestionsContainer);

  const history = EcoData.getChatHistory(appData);
  if (history.length > 0) {
    history.forEach(msg => {
      messagesContainer.insertAdjacentHTML('beforeend', `
        <div class="message ${msg.role}">
          <div class="message-bubble">${escapeHTML(msg.text)}</div>
          <span class="message-time">${msg.time}</span>
        </div>
      `);
    });
    chat.scrollTop = chat.scrollHeight;
    clearBtn.hidden = false;
  } else {
    clearBtn.hidden = true;
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => sendCoachMessage());
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendCoachMessage();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      EcoData.clearChatHistory(appData);
      messagesContainer.innerHTML = '';
      clearBtn.hidden = true;
      if (suggestionsContainer) suggestionsContainer.style.display = suggestionsOriginalDisplay;
      if (coachError) coachError.hidden = true;
    });
  }

  function suggestionChips(container) {
    if (!container) return;
    container.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        if (prompt) sendCoachMessage(prompt);
      });
    });
  }

  async function sendCoachMessage(prefillText) {
    const text = prefillText || (input ? input.value.trim() : '');
    if (!text) return;

    if (input) input.value = '';
    if (coachError) coachError.hidden = true;

    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    messagesContainer.insertAdjacentHTML('beforeend', `
      <div class="message user">
        <div class="message-bubble">${escapeHTML(text)}</div>
        <span class="message-time">${time}</span>
      </div>
    `);
    EcoData.addChatMessage(appData, 'user', text, time);

    typingEl.hidden = false;
    chat.scrollTop = chat.scrollHeight;

    const result = await EcoCoach.sendMessage(text);

    typingEl.hidden = true;

    const respTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    messagesContainer.insertAdjacentHTML('beforeend', `
      <div class="message coach">
        <div class="message-bubble">${escapeHTML(result.text)}</div>
        <span class="message-time">${respTime}</span>
      </div>
    `);
    EcoData.addChatMessage(appData, 'coach', result.text, respTime);

    if (result.fallback && coachError) {
      const hasKey = EcoCoach.hasAPIKey() || serverApiStatus.gemini;
      const errorMessages = {
        no_key: hasKey ? 'AI response unavailable - using offline responses.' : 'No API key set - using offline responses. Add a Gemini API key in Settings.',
        auth: 'API key rejected - using offline responses. Check your API key in Settings.',
        rate_limit: 'API rate limit reached - using offline responses for now.',
        network: 'Network error - using offline responses. Check your connection.',
        api_error: 'AI unavailable - using offline responses. Try again.',
      };
      coachError.textContent = errorMessages[result.error] || errorMessages.api_error;
      coachError.hidden = false;
    }

    chat.scrollTop = chat.scrollHeight;

    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }

    clearBtn.hidden = false;
  }
}

function updateApiStatusText(apiStatus) {
  if (!apiStatus) return;
  if (EcoCoach.hasAPIKey() || serverApiStatus.gemini) {
    apiStatus.textContent = 'AI powered by Google Gemini';
  }
}

export { initCoach, setPendingPrompt };