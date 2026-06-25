import { EcoData } from './data.js';
import { EcoCoach } from './coach.js';
import { escapeHTML } from './utils.js';

function initCoach(appData) {
  const input = document.getElementById('coach-input');
  const sendBtn = document.getElementById('btn-send');
  const chat = document.getElementById('coach-chat');
  const typingEl = document.getElementById('coach-typing');
  const suggestionsContainer = document.getElementById('coach-suggestions');
  const messagesContainer = document.getElementById('coach-messages');
  const apiStatus = document.getElementById('coach-api-status');
  const clearBtn = document.getElementById('btn-clear-chat');
  const coachError = document.getElementById('coach-error');

  if (EcoCoach.hasAPIKey()) {
    apiStatus.textContent = 'AI powered by Google Gemini';
  } else {
    apiStatus.textContent = 'Using offline responses. Add a Gemini API key in Settings for personalized AI coaching.';
  }

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

  suggestionChips(suggestionsContainer);

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
      coachError.textContent = 'AI unavailable — using offline responses. Check your API key or connection.';
      coachError.hidden = false;
    }

    chat.scrollTop = chat.scrollHeight;

    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }

    clearBtn.hidden = false;
  }
}

export { initCoach };