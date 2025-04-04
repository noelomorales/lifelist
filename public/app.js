const lifelistSelect = document.getElementById('lifelistSelect');
const form = document.getElementById('sightingForm');
const sightingsList = document.getElementById('sightingsList');
const filterTier = document.getElementById('filterTier');
const modeToggle = document.getElementById('modeToggle');

const birdName = document.getElementById('birdName');
const sciName = document.getElementById('sciName');
const family = document.getElementById('family');
const order = document.getElementById('order');
const birdImageInput = document.getElementById('birdImage');
const notesField = document.getElementById('notes');

let allData = JSON.parse(localStorage.getItem('lifelistData')) || {};
let currentList = lifelistSelect.value;
if (!allData[currentList]) allData[currentList] = [];

function saveData() {
  localStorage.setItem('lifelistData', JSON.stringify(allData));
}

function getSightings() {
  return allData[currentList] || [];
}

function renderSightings() {
  sightingsList.innerHTML = '';
  const sightings = getSightings();
  const tierFilter = filterTier.value;

  sightings
    .filter(s => tierFilter === 'all' || s.tier === tierFilter)
    .forEach((entry, index) => {
      const div = document.createElement('div');
      div.className = 'card text-sm';
      div.innerHTML = `
        <strong>${entry.name}</strong><br/>
        <em>${entry.sciName}</em><br/>
        Family: ${entry.family}<br/>
        Order: ${entry.order}<br/>
        Tier: ${entry.tier}<br/>
        Date: ${entry.date}<br/>
        ${entry.notes ? `<div>📝 ${entry.notes}</div>` : ''}
        <button onclick="deleteSighting(${index})" class="button mt-2">Delete</button>
      `;
      sightingsList.appendChild(div);
    });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const file = birdImageInput.files[0];
  const now = new Date();
  const formatted = now.toLocaleString();

  const newSighting = {
    name: birdName.value,
    sciName: sciName.value,
    family: family.value,
    order: order.value,
    tier: document.getElementById('tier').value,
    notes: notesField.value,
    date: formatted,
    image: null
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      newSighting.image = reader.result;
      allData[currentList].push(newSighting);
      saveData();
      renderSightings();
      form.reset();
    };
    reader.readAsDataURL(file);
  } else {
    allData[currentList].push(newSighting);
    saveData();
    renderSightings();
    form.reset();
  }
});

window.deleteSighting = function(index) {
  allData[currentList].splice(index, 1);
  saveData();
  renderSightings();
};

lifelistSelect.addEventListener('change', () => {
  currentList = lifelistSelect.value;
  if (!allData[currentList]) allData[currentList] = [];
  renderSightings();
});

filterTier.addEventListener('change', renderSightings);

modeToggle.addEventListener('click', () => {
  const isLight = document.body.classList.contains('solarized-light');
  document.body.classList.toggle('solarized-light', !isLight);
  document.body.classList.toggle('solarized-dark', isLight);
  localStorage.setItem('theme', isLight ? 'dark' : 'light');
});

function applyInitialTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.body.classList.add(theme === 'light' ? 'solarized-light' : 'solarized-dark');
}

applyInitialTheme();
renderSightings();
