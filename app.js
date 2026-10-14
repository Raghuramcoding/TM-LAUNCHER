const games = JSON.parse(localStorage.getItem('tmlauncher-games-v2') || 'null') || [];
let activities = [];
const grid = document.querySelector('#game-grid');
const modpacksPanel = document.querySelector('#modpacks-panel');
const activityList = document.querySelector('#activity-list');
const toast = document.querySelector('#toast');
const modal = document.querySelector('#game-modal');
const addGameButton = document.querySelector('#add-game');

function renderGames() {
  const visible = games;
  grid.innerHTML = visible.length ? visible.map(game => `
    <article class="game-card">
      <div class="game-cover ${game.cover}"><span class="cover-tag">${game.tag}</span><div class="cover-title">${game.edition}<small>TM</small></div></div>
      <div class="card-meta"><div class="game-name">${game.name}</div><div class="version">${game.version}</div></div>
      <div class="card-footer"><span class="install-state">● ${game.status}</span><button class="launch-btn" data-launch="${game.id}">Launch ↗</button></div>
    </article>`).join('') : '<div class="empty-state">Your library is empty. Add a game to begin.</div>';
  document.querySelector('#game-total').textContent = games.length;
  document.querySelector('#library-count').textContent = games.length;
}
function renderActivity() {
  activityList.innerHTML = activities.length ? activities.map(item => `<div class="activity-item"><div class="activity-art ${item.orange ? 'orange-art' : ''}">${item.art}</div><div class="activity-copy"><strong>${item.game}</strong><span>${item.action} · ${item.time}</span></div></div>`).join('') : '<div class="empty-state">Your launch history will appear here.</div>';
}
function showToast(message) { toast.textContent = message; toast.classList.add('show'); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600); }
function saveGames() { localStorage.setItem('tmlauncher-games-v2', JSON.stringify(games)); }

document.addEventListener('click', event => {
  const launch = event.target.closest('[data-launch]');
  const nav = event.target.closest('[data-view]');
  if (launch) {
    const game = games.find(item => item.id === launch.dataset.launch);
    const launchResult = window.desktopAPI && game.path ? window.desktopAPI.launchGame(game.path) : Promise.resolve({ ok: true });
    launchResult.then(result => {
      if (!result.ok) return showToast(result.message);
      activities.unshift({ game: `${game.name} ${game.edition}`, action: 'Launched', time: 'Just now', art: 'TM' });
      activities = activities.slice(0, 3); renderActivity(); showToast(`Launching ${game.name} ${game.edition}...`);
    });
  }
  if (nav) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item === nav));
    const isModpacks = nav.dataset.view === 'modpacks';
    document.querySelector('#view-title').textContent = isModpacks ? 'Modpacks' : 'All games';
    grid.hidden = isModpacks;
    modpacksPanel.hidden = !isModpacks;
    addGameButton.hidden = isModpacks;
  }
});
document.querySelector('#add-game').addEventListener('click', () => { modal.hidden = false; modal.querySelector('input').focus(); });
document.querySelector('#close-modal').addEventListener('click', () => { modal.hidden = true; });
document.querySelector('#game-form').addEventListener('submit', event => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const name = formData.get('name').trim();
  const path = formData.get('path').trim();
  games.push({ id: `custom-${Date.now()}`, name, edition: 'Custom', version: 'Local build', cover: 'cover-green', tag: 'Custom', status: 'Path set', path });
  saveGames();
  renderGames(); modal.hidden = true; event.currentTarget.reset(); showToast(`${name} added to your library`);
});
document.querySelector('#browse-executable').addEventListener('click', async () => {
  if (!window.desktopAPI) return showToast('Browse is available in the desktop app');
  const selectedPath = await window.desktopAPI.chooseExecutable();
  if (selectedPath) document.querySelector('[name="path"]').value = selectedPath;
});
renderGames(); renderActivity();
