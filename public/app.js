document.addEventListener('DOMContentLoaded', () => {
  const modeToggle = document.getElementById('modeToggle');
  const lifelistSelect = document.getElementById('lifelistSelect');
  const newTypeBtn = document.getElementById('newTypeBtn');
  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');
  const exportBtn = document.getElementById('exportBtn');
  const toggleMapBtn = document.getElementById('toggleMapBtn');
  const mapScopeToggle = document.getElementById('mapScopeToggle');
  const searchInput = document.getElementById('searchInput');
  const entryForm = document.getElementById('entryForm');
  const entryList = document.getElementById('entryList');

  const modal = document.getElementById('typeModal');
  const newTypeName = document.getElementById('newTypeName');
  const fieldsContainer = document.getElementById('fieldsContainer');
  const addFieldBtn = document.getElementById('addFieldBtn');
  const saveTypeBtn = document.getElementById('saveTypeBtn');
  const cancelTypeBtn = document.getElementById('cancelTypeBtn');

  let lifelistTypes = JSON.parse(localStorage.getItem('lifelistTypes')) || {
    birds: { name: 'Birds', fields: ['sciName', 'tier', 'notes', 'images', 'location'] }
  };
  let lifelistData = JSON.parse(localStorage.getItem('lifelistData')) || {};
  let currentType = 'birds';

  function saveAll() {
    localStorage.setItem('lifelistTypes', JSON.stringify(lifelistTypes));
    localStorage.setItem('lifelistData', JSON.stringify(lifelistData));
  }

  function applyTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.className = `solarized-${theme}`;
  }

  modeToggle.onclick = () => {
    const now = document.documentElement.className.includes('light') ? 'dark' : 'light';
    localStorage.setItem('theme', now);
    applyTheme();
  };
  applyTheme();

  function populateLifelistSelect() {
    lifelistSelect.innerHTML = '';
    for (const key in lifelistTypes) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = lifelistTypes[key].name;
      lifelistSelect.appendChild(opt);
    }
    lifelistSelect.value = currentType;
  }

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
        el.accept = 'image/*';
        el.multiple = true;
      } else {
        el = document.createElement('input');
      }
      el.id = `entry-${f}`;
      el.placeholder = f;
      el.className = 'input mb-2';
      entryForm.appendChild(el);
    });

    const btnRow = document.createElement('div');
    btnRow.className = 'flex gap-2';
    const save = document.createElement('button');
    save.textContent = 'Save Entry';
    save.className = 'button w-full';
    save.type = 'submit';
    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    cancel.className = 'button w-full';
    cancel.type = 'button';
    cancel.onclick = () => entryForm.reset();
    btnRow.appendChild(save);
    btnRow.appendChild(cancel);
    entryForm.appendChild(btnRow);
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

    if (!existing) (lifelistData[currentType] = list).push(entry);
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
      card.innerHTML += `<em>${entry.date}</em><br/>
        <button class="button mt-2" onclick="editEntry(${index})">✏️ Edit</button>
        <button class="button mt-2" onclick="deleteEntry(${index})">🗑 Delete</button>`;
      entryList.appendChild(card);
    });
  }

  window.editEntry = i => {
    const entry = lifelistData[currentType][i];
    document.getElementById('entry-name').value = entry.name;
    lifelistTypes[currentType].fields.forEach(f => {
      const el = document.getElementById(`entry-${f}`);
      if (el && f !== 'images') el.value = entry[f] || '';
    });
  };

  window.deleteEntry = i => {
    lifelistData[currentType].splice(i, 1);
    saveAll();
    renderList();
    updateMap();
  };

  // === Modal
  newTypeBtn.onclick = () => {
    modal.classList.remove('hidden');
    newTypeName.value = '';
    fieldsContainer.innerHTML = '';
  };
  cancelTypeBtn.onclick = () => {
    modal.classList.add('hidden');
    newTypeName.value = '';
    fieldsContainer.innerHTML = '';
  };
  addFieldBtn.onclick = () => {
    const input = document.createElement('input');
    input.className = 'input';
    input.placeholder = 'field name';
    fieldsContainer.appendChild(input);
  };
  saveTypeBtn.onclick = () => {
    const name = newTypeName.value;
    const fields = Array.from(fieldsContainer.querySelectorAll('input')).map(i => i.value).filter(Boolean);
    const key = name.toLowerCase().replace(/\s+/g, '_');
    lifelistTypes[key] = { name, fields };
    lifelistData[key] = [];
    currentType = key;
    saveAll();
    modal.classList.add('hidden');
    populateLifelistSelect();
    renderForm();
    renderList();
    updateMap();
  };
  console.log('Cancel button element:', cancelTypeBtn);

  // === Export/Import
  exportBtn.onclick = () => {
    const blob = new Blob([JSON.stringify({ lifelistTypes, lifelistData }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lifelists.json';
    a.click();
  };
  importBtn.onclick = () => importInput.click();
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

  // === Map
  let map, markerGroup;
  function initMap() {
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
      const [lat, lng] = (e.location || '').split(',').map(Number);
      if (isNaN(lat) || isNaN(lng)) return;
      const marker = L.marker([lat, lng]).bindPopup(`<b>${e.name}</b><br/>${e._from}`);
      markerGroup.addLayer(marker);
    });
  }

  let mapInitialized = false;
  toggleMapBtn.onclick = () => {
    const container = document.getElementById('mapContainer');
    const showing = container.classList.toggle('visible');
    container.style.display = showing ? 'block' : 'none';
    if (!mapInitialized && showing) {
      setTimeout(() => {
        initMap();
        mapInitialized = true;
        map.invalidateSize();
        updateMap(mapScopeToggle.checked);
      }, 200);
    } else if (mapInitialized) {
      setTimeout(() => map.invalidateSize(), 100);
      updateMap(mapScopeToggle.checked);
    }
  };
  mapScopeToggle.onchange = e => updateMap(e.target.checked);

  searchInput.oninput = () => renderList();

  renderForm();
  renderList();
});
