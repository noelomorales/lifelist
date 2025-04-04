const modeToggle = document.getElementById('modeToggle');
const root = document.documentElement;

const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  root.classList.add('dark');
} else {
  root.classList.remove('dark');
}

modeToggle.addEventListener('click', () => {
  const nowDark = root.classList.toggle('dark');
  localStorage.setItem('theme', nowDark ? 'dark' : 'light');
});

const form = document.getElementById('sightingForm');
const sightingsList = document.getElementById('sightingsList');
const searchInput = document.getElementById('searchInput');
const autocompleteResults = document.getElementById('autocompleteResults');
const filterTier = document.getElementById('filterTier');

const birdName = document.getElementById('birdName');
const sciName = document.getElementById('sciName');
const family = document.getElementById('family');
const order = document.getElementById('order');
const birdImageInput = document.getElementById('birdImage');

let sightings = JSON.parse(localStorage.getItem('birdSightings')) || [];

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = birdName.value;
  const tier = document.getElementById('tier').value;
  const file = birdImageInput.files[0];
  const now = new Date().toISOString().slice(0, 16);

  const saveSighting = (imageData = null) => {
    const newSighting = {
      name,
      sciName: sciName.value,
      family: family.value,
      order: order.value,
      tier,
      image: imageData,
      date: now
    };
    sightings.push(newSighting);
    localStorage.setItem('birdSightings', JSON.stringify(sightings));
    renderSightings();
    form.reset();
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => saveSighting(reader.result);
    reader.readAsDataURL(file);
  } else {
    saveSighting(null);
  }
});

searchInput.addEventListener('input', async () => {
  const q = searchInput.value.trim();
  if (q.length < 2) {
    autocompleteResults.classList.add('hidden');
    autocompleteResults.innerHTML = '';
    return;
  }

  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  autocompleteResults.innerHTML = '';

  data.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} (${item.sciName})`;
    li.className = 'p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer';
    li.addEventListener('click', () => {
      birdName.value = item.name;
      sciName.value = item.sciName;
      family.value = item.family;
      order.value = item.order;
      autocompleteResults.classList.add('hidden');
      autocompleteResults.innerHTML = '';
    });
    autocompleteResults.appendChild(li);
  });

  autocompleteResults.classList.toggle('hidden', data.length === 0);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const first = autocompleteResults.querySelector('li');
    if (first) first.click();
  }
});

filterTier.addEventListener('change', renderSightings);

function renderSightings() {
  const tierFilter = filterTier.value;
  sightingsList.innerHTML = '';

  sightings
    .filter(({ tier }) => tierFilter === 'all' || tier === tierFilter)
    .forEach((sighting, index) => {
      const { name, sciName, family, order, tier, image, date } = sighting;
      const card = document.createElement('div');
      card.className = 'winamp-card p-4 rounded shadow flex flex-col sm:flex-row gap-4 items-start';

      card.innerHTML = `
        ${image ? `<img src="${image}" alt="${name}" class="w-24 h-24 object-cover rounded" />` : ''}
        <div class="flex-1 text-xs">
          <h2 class="text-md text-yellow-300">${name}</h2>
          <p class="italic">${sciName}</p>
          <p>Family: ${family}</p>
          <p>Order: ${order}</p>
          <p>Tier: ${tier}</p>
          <label class="block mt-2">
            Date/Time:
            <input type="datetime-local" value="${date || ''}"
              class="border px-2 py-1 mt-1 w-full dark:bg-gray-700 dark:text-white text-xs"
              onchange="updateDate(${index}, this.value)" />
          </label>
          <button onclick="deleteSighting(${index})" class="mt-2 text-red-400 text-xs underline">Delete</button>
        </div>
      `;
      sightingsList.appendChild(card);
    });
}

window.updateDate = function(index, newDate) {
  sightings[index].date = newDate;
  localStorage.setItem('birdSightings', JSON.stringify(sightings));
  renderSightings();
};

window.deleteSighting = function(index) {
  sightings.splice(index, 1);
  localStorage.setItem('birdSightings', JSON.stringify(sightings));
  renderSightings();
};

renderSightings();
