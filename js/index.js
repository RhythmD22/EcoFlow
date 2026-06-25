import { EcoData } from './data.js';
import { escapeHTML, showToast, spawnConfetti } from './utils.js';

function initHome(appData) {
  const greeting = document.getElementById('greeting-text');
  const hour = new Date().getHours();
  if (hour < 12) greeting.textContent = 'Good morning';
  else if (hour < 17) greeting.textContent = 'Good afternoon';
  else greeting.textContent = 'Good evening';

  updateStreakDisplay(appData);
  updateTree(appData);
  initChallenge(appData);
  initQuickHabits(appData);
}

function updateTree(appData) {
  const total = appData.totalActions;
  const branchIds = ['branch-1', 'branch-2', 'branch-3', 'branch-4', 'branch-5', 'branch-6', 'branch-7', 'branch-8'];
  const thresholds = [1, 2, 4, 7, 11, 18, 30, 50];

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

function initChallenge(appData) {
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
          const fresh = EcoData.load();
          Object.assign(appData, fresh);
          newBtn.classList.add('done');
          newBtn.setAttribute('aria-disabled', 'true');
          newBtn.innerHTML = '<span>Completed!</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
          showToast(`+${challenge.co2Bonus.toFixed(2)} kg CO₂ saved!`, 'success');
          spawnConfetti();
          updateTree(appData);
          updateStreakDisplay(appData);
        }
      });
    }
  }
}

function updateStreakDisplay(appData) {
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

function initQuickHabits(appData) {
  const grid = document.getElementById('quick-habits');
  if (!grid) return;

  const counts = {};
  for (const habitIds of Object.values(appData.completedDates)) {
    for (const hId of habitIds) {
      counts[hId] = (counts[hId] || 0) + 1;
    }
  }

  const allHabits = appData.habits.filter(h => !counts[h.id] || counts[h.id] === 0);
  const usedHabits = appData.habits.filter(h => counts[h.id]);

  usedHabits.sort((a, b) => counts[b.id] - counts[a.id]);
  const topHabits = [...usedHabits.slice(0, 4), ...allHabits].slice(0, 4);

  grid.innerHTML = topHabits.map(h => `
    <button class="quick-habit glass glass-card" data-habit="${h.id}">
      <span class="quick-habit-icon">${h.icon}</span>
      <span class="quick-habit-label">${escapeHTML(h.name)}</span>
    </button>
  `).join('');

  grid.querySelectorAll('.quick-habit').forEach(btn => {
    const habitId = btn.dataset.habit;
    if (!habitId) return;

    const isDone = EcoData.isHabitDone(appData, habitId);
    if (isDone) {
      btn.classList.add('logged');
    }
    btn.setAttribute('aria-pressed', String(isDone));

    btn.addEventListener('click', () => {
      const added = EcoData.toggleHabit(appData, habitId);
      const fresh = EcoData.load();
      Object.assign(appData, fresh);

      if (added) {
        btn.classList.add('logged');
        btn.setAttribute('aria-pressed', 'true');
        showToast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg> Habit logged!', 'success');
        if (appData.streaks.current >= 7 && appData.streaks.current % 7 === 0) {
          spawnConfetti();
        }
        updateTree(appData);
        updateStreakDisplay(appData);
      } else {
        btn.classList.remove('logged');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  });
}

export { initHome };