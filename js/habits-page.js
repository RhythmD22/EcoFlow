import { EcoData } from './data.js';
import { escapeHTML, showToast, toggleHabitAndRefresh, showPrompt, cssVar } from './utils.js';
import { Icons } from './icons.js';

function updateDatePill(selectedDate, datePill) {
  const parts = selectedDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    datePill.textContent = 'Invalid date';
    return;
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  datePill.textContent = label;
  datePill.setAttribute('aria-label', `Selected date: ${label}`);
}

function renderCalendar(state) {
  document.getElementById('cal-month-year').textContent =
    new Date(state.calYear, state.calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const grid = document.getElementById('calendar-grid');
  const firstDay = new Date(state.calYear, state.calMonth, 1).getDay();
  const daysInMonth = new Date(state.calYear, state.calMonth + 1, 0).getDate();
  const today = EcoData.getTodayKey();
  const monthName = new Date(state.calYear, state.calMonth).toLocaleDateString('en-US', { month: 'long' });

  let html = '';
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${state.calYear}-${String(state.calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const classes = ['calendar-day'];
    if (dateKey === today) classes.push('today');
    if (dateKey === state.selectedDate) classes.push('selected');
    const habitsOnDay = EcoData.getHabitsForDate(state.appData, dateKey);
    if (habitsOnDay.length > 0) classes.push('has-habits');
    const ariaLabel = `${monthName} ${day}, ${state.calYear}${dateKey === state.selectedDate ? ', selected' : ''}${habitsOnDay.length > 0 ? `, ${habitsOnDay.length} habit${habitsOnDay.length !== 1 ? 's' : ''} logged` : ''}`;
    html += `<button class="${classes.join(' ')}" data-date="${dateKey}" aria-label="${ariaLabel}">${day}</button>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.calendar-day:not(.empty)').forEach(dayBtn => {
    dayBtn.addEventListener('click', () => {
      state.selectedDate = dayBtn.dataset.date;
      updateDatePill(state.selectedDate, state.datePill);
      renderCalendar(state);
      document.getElementById('calendar-dropdown').hidden = true;
      state.datePill.setAttribute('aria-expanded', 'false');
      EcoData.refreshData(state.appData);
      renderHabitList(state);
      state.datePill.focus();
    });
  });
}

function updateCountDisplay(habits, appData, dk, countEl) {
  const newDateHabits = EcoData.getHabitsForDate(appData, dk);
  const newDoneCount = habits.filter(h => newDateHabits.includes(h.id)).length;
  if (countEl) countEl.textContent = `${newDoneCount} / ${habits.length}`;
}

function renderHabitList(state) {
  const list = document.getElementById('habits-list');
  const countEl = document.getElementById('today-count');
  if (!list) return;

  const dk = state.selectedDate || EcoData.getTodayKey();

  let habits = state.appData.habits;
  if (state.activeCategory !== 'all') {
    habits = habits.filter(h => h.category === state.activeCategory);
  }

  const dateHabits = EcoData.getHabitsForDate(state.appData, dk);
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
          <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${Icons.checkmark}</svg>
        </button>
        <div class="habit-info">
          <div class="habit-name"><span aria-hidden="true">${h.icon}</span> ${safeName}</div>
          <div class="habit-category">${safeCategory} · ${h.co2PerAction} kg CO₂</div>
        </div>
        <span class="habit-co2">${h.co2PerAction} kg</span>
        ${!isDefault ? `<button class="habit-delete" aria-label="Delete ${safeName}">
          <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>` : ''}
      </div>
    `;
  }).join('');

  list.querySelectorAll('.habit-check').forEach(check => {
    check.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = check.closest('.habit-item');
      const habitId = item.dataset.habitId;
      const added = toggleHabitAndRefresh(state.appData, habitId, dk);

      const nameEl = item.querySelector('.habit-name');
      const name = nameEl ? nameEl.textContent.replace(/^\S+\s/, '') : '';

      if (added) {
        check.classList.add('checked');
        check.setAttribute('aria-checked', 'true');
        check.setAttribute('aria-label', `Undo: ${name}`);
        updateCountDisplay(habits, state.appData, dk, countEl);
      } else {
        check.classList.remove('checked');
        check.setAttribute('aria-checked', 'false');
        check.setAttribute('aria-label', `Complete: ${name}`);
        updateCountDisplay(habits, state.appData, dk, countEl);
      }
    });
  });

  list.querySelectorAll('.habit-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = btn.closest('.habit-item');
      const habitId = item.dataset.habitId;
      EcoData.removeHabit(state.appData, habitId);
      EcoData.refreshData(state.appData);
      renderHabitList(state);
    });
  });
}

function renderHeatmap(appData) {
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;

  const days = EcoData.getWeeklyHeatmap(appData);
  const maxCount = Math.max(1, ...days.map(d => d.count));

  grid.innerHTML = days.map(d => {
    let level = '';
    if (d.count > 0 && maxCount > 0) {
      const pct = d.count / maxCount;
      if (pct <= 0.25) level = 'd1';
      else if (pct <= 0.5) level = 'd2';
      else if (pct <= 0.75) level = 'd3';
      else level = 'd4';
    }
    return `<div class="heatmap-cell ${level}" aria-label="${d.day}: ${d.count || 0} habits completed">${d.count || ''}</div>`;
  }).join('');

  renderTrendChart(appData);
}

function renderTrendChart(appData) {
  const canvas = document.getElementById('chart-habit-trend');
  if (!canvas || typeof Chart === 'undefined') {
    const table = document.getElementById('chart-habit-trend-table');
    if (table) table.innerHTML = '<tr><td>Chart data unavailable</td></tr>';
    return;
  }

  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const trend = EcoData.getTrendData(appData, 30);

  const brand = cssVar('--brand', '#15803d');
  const textSecondary = cssVar('--text-secondary', '#56635b');
  const gridColor = cssVar('--grid-color', 'rgba(0,0,0,0.06)');

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: trend.map(d => d.date),
      datasets: [{
        label: 'Habits completed',
        data: trend.map(d => d.count),
        borderColor: brand,
        backgroundColor: brand.replace(')', ',0.08)').replace('rgb', 'rgba'),
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: brand,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: {
            color: textSecondary,
            font: { size: 10 },
            maxTicksLimit: 6,
            maxRotation: 0,
          },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: textSecondary,
            font: { size: 11 },
            stepSize: 1,
          },
          grid: { color: gridColor },
          beginAtZero: true,
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    },
  });

  const table = document.getElementById('chart-habit-trend-table');
  if (table) {
    table.innerHTML = `<tr><th scope="col">Date</th><th scope="col">Habits completed</th></tr>
      ${trend.map(d => `<tr><td>${d.date}</td><td>${d.count}</td></tr>`).join('')}`;
  }
}

async function addCustomHabit(appData, activeCategory) {
  const name = await showPrompt('New Habit', 'What habit do you want to track?');
  if (!name || !name.trim()) return;

  const categories = ['transport', 'food', 'energy', 'shopping', 'waste', 'water'];
  const cat = await showPrompt('Category', 'Transport, Food, Energy, Shopping, Waste, or Water?');
  if (!cat || !categories.includes(cat.toLowerCase())) {
    showToast('Please choose a valid category', '');
    return;
  }

  const co2Str = await showPrompt('CO₂ Impact', 'How many kg of CO₂ does this action save?');
  const co2Num = parseFloat(co2Str);
  const co2 = isNaN(co2Num) ? 0.5 : co2Num;

  EcoData.addCustomHabit(appData, name.trim(), cat.toLowerCase(), co2);
  EcoData.refreshData(appData);
  renderHabitList({ appData, activeCategory, selectedDate: EcoData.getTodayKey() });
  showToast(`${Icons.tree} Habit added!`, 'success');
}

function initHabits() {
  const state = {
    appData: EcoData.load(),
    selectedDate: EcoData.getTodayKey(),
    activeCategory: 'all',
    calMonth: new Date().getMonth(),
    calYear: new Date().getFullYear(),
    datePill: document.getElementById('today-date'),
  };

  updateDatePill(state.selectedDate, state.datePill);
  renderHabitList(state);
  renderHeatmap(state.appData);

  state.datePill.addEventListener('click', () => {
    const dropdown = document.getElementById('calendar-dropdown');
    const isHidden = dropdown.hidden;
    dropdown.hidden = !isHidden;
    state.datePill.setAttribute('aria-expanded', String(!isHidden));
    if (!isHidden) return;
    state.calMonth = parseInt(state.selectedDate.split('-')[1]) - 1;
    state.calYear = parseInt(state.selectedDate.split('-')[0]);
    renderCalendar(state);
    setTimeout(() => {
      const firstDay = calendarDropdown.querySelector('.calendar-day:not(.empty)');
      if (firstDay) firstDay.focus();
    }, 50);
  });

  const calendarDropdown = document.getElementById('calendar-dropdown');
  calendarDropdown.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      calendarDropdown.hidden = true;
      state.datePill.setAttribute('aria-expanded', 'false');
      state.datePill.focus();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = calendarDropdown.querySelectorAll('button:not([disabled]), input:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  const calPrev = document.getElementById('cal-prev');
  const calNext = document.getElementById('cal-next');
  const calToday = document.getElementById('cal-today');
  if (calPrev) calPrev.addEventListener('click', () => {
    state.calMonth--;
    if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
    renderCalendar(state);
  });

  if (calNext) calNext.addEventListener('click', () => {
    state.calMonth++;
    if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
    renderCalendar(state);
  });

  if (calToday) calToday.addEventListener('click', () => {
    state.selectedDate = EcoData.getTodayKey();
    state.calMonth = new Date().getMonth();
    state.calYear = new Date().getFullYear();
    updateDatePill(state.selectedDate, state.datePill);
    renderCalendar(state);
    document.getElementById('calendar-dropdown').hidden = true;
    state.datePill.setAttribute('aria-expanded', 'false');
    EcoData.refreshData(state.appData);
    renderHabitList(state);
  });

  const root = document.getElementById('app-root');

  const catTabs = root.querySelectorAll('.cat-tab');
  const habitsList = document.getElementById('habits-list');
  const activeTab = root.querySelector('.cat-tab[data-cat="' + state.activeCategory + '"]');
  if (activeTab && activeTab.id && habitsList) {
    habitsList.setAttribute('aria-labelledby', activeTab.id);
  }

  catTabs.forEach((tab, idx) => {
    const isActive = tab.dataset.cat === state.activeCategory;
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.tabIndex = isActive ? 0 : -1;
    tab.addEventListener('click', () => {
      catTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.tabIndex = -1;
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.tabIndex = 0;
      state.activeCategory = tab.dataset.cat;
      if (habitsList && tab.id) {
        habitsList.setAttribute('aria-labelledby', tab.id);
      }
      renderHabitList(state);
    });
    tab.addEventListener('keydown', (e) => {
      let targetIdx = idx;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        targetIdx = (idx + 1) % catTabs.length;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        targetIdx = (idx - 1 + catTabs.length) % catTabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        targetIdx = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        targetIdx = catTabs.length - 1;
      }
      if (targetIdx !== idx) {
        catTabs[targetIdx].focus();
        catTabs[targetIdx].click();
      }
    });
  });

  const addBtn = document.getElementById('btn-add-habit');
  if (addBtn) {
    addBtn.addEventListener('click', () => addCustomHabit(state.appData, state.activeCategory));
  }
}

export { initHabits };