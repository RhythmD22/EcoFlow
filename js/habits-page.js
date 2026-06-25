import { EcoData } from './data.js';
import { escapeHTML, showToast, showPrompt } from './utils.js';

function initHabits(appData) {
  let selectedDate = EcoData.getTodayKey();
  let activeCat = 'all';
  let calMonth = new Date().getMonth();
  let calYear = new Date().getFullYear();

  const datePill = document.getElementById('today-date');
  updateDatePill();

  renderHabitList(appData, activeCat, selectedDate);
  renderHeatmap(appData);

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
    const fresh = EcoData.load();
    Object.assign(appData, fresh);
    renderHabitList(appData, activeCat, selectedDate);
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
      renderHabitList(appData, activeCat, selectedDate);
    });
  });

  const addBtn = document.getElementById('btn-add-habit');
  if (addBtn) {
    addBtn.addEventListener('click', () => addCustomHabit(appData, activeCat));
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
        const fresh = EcoData.load();
        Object.assign(appData, fresh);
        renderHabitList(appData, activeCat, selectedDate);
      });
    });
  }
}

function renderHabitList(appData, category, dateKey = null) {
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
    const safeName = escapeHTML(h.name);
    const safeCategory = escapeHTML(h.category.charAt(0).toUpperCase() + h.category.slice(1));
    return `
      <div class="habit-item glass glass-card" data-habit-id="${h.id}">
        <button class="habit-check ${checked ? 'checked' : ''}" role="checkbox" aria-checked="${checked}" aria-label="${checked ? 'Undo' : 'Complete'}: ${safeName}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <div class="habit-info">
          <div class="habit-name">${h.icon} ${safeName}</div>
          <div class="habit-category">${safeCategory} · ${h.co2PerAction} kg CO₂</div>
        </div>
        <span class="habit-co2">${h.co2PerAction} kg</span>
        ${!isDefault ? `<button class="habit-delete" aria-label="Delete ${safeName}">
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
      const fresh = EcoData.load();
      Object.assign(appData, fresh);

      if (added) {
        check.classList.add('checked');
        check.setAttribute('aria-checked', 'true');
        showToast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg> Habit logged!', 'success');
        updateCountDisplay();
      } else {
        check.classList.remove('checked');
        check.setAttribute('aria-checked', 'false');
        updateCountDisplay();
      }
    });
  });

  list.querySelectorAll('.habit-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = btn.closest('.habit-item');
      const habitId = item.dataset.habitId;
      EcoData.removeHabit(appData, habitId);
      const fresh = EcoData.load();
      Object.assign(appData, fresh);
      renderHabitList(appData, category, dk);
    });
  });

  function updateCountDisplay() {
    const newDateHabits = EcoData.getHabitsForDate(appData, dk);
    const newDoneCount = habits.filter(h => newDateHabits.includes(h.id)).length;
    if (countEl) countEl.textContent = `${newDoneCount} / ${habits.length}`;
  }
}

function renderHeatmap(appData) {
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;

  const days = EcoData.getWeeklyHeatmap(appData);
  const maxCount = Math.max(1, ...days.map(d => d.count));

  grid.innerHTML = days.map(d => {
    const cls = d.count > 0 ? 'filled' : '';
    return `<div class="heatmap-cell ${cls}">${d.count || ''}</div>`;
  }).join('');
}

async function addCustomHabit(appData, activeCat) {
  const name = await showPrompt('New Habit', 'What habit do you want to track?');
  if (!name || !name.trim()) return;

  const categories = ['transport', 'food', 'energy', 'shopping', 'waste', 'water'];
  const cat = await showPrompt('Category', `Choose a category: ${categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}`);
  if (!cat || !categories.includes(cat.toLowerCase())) {
    showToast('Please choose a valid category', '');
    return;
  }

  const co2Str = await showPrompt('CO₂ Impact', 'How many kg of CO₂ does this action save?', '0.5');
  const co2 = parseFloat(co2Str) || 0.5;

  EcoData.addCustomHabit(appData, name.trim(), cat.toLowerCase(), co2);
  const fresh = EcoData.load();
  Object.assign(appData, fresh);
  renderHabitList(appData, activeCat, EcoData.getTodayKey());
  showToast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg> Habit added!', 'success');
}

export { initHabits };