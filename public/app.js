// ==== Theme ====
function applyTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.className = `solarized-${theme}`;
}
applyTheme();
document.getElementById('modeToggle').onclick = () => {
  const current = document.documentElement.className.includes('light') ? 'dark' : 'light';
  localStorage.setItem('theme', current);
  applyTheme();
};

// ==== App State ====
let lifelistTypes = JSON.parse(localStorage.getItem('lifelistTypes')) || {
  birds: { name: 'Birds', fields: ['sciName', 'family', 'tier', 'notes', 'images', 'location'] }
};
let lifelistData = JSON.parse(localStorage.getItem('lifelistData')) || {};
let currentType = 'birds';

const lifelistSelect = document.getElementById('lifelistSelect');
const entryForm = document.getElementById('entryForm');
const entryList = document.getElementById('entryList');
const searchInput = document.getElementById('searchInput');
const importInput = document.getElementById('importInput');

// === Helpers ===
function saveAll() {
  localStorage.setItem('lifelistTypes', JSON.stringify(lifelistTypes));
  localStorage.setItem('lifelistData', JSON.stringify(lifelistData));
}
function populateLifelistSelect() {
  lifelistSelect.innerHTML = '';
  for (const key in lifelistTypes) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = lifelistTypes[key].name;
    lifelistSelect.appendChild(opt);
  }
}
populateLifelistSelect();
lifelistSelect.onchange = () => {
  currentType = lifelistSelect.value;
  renderForm();
  renderList();
  updateMap();
};
function renderForm() {
  const fields = lifelistTypes[currentType].fields;
  entryForm.innerHTML = '';

  const name = document.createElement('input');
  name.id = 'entry-name';
  name.placeholder = 'Name';
  name.className = 'input mb-2';
  entryForm.appendChild(name);

  fields.forEach(f => {
    let el;
    if (f === 'notes') el = document.createElement('textarea');
    else if (f === 'images') {
      el = document.createElement('input');
      el.type = 'file';
      el.multiple = true;
      el.accept = 'image/*';
    } else {
      el = document.createElement('input');
    }
    el.id = `entry-${f}`;
    el.placeholder = f;
    el.className = 'input mb-2';
    entryForm.appendChild(el);
  });

  const row = document.createElement('div');
  row.className = 'flex gap-2';

  const save = document.createElement('button');
  save.textContent = 'Save Entry';
  save.className = 'button w-full';
  save.type = 'submit';

  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  cancel.className = 'button w-full';
  cancel.type = 'button';
  cancel.onclick = () => entryForm.reset();

  row.appendChild(save);
  row.appendChild(cancel);
  entryForm.appendChild(row);
}

entryForm.onsubmit = async e => {
  e.preventDefault();
  const name = document.getElementById('entry-name').value.trim();
  if (!name) return;

  const list = lifelistData[currentType] || [];
  let existing = list.find(e => e.name === name);
  const entry = existing || { name, date: new Date().toLocaleString(), images: [] };
  const fields = lifelistTypes[currentType].fields;

  for (const f of fields) {
    const el = document.getElementById(`entry-${f}`);
    if (f === 'images' && el?.files?.length) {
      for (const file of el.files) {
        const reader = new FileReader();
        await new Promise(resolve => {
          reader.onload = () => {
            entry.images.push({ data: reader.result, primary: entry.images.length === 0 });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    } else {
      entry[f] = el?.value || '';
    }
  }

  if (!existing) lifelistData[currentType].push(entry);
  saveAll();
  entryForm.reset();
  renderList();
  updateMap();
};

function renderList() {
  const query = searchInput.value.toLowerCase();
  entryList.innerHTML = '';
  const list = lifelistData[currentType] || [];

  list.filter(e => Object.values(e).join(' ').toLowerCase().includes(query)).forEach((entry, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<strong>${entry.name}</strong><br/>`;

    lifelistTypes[currentType].fields.forEach(f => {
      if (f === 'images') {
        const gallery = document.createElement('div');
        gallery.className = 'gallery mt-2';
        (entry.images || []).forEach((img, i) => {
          const image = document.createElement('img');
          image.src = img.data;
          image.className = img.primary ? 'primary' : '';
          image.onclick = () => {
            entry.images.forEach(p => (p.primary = false));
            img.primary = true;
            saveAll();
            renderList();
          };
          gallery.appendChild(image);
        });
        card.appendChild(gallery);
      } else {
        card.innerHTML += `${f}: ${entry[f] || ''}<br/>`;
      }
    });

    card.innerHTML += `<em>${entry.date}</em><br/>`;
    card.innerHTML += `
      <button class="button mt-2" onclick="editEntry(${index})">✏️ Edit</button>
      <button class="button mt-2" onclick="deleteEntry(${index})">🗑 Delete</button>`;
    entryList.appendChild(card);
  });
}

window.deleteEntry = i => {
  lifelistData[currentType].splice(i, 1);
  saveAll();
  renderList();
  updateMap();
};

window.editEntry = i => {
  const entry = lifelistData[currentType][i];
  document.getElementById('entry-name').value = entry.name;
  lifelistTypes[currentType].fields.forEach(f => {
    const el = document.getElementById(`entry-${f}`);
    if (el && f !== 'images') el.value = entry[f] || '';
  });
};

let map, markerGroup;
function initMap() {
  if (map) return;
  map = L.map('map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  markerGroup = L.layerGroup().addTo(map);
}
initMap();

function updateMap(showAll = false) {
  if (!map) return;
  markerGroup.clearLayers();
  const keys = showAll ? Object.keys(lifelistData) : [currentType];
  const all = keys.flatMap(k => (lifelistData[k] || []).map(e => ({ ...e, _from: k })));
  all.forEach(e => {
    const [lat, lng] = (e.location || '').split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) return;
    const marker = L.marker([lat, lng]).bindPopup(`<b>${e.name}</b><br/>${e._from}`);
    markerGroup.addLayer(marker);
  });
}
document.getElementById('toggleMapBtn').onclick = () => {
  const container = document.getElementById('mapContainer');
  container.classList.toggle('visible');
  container.style.display = container.classList.contains('visible') ? 'block' : 'none';
  setTimeout(() => map.invalidateSize(), 100);
  updateMap(document.getElementById('mapScopeToggle')?.checked);
};
document.getElementById('mapScopeToggle').onchange = e => updateMap(e.target.checked);

// === EXIF
entryForm.addEventListener('change', async e => {
  if (e.target.id.includes('images') && e.target.files[0]) {
    const coords = await exifr.gps(e.target.files[0]).catch(() => null);
    if (coords?.latitude && coords?.longitude) {
      const loc = document.getElementById('entry-location');
      if (loc && !loc.value) loc.value = `${coords.latitude},${coords.longitude}`;
    }
  }
});

document.getElementById('exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify({ lifelistTypes, lifelistData }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lifelists.json';
  a.click();
};

document.getElementById('importBtn').onclick = () => importInput.click();
importInput.onchange = e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    lifelistTypes = data.lifelistTypes || {};
    lifelistData = data.lifelistData || {};
    saveAll();
    populateLifelistSelect();
    currentType = lifelistSelect.value;
    renderForm();
    renderList();
    updateMap();
  };
  reader.readAsText(file);
};

// === Create List Type Modal
const modal = document.getElementById('typeModal');
document.getElementById('newTypeBtn').onclick = () => {
  modal.classList.remove('hidden');
  document.getElementById('newTypeName').value = '';
  document.getElementById('fieldsContainer').innerHTML = '';
};
document.getElementById('cancelTypeBtn').onclick = () => {
  modal.classList.add('hidden');
  document.getElementById('newTypeName').value = '';
  document.getElementById('fieldsContainer').innerHTML = '';
};
document.getElementById('addFieldBtn').onclick = () => {
  const input = document.createElement('input');
  input.placeholder = 'field name (e.g. order)';
  input.className = 'input';
  document.getElementById('fieldsContainer').appendChild(input);
};
document.getElementById('saveTypeBtn').onclick = () => {
  const name = document.getElementById('newTypeName').value;
  const fields = Array.from(document.querySelectorAll('#fieldsContainer input')).map(i => i.value).filter(Boolean);
  const key = name.toLowerCase().replace(/\s+/g, '_');
  lifelistTypes[key] = { name, fields };
  lifelistData[key] = [];
  saveAll();
  populateLifelistSelect();
  modal.classList.add('hidden');
  lifelistSelect.value = key;
  currentType = key;
  renderForm();
  renderList();
  updateMap();
};
