import { EcoData } from './data.js';
import { escapeHTML, showToast, toggleHabitAndRefresh, spawnConfetti } from './utils.js';
import { Icons } from './icons.js';
import { TREE_THRESHOLDS, TREE_CROWN_THRESHOLD, STREAK_WEEK_DAYS } from './constants.js';

function initHome() {
  const appData = EcoData.load();

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

  const visibleCount = TREE_THRESHOLDS.filter(t => total >= t).length;

  branchIds.forEach((id, i) => {
    const branch = document.getElementById(id);
    if (!branch) return;
    branch.classList.toggle('show', total >= TREE_THRESHOLDS[i]);
  });

  const crown = document.getElementById('crown');
  const crownVisible = total >= TREE_CROWN_THRESHOLD;
  if (crown) {
    crown.classList.toggle('show', crownVisible);
  }

  const totalActions = document.getElementById('total-habits');
  const co2Saved = document.getElementById('co2-saved');
  const treeLabel = document.getElementById('tree-label');

  if (totalActions) totalActions.textContent = total;
  if (co2Saved) co2Saved.textContent = appData.totalCO2.toFixed(1);

  let label;
  if (crownVisible) {
    label = 'In full bloom';
  } else if (visibleCount >= 8) {
    label = 'Full canopy';
  } else if (visibleCount >= 7) {
    label = 'Seven branches strong';
  } else if (visibleCount >= 6) {
    label = 'Getting dense';
  } else if (visibleCount >= 5) {
    label = 'Branching further out';
  } else if (visibleCount >= 4) {
    label = 'Halfway there';
  } else if (visibleCount >= 2) {
    label = 'Branches are sprouting';
  } else if (visibleCount >= 1) {
    label = 'Your first branch';
  } else {
    label = 'Log a habit to start growing';
  }
  if (treeLabel) treeLabel.textContent = label;
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
      newBtn.innerHTML = `<span>Completed!</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${Icons.checkmark}</svg>`;
    } else {
      newBtn.addEventListener('click', () => {
        const success = EcoData.completeChallenge(appData);
        if (success) {
          EcoData.refreshData(appData);
          newBtn.classList.add('done');
          newBtn.setAttribute('aria-disabled', 'true');
          newBtn.innerHTML = `<span>Completed!</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${Icons.checkmark}</svg>`;
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
  }
  if (streakBar) {
    streakBar.style.width = `${Math.min(100, (appData.streaks.current / STREAK_WEEK_DAYS) * 100)}%`;
  }
  if (streakMsg) {
    if (appData.streaks.current >= STREAK_WEEK_DAYS) {
      streakMsg.innerHTML = `A full week. Longest streak: ${appData.streaks.longest} days`;
    } else if (appData.streaks.current > 0) {
      streakMsg.textContent = `${STREAK_WEEK_DAYS - appData.streaks.current} more days for a perfect week`;
    } else {
      streakMsg.textContent = 'Log a habit to start your streak!';
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

  const allHabits = appData.habits.filter(h => !counts[h.id]);
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
      const added = toggleHabitAndRefresh(appData, habitId);

      if (added) {
        btn.classList.add('logged');
        btn.setAttribute('aria-pressed', 'true');
        if (appData.streaks.current >= STREAK_WEEK_DAYS && appData.streaks.current % STREAK_WEEK_DAYS === 0) {
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