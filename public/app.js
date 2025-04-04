let lifelistTypes = JSON.parse(localStorage.getItem('lifelistTypes')) || {
  birds: {
    name: 'Birds',
    fields: ['sciName', 'family', 'order', 'tier', 'notes', 'images', 'location']
  },
  rocks: {
    name: 'Rocks',
    fields: ['composition', 'hardness', 'tier', 'notes', 'images', 'location']
  }
};

let lifelistData = JSON.parse(localStorage.getItem('lifelistData')) || {};
let currentType = 'birds';

const modeToggle = document.getElementById('modeToggle');
const lifelistSelect = document.getElementById('lifelistSelect');
const searchInput = document.getElementById('searchInput');
const entryForm = document.getElementById('entryForm');
const entryList = document.getElementById('entryList');
const importInput = document.getElementById('importInput');

function applyTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.className = `solarized-${theme}`;
}
applyTheme();

modeToggle.onclick = () => {
  const now = document.documentElement.className.includes('light') ? 'dark' : 'light';
  localStorage.setItem('theme', now);
  applyTheme();
};

function saveAll() {
  localStorage.setItem('lifelistTypes', JSON.stringify(lifelistTypes));
  localStorage.setItem('lifelistData', JSON.stringify(lifelistData));
}

function populateLifelistSelect() {
  lifelistSelect.innerHTML = '';
  for (let key in lifelistTypes) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = lifelistTypes[key].name;
    lifelistSelect.appendChild(opt);
  }
}
populateLifelistSelect();

lifelistSelect.onchange = () => {
  currentType = lifelistSelect.value;
  if (!lifelistData[currentType]) lifelistData[currentType] = [];
  renderForm();
  renderList();
};

function renderForm() {
  const fields = lifelistTypes[currentType].fields;
  entryForm.innerHTML = '';

  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Name';
  nameInput.className = 'input mb-2';
  nameInput.id = 'entry-name';
  entryForm.appendChild(nameInput);

  fields.forEach(f => {
    if (f === 'notes') {
      const textarea = document.createElement('textarea');
      textarea.placeholder = f;
      textarea.className = 'input mb-2';
      textarea.id = `entry-${f}`;
      entryForm.appendChild(textarea);
    } else if (f === 'images') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.multiple = true;
      fileInput.className = 'input mb-2';
      fileInput.id = `entry-${f}`;
      entryForm.appendChild(fileInput);
    } else {
      const input = document.createElement('input');
      input.placeholder = f;
      input.className = 'input mb-2';
      input.id = `entry-${f}`;
      entryForm.appendChild(input);
    }
  });

  const submit = document.createElement('button');
  submit.textContent = 'Save Entry';
  submit.className = 'button w-full';
  submit.type = 'submit';
  entryForm.appendChild(submit);
}

entryForm.onsubmit = async e => {
  e.preventDefault();
  const name = document.getElementById('entry-name').value.trim();
  if (!name) return;

  let list = lifelistData[currentType] || [];
  let existing = list.find(e => e.name === name);
  let editing = !!existing;
  const entry = editing ? existing : { name, date: new Date().toLocaleString() };

  const fields = lifelistTypes[currentType].fields;
  const files = [];

  for (let f of fields) {
    const el = document.getElementById(`entry-${f}`);
    if (f === 'images') {
      const selected = Array.from(el?.files || []);
      for (const file of selected) {
        const reader = new FileReader();
        files.push(new Promise(resolve => {
          reader.onload = () => {
            entry.images = entry.images || [];
            entry.images.push({ data: reader.result, primary: entry.images.length === 0 });
            resolve();
          };
          reader.readAsDataURL(file);
        }));
      }
    } else {
      entry[f] = el?.value || '';
    }
  }

  await Promise.all(files);

  if (!editing) {
    list.push(entry);
    lifelistData[currentType] = list;
  }

  saveAll();
  entryForm.reset();
  renderList();
  updateMap(document.getElementById('mapScopeToggle')?.checked);
};

function renderList() {
  const query = searchInput.value.toLowerCase();
  entryList.innerHTML = '';
  const list = (lifelistData[currentType] || []).filter(e =>
    Object.values(e).join(' ').toLowerCase().includes(query)
  );

  list.forEach((entry, index) => {
    const card = document.createElement('div');
    card.className = 'card text-sm';
    card.innerHTML = `<strong>${entry.name}</strong><br/>`;

    lifelistTypes[currentType].fields.forEach(f => {
      if (f === 'images' && Array.isArray(entry.images)) {
        const gallery = document.createElement('div');
        gallery.className = 'gallery mt-2';
        entry.images.forEach((img, i) => {
          const image = document.createElement('img');
          image.src = img.data;
          image.className = img.primary ? 'primary' : '';
          image.title = img.primary ? 'Primary Image' : 'Click to set as primary';
          image.onclick = () => {
            entry.images.forEach(p => p.primary = false);
            entry.images[i].primary = true;
            saveAll();
            renderList();
          };
          gallery.appendChild(image);
        });
        card.appendChild(gallery);
      } else if (f !== 'images') {
        card.innerHTML += `${f}: ${entry[f] || ''}<br/>`;
      }
    });

    card.innerHTML += `<em>${entry.date}</em><br/>`;
    card.innerHTML += `
      <button class="button mt-2 mr-2" onclick="editEntry(${index})">✏️ Edit</button>
      <button class="button mt-2" onclick="deleteEntry(${index})">🗑 Delete</button>`;
    entryList.appendChild(card);
  });
}

window.deleteEntry = function(index) {
  lifelistData[currentType].splice(index, 1);
  saveAll();
  renderList();
  updateMap(document.getElementById('mapScopeToggle')?.checked);
};

window.editEntry = function(index) {
  const entry = lifelistData[currentType][index];
  document.getElementById('entry-name').value = entry.name;
  const fields = lifelistTypes[currentType].fields;
  fields.forEach(f => {
    if (f !== 'images') {
      const el = document.getElementById(`entry-${f}`);
      if (el) el.value = entry[f] || '';
    }
  });
};

// 🌍 MAP SETUP
let map, markerGroup;

function initMap() {
  if (map) return;
  map = L.map('map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  markerGroup = L.layerGroup().addTo(map);
}

function updateMap(showAll = false) {
  if (!map) return;
  markerGroup.clearLayers();
  const keys = showAll ? Object.keys(lifelistData) : [currentType];
  const all = keys.flatMap(k => (lifelistData[k] || []).map(e => ({ ...e, _from: k })));

  all.forEach(e => {
    const loc = e.location;
    if (!loc) return;
    const [lat, lng] = loc.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) return;
    const marker = L.marker([lat, lng]).bindPopup(`<b>${e.name}</b><br/>${e._from}`);
    markerGroup.addLayer(marker);
  });
}

document.getElementById('mapScopeToggle').onchange = e => {
  updateMap(e.target.checked);
};

initMap();
setTimeout(() => updateMap(false), 500);

// 📸 EXIF support
document.getElementById('entryForm').addEventListener('change', async e => {
  if (e.target.id.includes('images') && e.target.files[0]) {
    const coords = await exifr.gps(e.target.files[0]).catch(() => null);
    if (coords?.latitude && coords?.longitude) {
      const locField = document.getElementById('entry-location');
      if (locField && !locField.value) {
        locField.value = `${coords.latitude},${coords.longitude}`;
      }
    }
  }
});

// 📤 EXPORT / 📥 IMPORT
document.getElementById('exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify({ lifelistTypes, lifelistData }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lifelists.json';
  a.click();
};

document.getElementById('importBtn').onclick = () => {
  importInput.click();
};

importInput.onchange = (e) => {
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
    updateMap(false);
  };
  reader.readAsText(file);
};

// NEW LIST TYPE CREATOR
const modal = document.getElementById('typeModal');
document.getElementById('newTypeBtn').onclick = () => modal.classList.remove('hidden');
document.getElementById('cancelTypeBtn').onclick = () => modal.classList.add('hidden');

const fieldsContainer = document.getElementById('fieldsContainer');
document.getElementById('addFieldBtn').onclick = () => {
  const input = document.createElement('input');
  input.placeholder = 'field name (e.g. crater)';
  input.className = 'input';
  fieldsContainer.appendChild(input);
};

document.getElementById('saveTypeBtn').onclick = () => {
  const name = document.getElementById('newTypeName').value;
  const fields = Array.from(fieldsContainer.querySelectorAll('input')).map(i => i.value).filter(Boolean);
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
  updateMap(false);
};
// Toggle map view visibility
document.getElementById('toggleMapBtn').onclick = () => {
  const container = document.getElementById('mapContainer');
  container.classList.toggle('hidden');
  if (!container.classList.contains('hidden')) {
    setTimeout(() => map?.invalidateSize(), 100); // fix blank map tile bug
    updateMap(document.getElementById('mapScopeToggle')?.checked);
  }
};
