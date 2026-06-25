import { EcoData } from './data.js';
import { EcoCoach } from './coach.js';
import { EcoScan } from './scan.js';

const TOAST_DURATION = 2200;
const CONFETTI_COUNT = 40;
const CONFETTI_DURATION = 2500;
const STREAK_WEEK = 7;
const TREE_THRESHOLDS = [1, 3, 6, 10, 15, 25, 40, 60];
const LOCALE = 'en-US';

(() => {
  'use strict';

  const routeMap = {
    home: { template: 'template-home', title: 'EcoFlow' },
    habits: { template: 'template-habits', title: 'Habits' },
    coach: { template: 'template-coach', title: 'Coach' },
    impact: { template: 'template-impact', title: 'Impact' },
    scan: { template: 'template-scan', title: 'Scan' },
    settings: { template: 'template-settings', title: 'Settings' },
  };

  let currentRoute = 'home';
  let appData = EcoData.load();

  /* ── ROUTER ────────────────────────────────── */

  function navigateTo(route) {
    if (currentRoute === 'scan' && route !== 'scan' && window._ecoScanCleanup) {
      window._ecoScanCleanup();
    }

    if (route === currentRoute && document.querySelector(`[data-page="${route}"]`)) return;
    if (!routeMap[route]) return;

    currentRoute = route;
    const spec = routeMap[route];
    const template = document.getElementById(spec.template);
    if (!template) return;

    const root = document.getElementById('app-root');
    root.innerHTML = '';
    root.appendChild(template.content.cloneNode(true));

    document.getElementById('page-title').textContent = spec.title;
    document.title = `${spec.title} — EcoFlow`;

    document.querySelectorAll('.nav-item').forEach(btn => {
      const isActive = btn.dataset.route === route;
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    switch (route) {
      case 'home': initHome(); break;
      case 'habits': initHabits(); break;
      case 'coach': initCoach(); break;
      case 'impact': initImpact(); break;
      case 'scan': initScan(); break;
      case 'settings': initSettings(); break;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });

    root.setAttribute('tabindex', '-1');
    root.focus({ preventScroll: true });
  }

  /* ── TOAST ─────────────────────────────────── */

  function showToast(message, type = '') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('out');
      toast.addEventListener('animationend', () => toast.remove());
    }, TOAST_DURATION);
  }

  /* ── CONFETTI ──────────────────────────────── */

  function spawnConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    const colors = ['#4ade80', '#6ee7b7', '#34d399', '#a3e635', '#bbf7d0', '#38bdf8'];
    document.body.appendChild(container);

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      piece.style.animationDuration = `${1 + Math.random() * 1.5}s`;
      piece.style.width = `${6 + Math.random() * 8}px`;
      piece.style.height = `${4 + Math.random() * 6}px`;
      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), CONFETTI_DURATION);
  }

  /* ── HOME PAGE ─────────────────────────────── */

  function initHome() {
    appData = EcoData.load();

    const greeting = document.getElementById('greeting-text');
    const hour = new Date().getHours();
    if (hour < 12) greeting.textContent = 'Good morning';
    else if (hour < 17) greeting.textContent = 'Good afternoon';
    else greeting.textContent = 'Good evening';

    const streakCount = document.getElementById('streak-count');
    const streakBar = document.getElementById('streak-bar');
    const streakMsg = document.getElementById('streak-message');

    streakCount.textContent = appData.streaks.current;
    const streakPct = Math.min(100, (appData.streaks.current / 7) * 100);
    streakBar.style.width = `${streakPct}%`;

    if (appData.streaks.current >= 7) {
      streakMsg.innerHTML = `A full week! Longest streak: ${appData.streaks.longest} days <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/></svg>`;
    } else if (appData.streaks.current > 0) {
      streakMsg.textContent = `${7 - appData.streaks.current} days to a perfect week`;
    } else {
      streakMsg.textContent = 'Log a habit to start your streak!';
    }

    updateTree();
    initChallenge();
    initQuickHabits();
  }

  function updateTree() {
    const total = appData.totalActions;
    const branchIds = ['branch-1', 'branch-2', 'branch-3', 'branch-4', 'branch-5', 'branch-6', 'branch-7', 'branch-8'];
    const thresholds = [1, 3, 6, 10, 15, 25, 40, 60];

    branchIds.forEach((id, i) => {
      const branch = document.getElementById(id);
      if (!branch) return;
      if (total >= thresholds[i]) {
        branch.classList.add('show');
      } else {
        branch.classList.remove('show');
      }
    });

    const crown = document.getElementById('crown');
    if (crown) {
      crown.classList.toggle('show', total >= 60);
    }

    const totalActions = document.getElementById('total-habits');
    const co2Saved = document.getElementById('co2-saved');
    const treeLabel = document.getElementById('tree-label');

    if (totalActions) totalActions.textContent = total;
    if (co2Saved) co2Saved.textContent = appData.totalCO2.toFixed(1);

    const labels = [
      'Complete habits to grow your tree',
      'A tiny sprout appears',
      'Your tree is taking root',
      'Branches are spreading',
      'Leaves are flourishing',
      'Your tree is thriving!',
      'A forest begins with one tree',
      'You\'re building a canopy!',
      'Full bloom — incredible work!',
      'Your tree is a beacon of change',
    ];
    const idx = Math.min(Math.floor(total / 7), labels.length - 1);
    if (treeLabel) treeLabel.textContent = labels[idx];
  }

  function initChallenge() {
    const challenge = EcoData.getDailyChallenge(appData);
    const titleEl = document.getElementById('challenge-title');
    const descEl = document.getElementById('challenge-desc');
    const btn = document.getElementById('btn-complete-challenge');

    if (titleEl) titleEl.textContent = challenge.title;
    if (descEl) descEl.textContent = challenge.desc;

    if (btn) {
      btn.replaceWith(btn.cloneNode(true));
      const newBtn = document.getElementById('btn-complete-challenge');

      if (appData.challengeCompleted) {
        newBtn.classList.add('done');
        newBtn.setAttribute('aria-disabled', 'true');
        newBtn.innerHTML = '<span>Completed!</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      } else {
        newBtn.addEventListener('click', () => {
          const success = EcoData.completeChallenge(appData);
          if (success) {
            appData = EcoData.load();
            newBtn.classList.add('done');
            newBtn.setAttribute('aria-disabled', 'true');
            newBtn.innerHTML = '<span>Completed!</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
            showToast(`+${challenge.co2Bonus.toFixed(2)} kg CO₂ saved!`, 'success');
            spawnConfetti();
            updateTree();
            updateStreakDisplay();
          }
        });
      }
    }
  }

  function updateStreakDisplay() {
    const streakCount = document.getElementById('streak-count');
    const streakBar = document.getElementById('streak-bar');
    const streakMsg = document.getElementById('streak-message');
    if (streakCount) {
      streakCount.textContent = appData.streaks.current;
      streakCount.classList.add('pulse');
      setTimeout(() => streakCount.classList.remove('pulse'), 600);
    }
    if (streakBar) {
      streakBar.style.width = `${Math.min(100, (appData.streaks.current / 7) * 100)}%`;
    }
    if (streakMsg) {
      if (appData.streaks.current >= 7) {
        streakMsg.innerHTML = `A full week! Longest streak: ${appData.streaks.longest} days <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/></svg>`;
      } else if (appData.streaks.current > 0) {
        streakMsg.textContent = `${7 - appData.streaks.current} days to a perfect week`;
      }
    }
  }

  function initQuickHabits() {
    document.querySelectorAll('.quick-habit').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });

    document.querySelectorAll('.quick-habit').forEach(btn => {
      const habitId = btn.dataset.habit;
      if (!habitId) return;

      const isDone = EcoData.isHabitDone(appData, habitId);
      if (isDone) {
        btn.classList.add('logged');
      }
      btn.setAttribute('aria-pressed', String(isDone));

      btn.addEventListener('click', () => {
        const added = EcoData.toggleHabit(appData, habitId);
        appData = EcoData.load();

        if (added) {
          btn.classList.add('logged');
          btn.setAttribute('aria-pressed', 'true');
          showToast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg> Habit logged!', 'success');
          if (appData.streaks.current >= 7 && appData.streaks.current % 7 === 0) {
            spawnConfetti();
          }
          updateTree();
          updateStreakDisplay();
        } else {
          btn.classList.remove('logged');
          btn.setAttribute('aria-pressed', 'false');
        }
      });
    });
  }

  /* ── HABITS PAGE ───────────────────────────── */

  function initHabits() {
    appData = EcoData.load();

    let selectedDate = EcoData.getTodayKey();
    let activeCat = 'all';
    let calMonth = new Date().getMonth();
    let calYear = new Date().getFullYear();

    const datePill = document.getElementById('today-date');
    updateDatePill();

    renderHabitList(activeCat, selectedDate);
    renderHeatmap();

    datePill.addEventListener('click', () => {
      const dropdown = document.getElementById('calendar-dropdown');
      const isHidden = dropdown.hidden;
      dropdown.hidden = !isHidden;
      datePill.setAttribute('aria-expanded', String(!isHidden));
      if (!isHidden) return;
      calMonth = parseInt(selectedDate.split('-')[1]) - 1;
      calYear = parseInt(selectedDate.split('-')[0]);
      renderCalendar();
    });

    document.getElementById('cal-prev').addEventListener('click', () => {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      renderCalendar();
    });

    document.getElementById('cal-next').addEventListener('click', () => {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      renderCalendar();
    });

    document.getElementById('cal-today').addEventListener('click', () => {
      selectedDate = EcoData.getTodayKey();
      calMonth = new Date().getMonth();
      calYear = new Date().getFullYear();
      updateDatePill();
      renderCalendar();
      document.getElementById('calendar-dropdown').hidden = true;
      datePill.setAttribute('aria-expanded', 'false');
      appData = EcoData.load();
      renderHabitList(activeCat, selectedDate);
    });

    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.setAttribute('aria-pressed', tab.dataset.cat === activeCat);
      tab.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-pressed', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-pressed', 'true');
        activeCat = tab.dataset.cat;
        renderHabitList(activeCat, selectedDate);
      });
    });

    const addBtn = document.getElementById('btn-add-habit');
    if (addBtn) {
      addBtn.addEventListener('click', addCustomHabit);
    }

    function updateDatePill() {
      const d = new Date(selectedDate + 'T12:00:00');
      datePill.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    function renderCalendar() {
      document.getElementById('cal-month-year').textContent =
        new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const grid = document.getElementById('calendar-grid');
      const firstDay = new Date(calYear, calMonth, 1).getDay();
      const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
      const today = EcoData.getTodayKey();

      let html = '';
      for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const classes = ['calendar-day'];
        if (dateKey === today) classes.push('today');
        if (dateKey === selectedDate) classes.push('selected');
        const habitsOnDay = EcoData.getHabitsForDate(appData, dateKey);
        if (habitsOnDay.length > 0) classes.push('has-habits');
        html += `<button class="${classes.join(' ')}" data-date="${dateKey}">${day}</button>`;
      }

      grid.innerHTML = html;

      grid.querySelectorAll('.calendar-day:not(.empty)').forEach(dayBtn => {
        dayBtn.addEventListener('click', () => {
          selectedDate = dayBtn.dataset.date;
          updateDatePill();
          renderCalendar();
          document.getElementById('calendar-dropdown').hidden = true;
          datePill.setAttribute('aria-expanded', 'false');
          appData = EcoData.load();
          renderHabitList(activeCat, selectedDate);
        });
      });
    }
  }

  function renderHabitList(category, dateKey = null) {
    const list = document.getElementById('habits-list');
    const countEl = document.getElementById('today-count');
    if (!list) return;

    const dk = dateKey || EcoData.getTodayKey();

    let habits = appData.habits;
    if (category !== 'all') {
      habits = habits.filter(h => h.category === category);
    }

    const dateHabits = EcoData.getHabitsForDate(appData, dk);
    const doneCount = habits.filter(h => dateHabits.includes(h.id)).length;
    if (countEl) countEl.textContent = `${doneCount} / ${habits.length}`;

    list.innerHTML = habits.map(h => {
      const checked = dateHabits.includes(h.id);
      const isDefault = EcoData.defaultHabits.some(dh => dh.id === h.id);
      return `
        <div class="habit-item glass glass-card" data-habit-id="${h.id}">
          <button class="habit-check ${checked ? 'checked' : ''}" role="checkbox" aria-checked="${checked}" aria-label="${checked ? 'Undo' : 'Complete'}: ${h.name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <div class="habit-info">
            <div class="habit-name">${h.icon} ${h.name}</div>
            <div class="habit-category">${h.category} · ${h.co2PerAction} kg CO₂</div>
          </div>
          <span class="habit-co2">${h.co2PerAction} kg</span>
          ${!isDefault ? `<button class="habit-delete" aria-label="Delete ${h.name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>` : ''}
        </div>
      `;
    }).join('');

    list.querySelectorAll('.habit-check').forEach(check => {
      check.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = check.closest('.habit-item');
        const habitId = item.dataset.habitId;
        const added = EcoData.toggleHabit(appData, habitId, dk);
        appData = EcoData.load();

        if (added) {
          check.classList.add('checked');
          showToast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg> Habit logged!', 'success');
        } else {
          check.classList.remove('checked');
        }

        renderHabitList(category, dk);
      });
    });

    list.querySelectorAll('.habit-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = btn.closest('.habit-item');
        const habitId = item.dataset.habitId;
        EcoData.removeHabit(appData, habitId);
        appData = EcoData.load();
        renderHabitList(category, dk);
      });
    });
  }

  function renderHeatmap() {
    const grid = document.getElementById('heatmap-grid');
    if (!grid) return;

    const days = EcoData.getWeeklyHeatmap(appData);
    const maxCount = Math.max(1, ...days.map(d => d.count));

    grid.innerHTML = days.map(d => {
      const cls = d.count > 0 ? 'filled' : '';
      return `<div class="heatmap-cell ${cls}">${d.count || ''}</div>`;
    }).join('');
  }

  async function addCustomHabit() {
    const name = await showPrompt('New Habit', 'What habit do you want to track?');
    if (!name || !name.trim()) return;

    const categories = ['transport', 'food', 'energy', 'shopping', 'waste', 'water'];
    const cat = await showPrompt('Category', `Choose a category: ${categories.join(', ')}`, 'food');
    if (!cat || !categories.includes(cat.toLowerCase())) {
      showToast('Please choose a valid category', '');
      return;
    }

    const co2Str = await showPrompt('CO₂ Impact', 'How many kg of CO₂ does this action save?', '0.5');
    const co2 = parseFloat(co2Str) || 0.5;

    EcoData.addCustomHabit(appData, name.trim(), cat.toLowerCase(), co2);
    appData = EcoData.load();
    renderHabitList(document.querySelector('.cat-tab.active')?.dataset?.cat || 'all', EcoData.getTodayKey());
    showToast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg> Habit added!', 'success');
  }

  /* ── COACH PAGE ────────────────────────────── */

  function initCoach() {
    const input = document.getElementById('coach-input');
    const sendBtn = document.getElementById('btn-send');
    const chat = document.getElementById('coach-chat');
    const typingEl = document.getElementById('coach-typing');
    const suggestionsContainer = document.getElementById('coach-suggestions');
    const messagesContainer = document.getElementById('coach-messages');
    const apiStatus = document.getElementById('coach-api-status');

    if (EcoCoach.hasAPIKey()) {
      apiStatus.textContent = 'AI powered by Google Gemini';
    } else {
      apiStatus.textContent = 'Using offline responses. Add a Gemini API key in Settings for personalized AI coaching.';
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

      const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      messagesContainer.insertAdjacentHTML('beforeend', `
        <div class="message user">
          <div class="message-bubble">${escapeHTML(text)}</div>
          <span class="message-time">${time}</span>
        </div>
      `);

      typingEl.hidden = false;
      chat.scrollTop = chat.scrollHeight;

      const response = await EcoCoach.sendMessage(text);

      typingEl.hidden = true;

      messagesContainer.insertAdjacentHTML('beforeend', `
        <div class="message coach">
          <div class="message-bubble">${escapeHTML(response)}</div>
          <span class="message-time">${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      `);

      chat.scrollTop = chat.scrollHeight;

      if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
      }
    }
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  /* ── IMPACT PAGE ───────────────────────────── */

  function initImpact() {
    appData = EcoData.load();

    const totalCO2 = document.getElementById('impact-total-co2');
    const equivalent = document.getElementById('impact-equivalent');

    if (totalCO2) totalCO2.textContent = appData.totalCO2.toFixed(1);

    const treesVal = appData.totalCO2 / 21;
    const carMiles = appData.totalCO2 / 0.404;
    const waterLiters = appData.totalCO2 / 0.001;
    const energyKWh = appData.totalCO2 / 0.4;

    document.getElementById('eq-trees').textContent = treesVal.toFixed(1);
    document.getElementById('eq-car-miles').textContent = Math.round(carMiles);
    document.getElementById('eq-water').textContent = Math.round(waterLiters);
    document.getElementById('eq-energy').textContent = energyKWh.toFixed(1);

    if (equivalent) {
      if (appData.totalCO2 < 1) {
        equivalent.textContent = 'Every action counts. Keep going to see your impact grow.';
      } else if (appData.totalCO2 < 10) {
        equivalent.textContent = `That's like planting ${Math.ceil(treesVal)} tree seedling${Math.ceil(treesVal) > 1 ? 's' : ''} — keep it up!`;
      } else if (appData.totalCO2 < 50) {
        equivalent.textContent = `Impressive! Equivalent to taking a car off the road for ${Math.round(carMiles / 40)} days.`;
      } else {
        equivalent.textContent = `Outstanding! You've matched the annual carbon capture of ${treesVal.toFixed(1)} mature trees.`;
      }
    }

    renderBreakdown();
  }

  function renderBreakdown() {
    const list = document.getElementById('breakdown-list');
    if (!list) return;

    const breakdown = EcoData.getCategoryBreakdown(appData);
    const maxCO2 = Math.max(1, ...Object.values(breakdown).map(b => b.co2));

    const icons = {
      transport: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>',
      food: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10"/><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1"/><path d="m13 12 4-4"/><path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2"/></svg>',
      energy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
      shopping: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/></svg>',
      waste: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
      water: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>',
    };

    list.innerHTML = Object.entries(breakdown)
      .sort((a, b) => b[1].co2 - a[1].co2)
      .map(([cat, data]) => `
        <div class="breakdown-item glass">
          <span class="breakdown-icon">${icons[cat] || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg>'}</span>
          <div class="breakdown-info">
            <div class="breakdown-name">${cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
            <div class="breakdown-count">${data.count} action${data.count !== 1 ? 's' : ''}</div>
          </div>
          <div class="breakdown-bar-track">
            <div class="breakdown-bar-fill" style="width: ${(data.co2 / maxCO2) * 100}%"></div>
          </div>
          <span class="breakdown-co2">${data.co2.toFixed(1)} kg</span>
        </div>
      `).join('');
  }

  /* ── SETTINGS PAGE ─────────────────────────── */

  function initSettings() {
    const apiInput = document.getElementById('settings-api-key');
    const saveBtn = document.getElementById('btn-save-settings-key');
    const resetBtn = document.getElementById('btn-reset-data');
    const exportBtn = document.getElementById('btn-export-data');

    if (apiInput) apiInput.value = EcoData.getAPIKey();

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const key = apiInput ? apiInput.value.trim() : '';
        EcoData.setAPIKey(key);
        showToast('API key saved', 'success');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Reset Data', 'Delete all your EcoFlow data? This cannot be undone.');
        if (confirmed) {
          EcoData.resetAll();
          appData = EcoData.load();
          showToast('All data has been reset', '');
          navigateTo('home');
        }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const json = EcoData.exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ecoflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported!', 'success');
      });
    }
  }

  /* ── SCAN PAGE ─────────────────────────────── */

  function initScan() {
    const input = document.getElementById('scan-barcode');
    const btn = document.getElementById('btn-scan');
    const loadingEl = document.getElementById('scan-loading');
    const errorEl = document.getElementById('scan-error');
    const resultEl = document.getElementById('scan-result');
    const recentEl = document.getElementById('scan-recent');
    const cameraBtn = document.getElementById('btn-camera');
    const viewfinder = document.getElementById('scan-viewfinder');

    let html5QrCode = null;

    let lastProductInfo = null;

    renderRecentScans();

    btn.addEventListener('click', () => performScan());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performScan();
    });

    cameraBtn.addEventListener('click', () => {
      if (html5QrCode && html5QrCode.isScanning) {
        stopCamera();
      } else {
        startCamera();
      }
    });

    document.getElementById('btn-ask-coach').addEventListener('click', () => {
      if (!lastProductInfo) return;
      const prompt = EcoScan.coachPrompt(lastProductInfo);
      navigateTo('coach');
      setTimeout(() => {
        const ci = document.getElementById('coach-input');
        if (ci) ci.value = prompt;
      }, 100);
    });

    window._ecoScanCleanup = () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => { });
        html5QrCode = null;
      }
      viewfinder.hidden = true;
      cameraBtn.innerHTML = '<svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> Scan with Camera';
    };

    function startCamera() {
      if (typeof Html5Qrcode === 'undefined') {
        showToast('Camera library failed to load. Check your connection.', '');
        return;
      }
      viewfinder.hidden = false;
      cameraBtn.textContent = 'Stop Camera';

      html5QrCode = new Html5Qrcode('scan-viewfinder');
      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 4 / 3 },
        (decodedText) => {
          input.value = decodedText;
          stopCamera();
          performScan();
        },
        () => { /* ignore scan errors */ }
      ).catch((err) => {
        viewfinder.hidden = true;
        cameraBtn.innerHTML = '<svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> Scan with Camera';
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          showToast('Camera requires HTTPS on mobile. Use a local HTTPS server or deploy.', '');
        } else {
          showToast(err.message || 'Could not start camera.', '');
        }
      });
    }

    function stopCamera() {
      if (html5QrCode) {
        html5QrCode.stop().catch(() => { });
        html5QrCode = null;
      }
      viewfinder.hidden = true;
      cameraBtn.innerHTML = '<svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> Scan with Camera';
    }

    async function performScan() {
      const barcode = input.value.trim();
      if (!barcode) return;

      loadingEl.hidden = false;
      errorEl.hidden = true;
      resultEl.hidden = true;

      const response = await EcoScan.lookupBarcode(barcode);

      loadingEl.hidden = true;

      if (response.error) {
        errorEl.textContent = response.error;
        errorEl.hidden = false;
        return;
      }

      const info = EcoScan.extractProductInfo(response.product);
      lastProductInfo = info;
      renderProduct(info);
      EcoScan.saveRecentScan(barcode, info);
      renderRecentScans();
    }

    function renderProduct(info) {
      const img = document.getElementById('scan-img');
      img.src = info.image || '';
      img.style.display = info.image ? '' : 'none';

      document.getElementById('scan-name').textContent = info.name;
      document.getElementById('scan-brand').textContent = info.brand || '';

      const gradeEl = document.getElementById('eco-grade');
      const valueEl = document.getElementById('eco-value');
      const scoreBox = document.getElementById('eco-score');

      if (info.ecoscoreGrade) {
        gradeEl.textContent = info.ecoscoreGrade;
        gradeEl.style.color = EcoScan.getEcoScoreColor(info.ecoscoreGrade);
        valueEl.textContent = EcoScan.getEcoScoreDescription(info.ecoscoreGrade);
        scoreBox.style.borderColor = EcoScan.getEcoScoreColor(info.ecoscoreGrade);
      } else {
        gradeEl.textContent = '?';
        gradeEl.style.color = 'var(--text-tertiary)';
        valueEl.textContent = 'No Eco-Score available';
        scoreBox.style.borderColor = 'transparent';
      }

      document.getElementById('detail-packaging').textContent = info.packaging;
      document.getElementById('detail-origins').textContent = info.origins;
      document.getElementById('detail-labels').textContent = info.labels;

      resultEl.hidden = false;
    }

    function renderRecentScans() {
      const recent = EcoScan.getRecentScans();
      const list = document.getElementById('scan-recent-list');

      if (recent.length === 0) {
        recentEl.hidden = true;
        return;
      }

      recentEl.hidden = false;
      list.innerHTML = recent.map(r => `
        <button class="scan-recent-item" data-barcode="${r.barcode}">
          ${r.image ? `<img class="scan-recent-img" src="${r.image}" alt="" onerror="this.style.display='none'">` : ''}
          <span class="scan-recent-name">${r.name}</span>
          ${r.grade ? `<span class="scan-recent-grade" style="background:${EcoScan.getEcoScoreColor(r.grade)}22;color:${EcoScan.getEcoScoreColor(r.grade)}">${r.grade}</span>` : ''}
        </button>
      `).join('');

      list.querySelectorAll('.scan-recent-item').forEach(item => {
        item.addEventListener('click', () => {
          input.value = item.dataset.barcode;
          performScan();
        });
      });
    }
  }

  /* ── THEME ─────────────────────────────────── */

  function getPreferredTheme() {
    const saved = localStorage.getItem('ecoflow_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ecoflow_theme', theme);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'light' ? '#f1f7f3' : '#0d1510');
    }

    const btn = document.getElementById('btn-theme');
    if (btn) {
      btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
  }

  function initTheme() {
    applyTheme(getPreferredTheme());

    const btn = document.getElementById('btn-theme');
    if (btn) {
      btn.addEventListener('click', () => {
        const current = document.documentElement.dataset.theme;
        applyTheme(current === 'light' ? 'dark' : 'light');
      });
    }

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem('ecoflow_theme')) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    });
  }

  /* ── DIALOG ────────────────────────────────── */

  async function showConfirm(title, message) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';
      overlay.innerHTML = `
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
          <h2 class="dialog-title" id="dlg-title">${title}</h2>
          <p class="dialog-message">${message}</p>
          <div class="dialog-actions">
            <button class="btn-cancel" id="dlg-cancel">Cancel</button>
            <button class="btn btn-primary" id="dlg-ok">OK</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const close = (result) => {
        overlay.remove();
        resolve(result);
      };

      overlay.querySelector('#dlg-cancel').addEventListener('click', () => close(false));
      overlay.querySelector('#dlg-ok').addEventListener('click', () => close(true));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', esc); return; }
        if (e.key === 'Tab') {
          const cancel = overlay.querySelector('#dlg-cancel');
          const ok = overlay.querySelector('#dlg-ok');
          if (e.shiftKey && document.activeElement === ok) { e.preventDefault(); cancel.focus(); }
          else if (!e.shiftKey && document.activeElement === cancel) { e.preventDefault(); ok.focus(); }
        }
      });
      overlay.querySelector('#dlg-ok').focus();
    });
  }

  async function showPrompt(title, message, defaultValue = '') {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';
      overlay.innerHTML = `
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
          <h2 class="dialog-title" id="dlg-title">${title}</h2>
          <p class="dialog-message">${message}</p>
          <input type="text" class="dialog-input" id="dlg-input" value="${escapeHTML(defaultValue)}" aria-label="${title}" autocomplete="off">
          <div class="dialog-actions">
            <button class="btn-cancel" id="dlg-cancel">Cancel</button>
            <button class="btn btn-primary" id="dlg-ok">OK</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const close = (result) => {
        overlay.remove();
        resolve(result);
      };

      const input = overlay.querySelector('#dlg-input');
      overlay.querySelector('#dlg-cancel').addEventListener('click', () => close(null));
      overlay.querySelector('#dlg-ok').addEventListener('click', () => close(input.value));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(input.value); });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { close(null); document.removeEventListener('keydown', esc); return; }
        if (e.key === 'Tab') {
          const cancel = overlay.querySelector('#dlg-cancel');
          const ok = overlay.querySelector('#dlg-ok');
          const inp = overlay.querySelector('#dlg-input');
          const elements = [inp, cancel, ok].filter(Boolean);
          const cur = document.activeElement;
          const idx = elements.indexOf(cur);
          if (e.shiftKey) {
            const prev = idx <= 0 ? elements[elements.length - 1] : elements[idx - 1];
            e.preventDefault(); prev.focus();
          } else {
            const next = idx >= elements.length - 1 ? elements[0] : elements[idx + 1];
            e.preventDefault(); next.focus();
          }
        }
      });
      input.focus();
      input.select();
    });
  }

  /* ── INIT ──────────────────────────────────── */

  function init() {
    initTheme();

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        if (route) navigateTo(route);
      });
    });

    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        if (currentRoute === 'settings') navigateTo('home');
        else navigateTo('settings');
      });
    }

    navigateTo('home');

    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      navigator.serviceWorker.register('/EcoFlow/service-worker.js').catch(() => { });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();