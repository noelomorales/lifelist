const form = document.getElementById('sightingForm');
const sightingsList = document.getElementById('sightingsList');
let sightings = JSON.parse(localStorage.getItem('birdSightings')) || [];

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('birdName').value;
  const tier = document.getElementById('tier').value;
  const file = document.getElementById('birdImage').files[0];

  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    const newSighting = { name, tier, image: reader.result };
    sightings.push(newSighting);
    localStorage.setItem('birdSightings', JSON.stringify(sightings));
    renderSightings();
    form.reset();
  };
  reader.readAsDataURL(file);
});

function renderSightings() {
  sightingsList.innerHTML = '';
  sightings.forEach(({ name, tier, image }, index) => {
    const card = document.createElement('div');
    card.className = `bg-white p-4 rounded shadow flex flex-col sm:flex-row gap-4 items-center`;

    card.innerHTML = `
      <img src="${image}" alt="${name}" class="w-24 h-24 object-cover rounded" />
      <div>
        <h2 class="text-lg font-semibold">${name}</h2>
        <p class="text-sm text-gray-600">Tier: ${tier}</p>
      </div>
    `;
    sightingsList.appendChild(card);
  });
}

renderSightings();