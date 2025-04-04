const form = document.getElementById('sightingForm');
const sightingsList = document.getElementById('sightingsList');
const searchInput = document.getElementById('searchInput');
const autocompleteResults = document.getElementById('autocompleteResults');
const filterTier = document.getElementById('filterTier');

const birdName = document.getElementById('birdName');
const sciName = document.getElementById('sciName');
const family = document.getElementById('family');
const order = document.getElementById('order');

let sightings = JSON.parse(localStorage.getItem('birdSightings')) || [];

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = birdName.value;
  const tier = document.getElementById('tier').value;
  const file = document.getElementById('birdImage').files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const newSighting = {
      name,
      sciName: sciName.value,
      family: family.value,
      order: order.value,
      tier,
      image: reader.result,
      date: new Date().toISOString()
    };
    sightings.push(newSighting);
    localStorage.setItem('birdSightings', JSON.stringify(sightings));
    renderSightings();
    form.reset();
  };
  reader.readAsDataURL(file);
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
      card.className = 'bg-white dark:bg-gray-800 p-4 rounded shadow flex flex-col sm:flex-row gap-4 items-start';

      const formattedDate = new Date(date).toLocaleString();

      card.innerHTML = `
        <img src="${image}" alt="${name}" class="w-24 h-24 object-cover rounded" />
        <div class="flex-1">
          <h2 class="text-lg font-semibold">${name}</h2>
          <p class="text-sm italic">${sciName}</p>
          <p class="text-sm">Family: ${family}</p>
          <p class="text-sm">Order: ${order}</p>
          <p class="text-sm">Tier: ${tier}</p>
          <label class="text-sm block mt-2">
            Date/Time:
            <input type="datetime-local" value="${new Date(date).toISOString().slice(0,16)}"
              class="border px-2 py-1 mt-1 text-sm w-full dark:bg-gray-700 dark:text-white"
              onchange="updateDate(${index}, this.value)" />
          </label>
          <button onclick="deleteSighting(${index})" class="mt-2 text-red-600 dark:text-red-400 text-sm underline">Delete</button>
        </div>
      `;
      sightingsList.appendChild(card);
    });
}

window.updateDate = function(index, newDate) {
  sightings[index].date = new Date(newDate).toISOString();
  localStorage.setItem('birdSightings', JSON.stringify(sightings));
  renderSightings();
};

window.deleteSighting = function(index) {
  sightings.splice(index, 1);
  localStorage.setItem('birdSightings', JSON.stringify(sightings));
  renderSightings();
};

renderSightings();
