let suppliers = JSON.parse(localStorage.getItem('po_suppliers')) || [];
let dataBarang = JSON.parse(localStorage.getItem('po_barang')) || [];
let savedPOs = JSON.parse(localStorage.getItem('po_saved_reports')) || [];

let adminCreds = JSON.parse(localStorage.getItem('po_admin_creds')) || { 
  username: 'admin', 
  password: 'admin',
  avatar: '' 
};

let tokoProfile = JSON.parse(localStorage.getItem('po_toko_profile')) || {
  nama: 'PT. LAKSAMANA MANDIRI',
  telp: '08123456789',
  alamat: 'Jl. Raya Industri No. 12 Cilegon',
  logo: '',
  textColor: '#0f172a',
  fontSize: '11pt',
  printScale: 85
};

let tempAvatarBase64 = '';
let tempLogoBase64 = '';

function formatDateToID(dateString) {
  if (!dateString) return '';
  if (dateString.includes('/')) return dateString;
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return dateString;
}

document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  loadProfilData();
  updateNavbarAndTitles();
});

function checkLoginStatus() {
  const isLoggedIn = localStorage.getItem('po_app_login');
  if (isLoggedIn === 'true') {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    document.getElementById('userDisplayName').innerText = adminCreds.username;
    initApp();
  } else {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;

  if (u === adminCreds.username && p === adminCreds.password) {
    localStorage.setItem('po_app_login', 'true');
    checkLoginStatus();
  } else {
    alert('Username atau password salah!');
  }
}

function logout() {
  localStorage.removeItem('po_app_login');
  checkLoginStatus();
}

function initApp() {
  saveDataToStorage();
  renderSupplierTable();
  renderHargaTable();
  renderLaporanTable();
  populateSupplierSelect();
  updateDashboardStats();
  updateNavbarAndTitles();
  
  resetPOForm();
  
  const todayDateStr = new Date().toISOString().split('T')[0];
  document.getElementById('poTglInvoice').value = todayDateStr;
  document.getElementById('suppTanggal').value = todayDateStr;
  document.getElementById('barTanggal').value = todayDateStr;
  
  calculateDueDate();
  showTab('berandaTab');
}

function saveDataToStorage() {
  localStorage.setItem('po_suppliers', JSON.stringify(suppliers));
  localStorage.setItem('po_barang', JSON.stringify(dataBarang));
  localStorage.setItem('po_saved_reports', JSON.stringify(savedPOs));
  localStorage.setItem('po_admin_creds', JSON.stringify(adminCreds));
  localStorage.setItem('po_toko_profile', JSON.stringify(tokoProfile));
}

function generateDynamicFavicon() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (tokoProfile.logo) {
    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, 0, 0, 64, 64);
      document.getElementById('dynamicFavicon').href = canvas.toDataURL('image/png');
    };
    img.onerror = function() {
      drawDefaultFavicon(ctx, canvas);
    };
    img.src = tokoProfile.logo;
  } else {
    drawDefaultFavicon(ctx, canvas);
  }
}

function drawDefaultFavicon(ctx, canvas) {
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.roundRect(0, 0, 64, 64, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const initial = tokoProfile.nama ? tokoProfile.nama.charAt(0).toUpperCase() : 'P';
  ctx.fillText(initial, 32, 34);

  document.getElementById('dynamicFavicon').href = canvas.toDataURL('image/png');
}

function updateNavbarAndTitles() {
  const brandElem = document.getElementById('navBrandText');
  if (brandElem && tokoProfile.nama) {
    brandElem.innerText = tokoProfile.nama;
  }

  const browserTitleElem = document.getElementById('browserPageTitle');
  if (browserTitleElem && tokoProfile.nama) {
    browserTitleElem.innerText = `Sistem Purchase Order - ${tokoProfile.nama}`;
  }

  const navBrandImg = document.getElementById('navBrandImg');
  const navBrandIconWrap = document.getElementById('navBrandIconWrap');
  if (tokoProfile.logo) {
    navBrandImg.src = tokoProfile.logo;
    navBrandImg.classList.remove('hidden');
  } else {
    navBrandImg.classList.add('hidden');
  }

  const navUserAvatarImg = document.getElementById('navUserAvatarImg');
  const navUserAvatarIcon = document.getElementById('navUserAvatarIcon');
  if (adminCreds.avatar) {
    navUserAvatarImg.src = adminCreds.avatar;
    navUserAvatarImg.classList.remove('hidden');
    navUserAvatarIcon.classList.add('hidden');
  } else {
    navUserAvatarImg.classList.add('hidden');
    navUserAvatarIcon.classList.remove('hidden');
  }

  const dashboardCompanyName = document.getElementById('dashboardCompanyName');
  const dashboardCompanyTelp = document.getElementById('dashboardCompanyTelp');
  const dashboardCompanyAlamat = document.getElementById('dashboardCompanyAlamat');
  const dashboardLogoImg = document.getElementById('dashboardLogoImg');
  const dashboardLogoWrap = document.getElementById('dashboardLogoWrap');

  if (dashboardCompanyName) dashboardCompanyName.innerText = tokoProfile.nama || 'e-Purchasing System';
  if (dashboardCompanyTelp) dashboardCompanyTelp.innerText = tokoProfile.telp || '-';
  if (dashboardCompanyAlamat) dashboardCompanyAlamat.innerText = tokoProfile.alamat || '-';

  if (tokoProfile.logo) {
    dashboardLogoImg.src = tokoProfile.logo;
    dashboardLogoWrap.classList.remove('hidden');
  } else {
    dashboardLogoWrap.classList.add('hidden');
  }

  document.documentElement.style.setProperty('--custom-text-color', tokoProfile.textColor || '#0f172a');
  
  const scaleVal = (tokoProfile.printScale || 85) / 100;
  document.documentElement.style.setProperty('--print-scale-val', scaleVal);

  generateDynamicFavicon();
}

function updateDashboardStats() {
  const supCount = suppliers.length;
  const barCount = dataBarang.length;
  const poCount = savedPOs.length;

  document.getElementById('statSupplierCount').innerText = supCount;
  document.getElementById('statBarangCount').innerText = barCount;
  document.getElementById('statPoCount').innerText = poCount;

  const maxTarget = 20;

  const supRedPct = Math.min(Math.round((supCount / maxTarget) * 100), 100);
  const supBluePct = Math.max(Math.round(supRedPct * 0.75), 5);

  document.getElementById('lblSupBlue').innerText = "";
  document.getElementById('bSupBlue').style.height = `${supBluePct}%`;
  document.getElementById('lblSupRed').innerText = "";
  document.getElementById('bSupRed').style.height = `${supRedPct}%`;
  document.getElementById('lblSupYellow').innerText = "";
  document.getElementById('bSupYellow').style.height = `100%`;

  const barRedPct = Math.min(Math.round((barCount / maxTarget) * 100), 100);
  const barBluePct = Math.max(Math.round(barRedPct * 0.7), 5);

  document.getElementById('lblBarBlue').innerText = "";
  document.getElementById('bBarBlue').style.height = `${barBluePct}%`;
  document.getElementById('lblBarRed').innerText = "";
  document.getElementById('bBarRed').style.height = `${barRedPct}%`;
  document.getElementById('lblBarYellow').innerText = "";
  document.getElementById('bBarYellow').style.height = `100%`;

  const poRedPct = Math.min(Math.round((poCount / maxTarget) * 100), 100);
  const poBluePct = Math.max(Math.round(poRedPct * 0.8), 5);

  document.getElementById('lblPoBlue').innerText = "";
  document.getElementById('bPoBlue').style.height = `${poBluePct}%`;
  document.getElementById('lblPoRed').innerText = "";
  document.getElementById('bPoRed').style.height = `${poRedPct}%`;
  document.getElementById('lblPoYellow').innerText = "";
  document.getElementById('bPoYellow').style.height = `100%`;

  const totalSum = supCount + barCount + poCount || 1;
  const pSup = Math.round((supCount / totalSum) * 100);
  const pBar = Math.round((barCount / totalSum) * 100);
  const pPo = Math.max(100 - (pSup + pBar), 0);

  document.getElementById('pctSupplier').innerText = `${pSup}%`;
  document.getElementById('progSupplier').style.width = `${pSup}%`;
  document.getElementById('pctBarang').innerText = `${pBar}%`;
  document.getElementById('progBarang').style.width = `${pBar}%`;
  document.getElementById('pctPo').innerText = `${pPo}%`;
  document.getElementById('progPo').style.width = `${pPo}%`;
}

function showBarDetail(kategori, periode) {
  const detailBox = document.getElementById('chartDetailBox');
  let valText = "0%";
  let countText = "0 data";
  
  const supCount = suppliers.length;
  const barCount = dataBarang.length;
  const poCount = savedPOs.length;
  const maxTarget = 20;

  if (kategori === 'Supplier') {
    if (periode === 'Bulan Lalu') {
      const p = Math.max(Math.round((supCount * 0.75 / maxTarget) * 100), 5);
      valText = `${p}%`;
      countText = `${Math.round(supCount * 0.75)} data`;
    } else if (periode === 'Bulan Ini') {
      const p = Math.min(Math.round((supCount / maxTarget) * 100), 100);
      valText = `${p}%`;
      countText = `${supCount} data`;
    } else {
      valText = `100%`;
      countText = `${maxTarget} Target`;
    }
  } else if (kategori === 'Barang') {
    if (periode === 'Bulan Lalu') {
      const p = Math.max(Math.round((barCount * 0.7 / maxTarget) * 100), 5);
      valText = `${p}%`;
      countText = `${Math.round(barCount * 0.7)} data`;
    } else if (periode === 'Bulan Ini') {
      const p = Math.min(Math.round((barCount / maxTarget) * 100), 100);
      valText = `${p}%`;
      countText = `${barCount} data`;
    } else {
      valText = `100%`;
      countText = `${maxTarget} Target`;
    }
  } else if (kategori === 'Transaksi PO') {
    if (periode === 'Bulan Lalu') {
      const p = Math.max(Math.round((poCount * 0.8 / maxTarget) * 100), 5);
      valText = `${p}%`;
      countText = `${Math.round(poCount * 0.8)} data`;
    } else if (periode === 'Bulan Ini') {
      const p = Math.min(Math.round((poCount / maxTarget) * 100), 100);
      valText = `${p}%`;
      countText = `${poCount} data`;
    } else {
      valText = `100%`;
      countText = `${maxTarget} Target`;
    }
  }

  detailBox.innerHTML = `
    <div class="chart-detail-card-active">
      <div class="cd-header">
        <span>📊 Detail Batang: <b>${kategori} (${periode})</b></span>
        <span class="cd-badge">Capaian: ${valText} (${countText})</span>
      </div>
    </div>
  `;
}

function clearSearch(inputId, renderCallback) {
  const inputElem = document.getElementById(inputId);
  if (inputElem) inputElem.value = '';
  if (inputId === 'searchPanduanInput') {
    resetPanduanHighlight();
  }
  if (renderCallback) renderCallback();
}

function filterAndScrollPanduan() {
  const keyword = (document.getElementById('searchPanduanInput')?.value || '').trim().toLowerCase();
  const cards = document.querySelectorAll('.panduan-item-card');

  resetPanduanHighlight();

  if (keyword === '') {
    cards.forEach(card => card.style.display = 'block');
    return;
  }

  let firstMatchedCard = null;

  cards.forEach(card => {
    const keywordsAttr = card.getAttribute('data-keywords') || '';
    const textContent = card.innerText.toLowerCase();

    if (keywordsAttr.includes(keyword) || textContent.includes(keyword)) {
      card.style.display = 'block';
      if (!firstMatchedCard) {
        firstMatchedCard = card;
      }
      highlightTextInElement(card, keyword);
    } else {
      card.style.display = 'none';
    }
  });

  if (firstMatchedCard) {
    firstMatchedCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function highlightTextInElement(element, keyword) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const nodesToModify = [];

  while (node = walker.nextNode()) {
    if (node.nodeValue && node.nodeValue.toLowerCase().includes(keyword)) {
      if (node.parentNode && node.parentNode.nodeName !== 'SCRIPT' && node.parentNode.nodeName !== 'STYLE' && !node.parentNode.classList.contains('search-highlight')) {
        nodesToModify.push(node);
      }
    }
  }

  nodesToModify.forEach(node => {
    const val = node.nodeValue;
    const lowerVal = val.toLowerCase();
    const idx = lowerVal.indexOf(keyword);
    if (idx >= 0) {
      const span = document.createElement('span');
      span.className = 'search-highlight';
      span.textContent = val.substr(idx, keyword.length);

      const afterText = document.createTextNode(val.substr(idx + keyword.length));
      const beforeText = document.createTextNode(val.substr(0, idx));

      const parent = node.parentNode;
      parent.insertBefore(beforeText, node);
      parent.insertBefore(span, node);
      parent.insertBefore(afterText, node);
      parent.removeChild(node);
    }
  });
}

function resetPanduanHighlight() {
  document.querySelectorAll('.search-highlight').forEach(span => {
    const parent = span.parentNode;
    parent.replaceChild(document.createTextNode(span.textContent), span);
    parent.normalize();
  });
  document.querySelectorAll('.panduan-item-card').forEach(card => card.style.display = 'block');
}

function toggleMobileMenu() {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) {
    navLinks.classList.toggle('show');
  }
}

function toggleForm(formId, iconId) {
  const formCard = document.getElementById(formId);
  const icon = document.getElementById(iconId);
  if (formCard.classList.contains('collapsed')) {
    formCard.classList.remove('collapsed');
    icon.innerText = '▲';
  } else {
    formCard.classList.add('collapsed');
    icon.innerText = '▼';
  }
}

function closeForm(formId, iconId) {
  const formCard = document.getElementById(formId);
  const icon = document.getElementById(iconId);
  if (formCard) formCard.classList.add('collapsed');
  if (icon) icon.innerText = '▼';
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  const activeTabTarget = (tabId === 'detailLaporanTab') ? 'laporanTab' : (tabId === 'profilTab' ? '' : tabId);
  const activeBtn = document.querySelector(`.nav-btn[data-tab="${activeTabTarget}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  if (tabId === 'berandaTab') updateDashboardStats();
}

function previewAvatar(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      tempAvatarBase64 = event.target.result;
      const img = document.getElementById('previewAvatarImg');
      img.src = tempAvatarBase64;
      img.classList.remove('hidden');
      document.getElementById('previewAvatarIcon').classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }
}

function previewLogo(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      tempLogoBase64 = event.target.result;
      const img = document.getElementById('previewLogoImg');
      img.src = tempLogoBase64;
      img.classList.remove('hidden');
      document.getElementById('previewLogoIcon').classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }
}

function loadProfilData() {
  document.getElementById('profilUsername').value = adminCreds.username;
  document.getElementById('tokoNama').value = tokoProfile.nama;
  document.getElementById('tokoTelp').value = tokoProfile.telp || '';
  document.getElementById('tokoAlamat').value = tokoProfile.alamat || '';
  if (document.getElementById('tokoTextColor')) document.getElementById('tokoTextColor').value = tokoProfile.textColor || '#0f172a';
  if (document.getElementById('tokoFontSize')) document.getElementById('tokoFontSize').value = tokoProfile.fontSize || '11pt';
  if (document.getElementById('tokoPrintScale')) document.getElementById('tokoPrintScale').value = tokoProfile.printScale || 85;

  tempAvatarBase64 = adminCreds.avatar || '';
  if (adminCreds.avatar) {
    const img = document.getElementById('previewAvatarImg');
    img.src = adminCreds.avatar;
    img.classList.remove('hidden');
    document.getElementById('previewAvatarIcon').classList.add('hidden');
  }

  tempLogoBase64 = tokoProfile.logo || '';
  if (tokoProfile.logo) {
    const img = document.getElementById('previewLogoImg');
    img.src = tokoProfile.logo;
    img.classList.remove('hidden');
    document.getElementById('previewLogoIcon').classList.add('hidden');
  }
}

function saveProfil(e) {
  e.preventDefault();
  adminCreds.username = document.getElementById('profilUsername').value;
  const newP = document.getElementById('profilPassword').value;
  if (newP.trim() !== '') adminCreds.password = newP;
  if (tempAvatarBase64) adminCreds.avatar = tempAvatarBase64;

  saveDataToStorage();
  updateNavbarAndTitles();
  document.getElementById('profilPassword').value = '';
  alert('Profil admin berhasil diperbarui!');
}

function saveToko(e) {
  e.preventDefault();
  tokoProfile.nama = document.getElementById('tokoNama').value;
  tokoProfile.telp = document.getElementById('tokoTelp').value;
  tokoProfile.alamat = document.getElementById('tokoAlamat').value;
  if (tempLogoBase64) tokoProfile.logo = tempLogoBase64;
  tokoProfile.textColor = document.getElementById('tokoTextColor').value;
  tokoProfile.fontSize = document.getElementById('tokoFontSize').value;
  tokoProfile.printScale = parseInt(document.getElementById('tokoPrintScale').value) || 85;

  saveDataToStorage();
  updateNavbarAndTitles();
  alert('Setting perusahaan & pengaturan cetak berhasil disimpan!');
}

/* MASTER SUPPLIER LOGIC */
function renderSupplierTable() {
  const tbody = document.getElementById('supplierTbody');
  tbody.innerHTML = '';
  const keyword = (document.getElementById('searchSupplierInput')?.value || '').toLowerCase();
  const filtered = suppliers.filter(s => (s.namaPT || '').toLowerCase().includes(keyword) || (s.nama || '').toLowerCase().includes(keyword));

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #777;">Tidak ada data supplier.</td></tr>`;
    return;
  }

  filtered.forEach((s, idx) => {
    const originalIndex = suppliers.indexOf(s);
    tbody.innerHTML += `
      <tr>
        <td>${idx + 1}</td>
        <td>${formatDateToID(s.tanggal)}</td>
        <td><b>${s.namaPT || s.nama}</b></td>
        <td>${s.nama || '-'}</td>
        <td>${s.kodePO || '-'}</td>
        <td>${s.docCode || '-'}</td>
        <td>${s.reff || '-'}</td>
        <td>${s.top} Hari</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="editSupplier(${originalIndex})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteSupplier(${originalIndex})">Hapus</button>
        </td>
      </tr>
    `;
  });
  updateDashboardStats();
}

function saveSupplier(e) {
  e.preventDefault();
  const idx = document.getElementById('suppEditIndex').value;
  const supplierData = {
    tanggal: document.getElementById('suppTanggal').value || new Date().toISOString().split('T')[0],
    namaPT: document.getElementById('suppNamaPT').value.toUpperCase(),
    nama: document.getElementById('suppNama').value.toUpperCase(),
    kodePO: document.getElementById('suppKodePO').value.toUpperCase(),
    docCode: document.getElementById('suppDocCode').value,
    reff: document.getElementById('suppReff').value.toUpperCase(),
    projectCode: document.getElementById('suppProjectCode').value.toUpperCase(),
    projectDesc: document.getElementById('suppProjectDesc').value.toUpperCase(),
    telp: document.getElementById('suppTelp').value,
    fax: document.getElementById('suppFax').value,
    email: document.getElementById('suppEmail').value,
    npwp: document.getElementById('suppNpwp').value,
    alamat: document.getElementById('suppAlamat').value.toUpperCase(),
    top: parseInt(document.getElementById('suppTop').value) || 0,
    disc: parseFloat(document.getElementById('suppDisc').value) || 0,
    ppn: parseFloat(document.getElementById('suppPpn').value) || 0
  };

  if (idx === '') suppliers.push(supplierData);
  else suppliers[idx] = supplierData;

  saveDataToStorage();
  renderSupplierTable();
  populateSupplierSelect();
  resetSupplierForm();
}

function editSupplier(idx) {
  document.getElementById('supplierFormCard').classList.remove('collapsed');
  document.getElementById('supplierToggleIcon').innerText = '▲';
  document.getElementById('supplierFormCardContainer').scrollIntoView({ behavior: 'smooth' });
  
  const supp = suppliers[idx];
  document.getElementById('suppEditIndex').value = idx;
  document.getElementById('suppTanggal').value = supp.tanggal;
  document.getElementById('suppNamaPT').value = supp.namaPT || '';
  document.getElementById('suppNama').value = supp.nama || '';
  document.getElementById('suppKodePO').value = supp.kodePO || '';
  document.getElementById('suppDocCode').value = supp.docCode || '';
  document.getElementById('suppReff').value = supp.reff || '';
  document.getElementById('suppProjectCode').value = supp.projectCode || '';
  document.getElementById('suppProjectDesc').value = supp.projectDesc || '';
  document.getElementById('suppTelp').value = supp.telp || '';
  document.getElementById('suppFax').value = supp.fax || '';
  document.getElementById('suppEmail').value = supp.email || '';
  document.getElementById('suppNpwp').value = supp.npwp || '';
  document.getElementById('suppAlamat').value = supp.alamat || '';
  document.getElementById('suppTop').value = supp.top || 0;
  document.getElementById('suppDisc').value = supp.disc || 0;
  document.getElementById('suppPpn').value = supp.ppn || 0;
}

function deleteSupplier(idx) {
  if (confirm('Yakin menghapus supplier ini?')) {
    suppliers.splice(idx, 1);
    saveDataToStorage();
    renderSupplierTable();
    populateSupplierSelect();
  }
}

function resetSupplierForm() {
  document.getElementById('supplierForm').reset();
  document.getElementById('suppEditIndex').value = '';
  closeForm('supplierFormCard', 'supplierToggleIcon');
}

/* DAFTAR HARGA LOGIC */
function renderHargaTable() {
  const tbody = document.getElementById('hargaTbody');
  tbody.innerHTML = '';
  const keyword = (document.getElementById('searchHargaInput')?.value || '').toLowerCase();
  const filtered = dataBarang.filter(b => b.nama.toLowerCase().includes(keyword) || b.satuan.toLowerCase().includes(keyword));

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #777;">Tidak ada data barang.</td></tr>`;
    return;
  }

  filtered.forEach((b, idx) => {
    const originalIndex = dataBarang.indexOf(b);
    tbody.innerHTML += `
      <tr>
        <td>${idx + 1}</td>
        <td>${formatDateToID(b.tanggal)}</td>
        <td><b>${b.nama}</b></td>
        <td>${formatNumber(b.harga)}</td>
        <td>${b.satuan}</td>
        <td>${b.remarks || '-'}</td>
        <td>${b.lokasi || '-'}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="editHarga(${originalIndex})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteHarga(${originalIndex})">Hapus</button>
        </td>
      </tr>
    `;
  });
  updateDashboardStats();
}

function saveHarga(e) {
  e.preventDefault();
  const idx = document.getElementById('hargaEditIndex').value;
  const barangData = {
    tanggal: document.getElementById('barTanggal').value || new Date().toISOString().split('T')[0],
    headerPt: document.getElementById('barHeaderPt').value.toUpperCase(),
    subHeader: document.getElementById('barSubHeader').value,
    headerTelp: document.getElementById('barHeaderTelp').value,
    headerNpwp: document.getElementById('barHeaderNpwp').value,
    headerAlamat: document.getElementById('barHeaderAlamat').value.toUpperCase(),
    nama: document.getElementById('barNama').value.toUpperCase(),
    harga: parseFloat(document.getElementById('barHarga').value) || 0,
    satuan: document.getElementById('barSatuan').value.toUpperCase(),
    remarks: document.getElementById('barRemarks').value.toUpperCase(),
    lokasi: document.getElementById('barLokasi').value.toUpperCase()
  };

  if (idx === '') dataBarang.push(barangData);
  else dataBarang[idx] = barangData;

  saveDataToStorage();
  renderHargaTable();
  updateAllPOItemSelects();
  resetHargaForm();
}

function editHarga(idx) {
  document.getElementById('hargaFormCard').classList.remove('collapsed');
  document.getElementById('hargaToggleIcon').innerText = '▲';
  document.getElementById('hargaFormCardContainer').scrollIntoView({ behavior: 'smooth' });

  const item = dataBarang[idx];
  document.getElementById('hargaEditIndex').value = idx;
  document.getElementById('barHeaderPt').value = item.headerPt || '';
  document.getElementById('barSubHeader').value = item.subHeader || '';
  document.getElementById('barHeaderTelp').value = item.headerTelp || '';
  document.getElementById('barHeaderNpwp').value = item.headerNpwp || '';
  document.getElementById('barHeaderAlamat').value = item.headerAlamat || '';
  document.getElementById('barTanggal').value = item.tanggal;
  document.getElementById('barNama').value = item.nama;
  document.getElementById('barHarga').value = item.harga;
  document.getElementById('barSatuan').value = item.satuan;
  document.getElementById('barRemarks').value = item.remarks || '';
  document.getElementById('barLokasi').value = item.lokasi || '';
}

function deleteHarga(idx) {
  if (confirm('Yakin menghapus barang ini?')) {
    dataBarang.splice(idx, 1);
    saveDataToStorage();
    renderHargaTable();
    updateAllPOItemSelects();
  }
}

function resetHargaForm() {
  document.getElementById('hargaForm').reset();
  document.getElementById('hargaEditIndex').value = '';
  closeForm('hargaFormCard', 'hargaToggleIcon');
}

function populateSupplierSelect() {
  const select = document.getElementById('poSupplierSelect');
  select.innerHTML = '<option value="">-- Pilih Nama PT Supplier --</option>';
  suppliers.forEach((s, idx) => {
    select.innerHTML += `<option value="${idx}">${s.namaPT || s.nama}</option>`;
  });

  const filterSelect = document.getElementById('filterSupplierSelect');
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="">-- Semua Supplier --</option>';
    suppliers.forEach((s) => {
      filterSelect.innerHTML += `<option value="${s.namaPT || s.nama}">${s.namaPT || s.nama}</option>`;
    });
  }
}

function toggleManualEdit() {
  const isChecked = document.getElementById('manualEditToggle').checked;
  const statusText = document.getElementById('editStatusText');
  const fields = ['poNamaAttn', 'poTelp', 'poFax', 'poEmail', 'poNpwp', 'poAlamat', 'poTop', 'poDiscountPercent', 'poPpnPercent', 'poDocCode', 'poReff', 'poProjectCode', 'poProjectDesc'];

  if (isChecked) {
    statusText.innerText = "ON";
    statusText.style.color = "#16a34a";
    fields.forEach(id => document.getElementById(id)?.removeAttribute('readonly'));
    document.getElementById('poTglJatuhTempo').removeAttribute('readonly');
    document.querySelectorAll('.po-item-remarks, .po-item-lokasi').forEach(el => el.removeAttribute('readonly'));
  } else {
    statusText.innerText = "OFF";
    statusText.style.color = "#dc2626";
    fields.forEach(id => document.getElementById(id)?.setAttribute('readonly', true));
    document.getElementById('poTglJatuhTempo').setAttribute('readonly', true);
    document.querySelectorAll('.po-item-remarks, .po-item-lokasi').forEach(el => el.setAttribute('readonly', true));
    onSupplierChange();
  }
}

function onSupplierChange() {
  const idx = document.getElementById('poSupplierSelect').value;
  if (idx !== "") {
    const supp = suppliers[idx];
    document.getElementById('poNamaAttn').value = supp.nama && supp.nama.trim() !== "" ? supp.nama : '-';
    document.getElementById('poTelp').value = supp.telp && supp.telp.trim() !== "" ? supp.telp : '-';
    document.getElementById('poFax').value = supp.fax && supp.fax.trim() !== "" ? supp.fax : '-';
    document.getElementById('poEmail').value = supp.email && supp.email.trim() !== "" ? supp.email : '-';
    document.getElementById('poNpwp').value = supp.npwp && supp.npwp.trim() !== "" ? supp.npwp : '-';
    document.getElementById('poAlamat').value = supp.alamat && supp.alamat.trim() !== "" ? supp.alamat : '-';
    document.getElementById('poTop').value = supp.top !== undefined && supp.top !== "" ? supp.top : 0;
    document.getElementById('poDiscountPercent').value = (supp.disc !== undefined && supp.disc !== "" ? supp.disc : 0) + '%';
    document.getElementById('poPpnPercent').value = supp.ppn !== undefined && supp.ppn !== "" ? supp.ppn : 0;
    document.getElementById('poKodePOInput').value = supp.kodePO && supp.kodePO.trim() !== "" ? supp.kodePO : '-';
    document.getElementById('poDocCode').value = supp.docCode && supp.docCode.trim() !== "" ? supp.docCode : '-';
    document.getElementById('poReff').value = supp.reff && supp.reff.trim() !== "" ? supp.reff : '-';
    document.getElementById('poProjectCode').value = supp.projectCode && supp.projectCode.trim() !== "" ? supp.projectCode : '-';
    document.getElementById('poProjectDesc').value = supp.projectDesc && supp.projectDesc.trim() !== "" ? supp.projectDesc : '-';
  } else {
    document.getElementById('poNamaAttn').value = '-';
    document.getElementById('poTelp').value = '-';
    document.getElementById('poFax').value = '-';
    document.getElementById('poEmail').value = '-';
    document.getElementById('poNpwp').value = '-';
    document.getElementById('poAlamat').value = '-';
    document.getElementById('poTop').value = 0;
    document.getElementById('poDiscountPercent').value = '0%';
    document.getElementById('poPpnPercent').value = 0;
    document.getElementById('poKodePOInput').value = '-';
    document.getElementById('poDocCode').value = '-';
    document.getElementById('poReff').value = '-';
    document.getElementById('poProjectCode').value = '-';
    document.getElementById('poProjectDesc').value = '-';
  }
  calculateDueDate();
  calculatePOTotals();
}

function calculateDueDate() {
  const tglInvVal = document.getElementById('poTglInvoice').value;
  const topInput = document.getElementById('poTop');
  const tglJatuhTempoInput = document.getElementById('poTglJatuhTempo');
  
  if (tglInvVal && topInput) {
    const topVal = parseInt(topInput.value) || 0;
    const invDate = new Date(tglInvVal);
    invDate.setDate(invDate.getDate() + topVal);
    const dd = String(invDate.getDate()).padStart(2, '0');
    const mm = String(invDate.getMonth() + 1).padStart(2, '0');
    const yyyy = invDate.getFullYear();
    tglJatuhTempoInput.value = `${dd}/${mm}/${yyyy}`;
  }
}

function calculateTopFromDueDate() {
  const isManualEditOn = document.getElementById('manualEditToggle').checked;
  if (!isManualEditOn) return;

  const tglInvVal = document.getElementById('poTglInvoice').value;
  const tglJatuhTempoVal = document.getElementById('poTglJatuhTempo').value;

  if (tglInvVal && tglJatuhTempoVal && tglJatuhTempoVal.includes('/')) {
    const parts = tglJatuhTempoVal.split('/');
    if (parts.length === 3) {
      const dueDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      const invDate = new Date(tglInvVal);
      const diffTime = dueDate - invDate;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        document.getElementById('poTop').value = diffDays;
      }
    }
  }
}

function addPORow(itemIdx = "", qtyVal = "", lokasiVal = "", remarksVal = "") {
  const tbody = document.getElementById('poTbody');
  const rowCount = tbody.children.length + 1;
  let barangOptions = '<option value="">-- Pilih Barang --</option>';
  dataBarang.forEach((b, idx) => {
    const selected = (itemIdx !== "" && parseInt(itemIdx) === idx) ? "selected" : "";
    barangOptions += `<option value="${idx}" ${selected}>${b.nama}</option>`;
  });

  const finalLokasi = lokasiVal && lokasiVal.trim() !== "" ? lokasiVal : '-';
  const finalRemarks = remarksVal && remarksVal.trim() !== "" ? remarksVal : '-';
  const lokasiClass = (finalLokasi === '-' || finalLokasi === '') ? 'form-control po-item-lokasi readonly-red' : 'form-control po-item-lokasi';
  const remarksClass = (finalRemarks === '-' || finalRemarks === '') ? 'form-control po-item-remarks readonly-red' : 'form-control po-item-remarks';

  const isManualEditOn = document.getElementById('manualEditToggle').checked;
  const readonlyAttr = isManualEditOn ? '' : 'readonly';

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="text-align:center;" class="row-number">${rowCount}</td>
    <td><select class="form-control po-item-select" onchange="onItemChange(this)">${barangOptions}</select></td>
    <td><input type="text" class="form-control po-item-satuan" value="-" readonly></td>
    <td><input type="number" class="form-control po-item-qty" min="0" value="${qtyVal}" oninput="calculateRowTotal(this)" onkeydown="handleQtyEnter(event, this)"></td>
    <td><input type="text" class="form-control po-item-harga" value="-" readonly></td>
    <td><input type="text" class="${remarksClass}" value="${finalRemarks}" placeholder="Remarks" ${readonlyAttr}></td>
    <td><input type="text" class="${lokasiClass}" value="${finalLokasi}" placeholder="Lokasi" ${readonlyAttr}></td>
    <td><input type="text" class="form-control po-item-total" value="-" readonly></td>
    <td style="text-align:center; padding: 4px;" class="no-print"><button type="button" class="btn btn-danger btn-sm" style="padding: 2px 6px; font-size: 0.75rem;" onclick="removePORow(this)">Hapus</button></td>
  `;
  tbody.appendChild(tr);
  if (itemIdx !== "") onItemChange(tr.querySelector('.po-item-select'));
  reindexPORows();
}

function handleQtyEnter(event, qtyInput) {
  if (event.key === "Enter") {
    event.preventDefault();
    const tr = qtyInput.closest('tr');
    if (tr === document.getElementById('poTbody').lastElementChild && qtyInput.value > 0) {
      addPORow();
      document.getElementById('poTbody').lastElementChild.querySelector('.po-item-select').focus();
    }
  }
}

function removePORow(btn) {
  if (document.getElementById('poTbody').children.length > 1) {
    btn.closest('tr').remove();
    reindexPORows();
    calculatePOTotals();
  }
}

function reindexPORows() {
  document.querySelectorAll('#poTbody tr').forEach((row, idx) => {
    row.querySelector('.row-number').innerText = idx + 1;
  });
}

function updateAllPOItemSelects() {
  document.querySelectorAll('.po-item-select').forEach(select => {
    const currentVal = select.value;
    let options = '<option value="">-- Pilih Barang --</option>';
    dataBarang.forEach((b, idx) => {
      const selected = (currentVal !== "" && parseInt(currentVal) === idx) ? "selected" : "";
      options += `<option value="${idx}" ${selected}>${b.nama}</option>`;
    });
    select.innerHTML = options;
    onItemChange(select);
  });
}

function onItemChange(selectElem) {
  const row = selectElem.closest('tr');
  const idx = selectElem.value;
  const remarksInput = row.querySelector('.po-item-remarks');
  const lokasiInput = row.querySelector('.po-item-lokasi');

  if (idx !== "") {
    const item = dataBarang[idx];
    row.querySelector('.po-item-satuan').value = item.satuan && item.satuan.trim() !== "" ? item.satuan : '-';
    row.querySelector('.po-item-harga').value = formatNumber(item.harga);
    row.querySelector('.po-item-harga').dataset.raw = item.harga;
    
    const remVal = item.remarks && item.remarks.trim() !== "" ? item.remarks : '-';
    remarksInput.value = remVal;
    if (remVal === '-' || remVal === '') remarksInput.classList.add('readonly-red');
    else remarksInput.classList.remove('readonly-red');

    const lokVal = item.lokasi && item.lokasi.trim() !== "" ? item.lokasi : '-';
    lokasiInput.value = lokVal;
    if (lokVal === '-' || lokVal === '') lokasiInput.classList.add('readonly-red');
    else lokasiInput.classList.remove('readonly-red');
  } else {
    row.querySelector('.po-item-satuan').value = '-';
    row.querySelector('.po-item-harga').value = '-';
    row.querySelector('.po-item-harga').dataset.raw = 0;
    remarksInput.value = '-';
    remarksInput.classList.add('readonly-red');
    lokasiInput.value = '-';
    lokasiInput.classList.add('readonly-red');
  }
  calculateRowTotal(row.querySelector('.po-item-qty'));
}

function calculateRowTotal(elem) {
  const row = elem.closest('tr');
  const qty = parseFloat(row.querySelector('.po-item-qty').value) || 0;
  const harga = parseFloat(row.querySelector('.po-item-harga').dataset.raw) || 0;
  const total = qty * harga;
  row.querySelector('.po-item-total').value = total > 0 ? formatNumber(total) : '-';
  row.querySelector('.po-item-total').dataset.raw = total;
  calculatePOTotals();
}

function calculatePOTotals() {
  let subtotal = 0;
  document.querySelectorAll('.po-item-total').forEach(input => {
    subtotal += parseFloat(input.dataset.raw) || 0;
  });
  const discVal = subtotal * ((parseFloat(document.getElementById('poDiscountPercent').value) || 0) / 100);
  const dpp = subtotal - discVal;
  const ppnVal = parseFloat(document.getElementById('poPpnPercent').value) || 0;
  const ppn = dpp * (ppnVal / 100);
  const total = dpp + ppn;

  document.getElementById('poSubtotal').innerText = formatNumber(subtotal);
  document.getElementById('poDiscVal').innerText = formatNumber(discVal);
  document.getElementById('poDpp').innerText = formatNumber(dpp);
  document.getElementById('poPpnLabel').innerText = `VAT ${ppnVal}% :`;
  document.getElementById('poPpn').innerText = formatNumber(ppn);
  document.getElementById('poTotal').innerText = formatNumber(Math.round(total));
  document.getElementById('poTerbilang').innerText = terbilang(Math.round(total)) + " Rupiah";
}

function resetPOForm() {
  document.getElementById('manualEditToggle').checked = false;
  toggleManualEdit();
  document.getElementById('poSupplierSelect').value = '';
  document.getElementById('poKodePOInput').value = '-';
  document.getElementById('poDocCode').value = '-';
  document.getElementById('poReff').value = '-';
  document.getElementById('poProjectCode').value = '-';
  document.getElementById('poProjectDesc').value = '-';
  document.getElementById('poPpnPercent').value = 0;
  onSupplierChange();
  document.getElementById('poTglInvoice').value = new Date().toISOString().split('T')[0];
  calculateDueDate();
  document.getElementById('poTbody').innerHTML = '';
  addPORow();
  calculatePOTotals();
}

function simpanDanLihatLaporan() {
  const suppIdx = document.getElementById('poSupplierSelect').value;
  if (suppIdx === "") {
    alert("Silakan pilih Nama PT Supplier terlebih dahulu!");
    return;
  }
  const supplier = suppliers[suppIdx];
  let items = [];
  document.querySelectorAll('#poTbody tr').forEach(tr => {
    const barangSel = tr.querySelector('.po-item-select');
    const qtyVal = tr.querySelector('.po-item-qty').value;
    if (barangSel.value !== "" && qtyVal > 0) {
      const barang = dataBarang[barangSel.value];
      items.push({
        namaBarang: barang ? barang.nama : '-',
        satuan: tr.querySelector('.po-item-satuan').value || '-',
        qty: parseFloat(qtyVal),
        harga: parseFloat(tr.querySelector('.po-item-harga').dataset.raw) || 0,
        remarks: tr.querySelector('.po-item-remarks').value || '-',
        lokasi: tr.querySelector('.po-item-lokasi').value || '-',
        total: parseFloat(tr.querySelector('.po-item-total').dataset.raw) || 0,
        headerPt: barang ? (barang.headerPt || '-') : '-',
        subHeader: barang ? (barang.subHeader || '-') : '-',
        headerTelp: barang ? (barang.headerTelp || '-') : '-',
        headerNpwp: barang ? (barang.headerNpwp || '-') : '-',
        headerAlamat: barang ? (barang.headerAlamat || '-') : '-'
      });
    }
  });

  if (items.length === 0) {
    alert("Minimal isi satu barang dan Qty!");
    return;
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discVal = subtotal * ((parseFloat(document.getElementById('poDiscountPercent').value) || 0) / 100);
  const dpp = subtotal - discVal;
  const ppn = dpp * ((parseFloat(document.getElementById('poPpnPercent').value) || 0) / 100);
  const total = Math.round(dpp + ppn);

  savedPOs.push({
    id: Date.now(),
    tanggalSimpan: new Date().toLocaleDateString('id-ID'),
    tglInvoice: document.getElementById('poTglInvoice').value,
    kodePO: document.getElementById('poKodePOInput').value || '-',
    docCode: document.getElementById('poDocCode').value || '-',
    reff: document.getElementById('poReff').value || '-',
    projectCode: document.getElementById('poProjectCode').value || '-',
    projectDesc: document.getElementById('poProjectDesc').value || '-',
    supplierNamaPT: supplier.namaPT || supplier.nama || '-',
    supplierAttn: document.getElementById('poNamaAttn').value || '-',
    supplierTelp: document.getElementById('poTelp').value || '-',
    supplierFax: document.getElementById('poFax').value || '-',
    supplierEmail: document.getElementById('poEmail').value || '-',
    supplierNpwp: document.getElementById('poNpwp').value || '-',
    supplierAlamat: document.getElementById('poAlamat').value || '-',
    top: document.getElementById('poTop').value || 0,
    tglJatuhTempo: document.getElementById('poTglJatuhTempo').value || '-',
    discountPercent: document.getElementById('poDiscountPercent').value || '0%',
    ppnPercent: parseFloat(document.getElementById('poPpnPercent').value) || 0,
    items: items,
    subtotal: subtotal,
    discVal: discVal,
    dpp: dpp,
    ppn: ppn,
    total: total,
    terbilang: terbilang(total) + " Rupiah"
  });

  saveDataToStorage();
  renderLaporanTable();
  resetPOForm();
  showTab('laporanTab');
  alert("Purchase Order berhasil disimpan!");
}

function renderLaporanTable() {
  const tbody = document.getElementById('laporanTbody');
  tbody.innerHTML = '';
  const keyword = (document.getElementById('searchLaporanInput')?.value || '').toLowerCase();
  const filterSup = document.getElementById('filterSupplierSelect')?.value || '';
  const startDate = document.getElementById('filterStartDate')?.value || '';
  const endDate = document.getElementById('filterEndDate')?.value || '';

  const filtered = savedPOs.filter(po => {
    const pt = po.supplierNamaPT || '';
    if (keyword && !pt.toLowerCase().includes(keyword)) return false;
    if (filterSup && pt !== filterSup) return false;
    
    if (startDate || endDate) {
      const poDate = po.tglInvoice;
      if (!poDate) return false;
      if (startDate && poDate < startDate) return false;
      if (endDate && poDate > endDate) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #777;">Tidak ada laporan.</td></tr>`;
    return;
  }

  filtered.forEach((po, index) => {
    const origIdx = savedPOs.indexOf(po);
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${formatDateToID(po.tglInvoice)}</td>
        <td><b>${po.supplierNamaPT}</b></td>
        <td>${po.supplierAttn || '-'}</td>
        <td>${po.items.length} Item</td>
        <td><b>${formatNumber(po.total)}</b></td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="lihatDetailLaporan(${origIdx})">👁️ Detail / Cetak</button>
          <button class="btn btn-danger btn-sm" onclick="hapusLaporan(${origIdx})">Hapus</button>
        </td>
      </tr>
    `;
  });
  updateDashboardStats();
}

function hapusLaporan(index) {
  if (confirm("Hapus laporan PO ini?")) {
    savedPOs.splice(index, 1);
    saveDataToStorage();
    renderLaporanTable();
  }
}

function lihatDetailLaporan(index) {
  const po = savedPOs[index];
  const container = document.getElementById('printAreaContainer');
  let itemsHtml = '';
  po.items.forEach((item, i) => {
    itemsHtml += `
      <tr>
        <td style="border: 1.5px solid #000; padding: 4px 6px; text-align:center;">${i + 1}</td>
        <td style="border: 1.5px solid #000; padding: 4px 6px;">${item.namaBarang}</td>
        <td style="border: 1.5px solid #000; padding: 4px 6px; text-align:center;">${item.satuan}</td>
        <td style="border: 1.5px solid #000; padding: 4px 6px; text-align:center;">${item.qty}</td>
        <td style="border: 1.5px solid #000; padding: 4px 6px; text-align:right;">${formatNumber(item.harga)}</td>
        <td style="border: 1.5px solid #000; padding: 4px 6px;">${item.remarks}</td>
        <td style="border: 1.5px solid #000; padding: 4px 6px;">${item.lokasi}</td>
        <td style="border: 1.5px solid #000; padding: 4px 6px; text-align:right;">${formatNumber(item.total)}</td>
      </tr>
    `;
  });

  const firstItem = po.items[0] || {};
  const headerPt = firstItem.headerPt && firstItem.headerPt !== '-' ? firstItem.headerPt : tokoProfile.nama;
  const subHeader = firstItem.subHeader && firstItem.subHeader !== '-' ? firstItem.subHeader : 'Logistik AAIJ';
  const headerAlamat = firstItem.headerAlamat && firstItem.headerAlamat !== '-' ? firstItem.headerAlamat : tokoProfile.alamat;
  const headerTelp = firstItem.headerTelp && firstItem.headerTelp !== '-' ? firstItem.headerTelp : tokoProfile.telp;
  const headerNpwp = firstItem.headerNpwp && firstItem.headerNpwp !== '-' ? firstItem.headerNpwp : '01.334.523.5.234.3';
  
  const fontSize = tokoProfile.fontSize || '11pt';

  container.innerHTML = `
    <div class="po-paper" style="font-size: ${fontSize};">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px;">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          ${tokoProfile.logo ? `<img src="${tokoProfile.logo}" alt="Logo" style="max-height: 45px; max-width: 100px; object-fit: contain;">` : ''}
          <div>
            <h3 style="font-size: 1.15rem; font-weight: bold; margin: 0 0 2px 0;">${headerPt}</h3>
            <p style="margin: 1px 0; font-size: 0.82rem;"><b>${subHeader}</b></p>
            <p style="margin: 1px 0; font-size: 0.8rem;">${headerAlamat}</p>
            <p style="margin: 1px 0; font-size: 0.8rem;">Telp: ${headerTelp} | Fax: - | No. NPWP: ${headerNpwp}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 1.3rem; font-weight: bold; text-decoration: underline; margin: 0 0 4px 0;">PURCHASE ORDER</h2>
          <div style="font-size: 0.8rem; line-height: 1.3; text-align: right;">
            <b>PO NO :</b> ${po.kodePO || '-'}<br>
            <b>Date :</b> ${formatDateToID(po.tglInvoice)}<br>
            <b>Doc. Code :</b> ${po.docCode || '-'}<br>
            <b>Project Code :</b> ${po.projectCode || '-'}
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 0.8rem; border: 1.5px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9; font-weight: bold; border-bottom: 1.5px solid #000;">
            <th style="width: 45%; border-right: 1.5px solid #000; padding: 4px 6px; text-align: left;">VENDOR</th>
            <th style="width: 25%; border-right: 1.5px solid #000; padding: 4px 6px; text-align: left;">DOC. REFF</th>
            <th style="width: 30%; padding: 4px 6px; text-align: left;">SHIPMENT SCHEDULE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border-right: 1.5px solid #000; padding: 6px; vertical-align: top; line-height: 1.3;">
              <b style="font-size: 0.85rem; text-transform: uppercase;">${po.supplierNamaPT}</b><br>
              <b>Attn :</b> ${po.supplierAttn || '-'}&nbsp;|&nbsp;<b>Telp :</b> ${po.supplierTelp || '-'}<br>
              <b>Email :</b> ${po.supplierEmail || '-'}&nbsp;|&nbsp;<b>NPWP :</b> ${po.supplierNpwp || '-'}<br>
              <b>Alamat :</b> ${po.supplierAlamat || '-'}
            </td>
            <td style="border-right: 1.5px solid #000; padding: 6px; vertical-align: top; line-height: 1.3;">
              <b>RE :</b> ${po.reff || '-'}<br>
              <b>TOP :</b> ${po.top || 0} Hari<br>
              <small style="color: #475569; display: block; margin-top: 2px;">AFTER GOODS, INVOICE RECEIVED & APPROVED BY FINANCE.</small>
            </td>
            <td style="padding: 6px; vertical-align: top; line-height: 1.3;">
              <b>Due Date:</b> ${po.tglJatuhTempo || '-'}<br>
              <div style="font-size: 0.75rem; font-weight: bold;">${po.projectDesc || '-'}</div>
              <b>Pemesan:</b> ${adminCreds.username.toUpperCase()}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="table-responsive" style="margin-top: 8px;">
        <table class="po-table" style="border: 1.5px solid #000; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1.5px solid #000; width: 5%; padding: 4px 6px; text-align: center;">No</th>
              <th style="border: 1.5px solid #000; width: 25%; padding: 4px 6px; text-align: left;">Nama Barang</th>
              <th style="border: 1.5px solid #000; width: 8%; padding: 4px 6px; text-align: center;">Satuan</th>
              <th style="border: 1.5px solid #000; width: 7%; padding: 4px 6px; text-align: center;">Qty</th>
              <th style="border: 1.5px solid #000; width: 15%; padding: 4px 6px; text-align: right;">Harga Satuan</th>
              <th style="border: 1.5px solid #000; width: 15%; padding: 4px 6px; text-align: left;">Remarks</th>
              <th style="border: 1.5px solid #000; width: 15%; padding: 4px 6px; text-align: left;">Lokasi Pengiriman</th>
              <th style="border: 1.5px solid #000; width: 10%; padding: 4px 6px; text-align: right;">Total Harga</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
        <div style="flex: 1.3;">
          <div style="background: #e2e8f0; font-weight: bold; font-size: 0.7rem; padding: 3px 6px; border: 1.5px solid #000; border-bottom: none;">
            Notes
          </div>
          <div style="border: 1.5px solid #000; padding: 6px; font-size: 0.7rem; line-height: 1.3;">
            * Upon this PO acceptance, please return a signed copy by fax to 0254 - 570666;<br>
            * Goods Received not comply with PO specification will be returned;<br>
            * Ask for Good Receiving Note when goods or services accepted;<br>
            * All commercial invoices to be addressed to Head Office Cilegon;<br>
            * Invoices will be recognized if completed with stamp, stamped & Signed PO copy.
          </div>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; border: 1.5px solid #000;">
            <tr>
              <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; font-weight: bold;">SUBTOTAL I :</td>
              <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; text-align: right;">${formatNumber(po.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; font-weight: bold;">DISCOUNT :</td>
              <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; text-align: right;">${formatNumber(po.discVal)}</td>
            </tr>
            <tr>
              <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; font-weight: bold;">SUBTOTAL II :</td>
              <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; text-align: right;">${formatNumber(po.dpp)}</td>
            </tr>
            <tr>
              <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; font-weight: bold;">VAT ${po.ppnPercent} % :</td>
              <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; text-align: right;">${formatNumber(po.ppn)}</td>
            </tr>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td style="padding: 4px 6px;">TOTAL :</td>
              <td style="padding: 4px 6px; text-align: right;">${formatNumber(po.total)}</td>
            </tr>
          </table>

          <div style="border: 1.5px solid #000; padding: 5px 8px; background: #fff;">
            <span style="font-weight: bold; font-style: italic; font-size: 0.7rem; display: block;">Terbilang :</span>
            <span style="font-weight: bold; font-size: 0.75rem; text-transform: capitalize;">${po.terbilang}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 8px; border: 1.5px solid #000; padding: 4px 8px; font-size: 0.65srem; text-align: center; background: #f8fafc;">
        In Order to realize Good Corporate Governance (GCG), We prohibit anyone dealing with our employees, give or receive compensation in any form.
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 0.75rem; border: 1.5px solid #000; border-top: none;">
        <thead>
          <tr style="background-color: #cbd5e1; font-weight: bold; text-align: center;">
            <th style="width: 33.33%; border-right: 1.5px solid #000; padding: 4px; border-bottom: 1.5px solid #000;">Vendor Approval</th>
            <th style="width: 33.33%; border-right: 1.5px solid #000; padding: 4px; border-bottom: 1.5px solid #000;">Approved By</th>
            <th style="width: 33.33%; padding: 4px; border-bottom: 1.5px solid #000;">Prepared By</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border-right: 1.5px solid #000; padding: 6px; vertical-align: bottom; height: 75px;">
              <div style="margin-top: 45px; border-top: 1px solid #000; padding-top: 1px; font-size: 0.7rem;">Date :</div>
            </td>
            <td style="border-right: 1.5px solid #000; padding: 6px; vertical-align: bottom; height: 75px;">
              <div style="margin-top: 45px; border-top: 1px solid #000; padding-top: 1px; font-size: 0.7rem;">Date :</div>
            </td>
            <td style="padding: 6px; vertical-align: bottom; height: 75px;">
              <div style="margin-top: 45px; border-top: 1px solid #000; padding-top: 1px; font-size: 0.7rem;">Date :</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  showTab('detailLaporanTab');
}

function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

function terbilang(angka) {
  const bil = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  angka = Math.floor(angka);
  if (angka < 12) return bil[angka];
  if (angka < 20) return terbilang(angka - 10) + " Belas";
  if (angka < 100) return terbilang(Math.floor(angka / 10)) + " Puluh " + bil[angka % 10];
  if (angka < 200) return "Seratus " + terbilang(angka - 100);
  if (angka < 1000) return terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
  if (angka < 2000) return "Seribu " + terbilang(angka - 1000);
  if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000);
  if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000);
  return "";
}

function resetDateFilter() {
  document.getElementById('filterSupplierSelect').value = '';
  document.getElementById('filterStartDate').value = '';
  document.getElementById('filterEndDate').value = '';
  renderLaporanTable();
}function resetDateFilter() {
  document.getElementById('filterSupplierSelect').value = '';
  document.getElementById('filterStartDate').value = '';
  document.getElementById('filterEndDate').value = '';
  renderLaporanTable();
  closeForm('filterCollapsibleBox', 'filterToggleIcon'); // Otomatis tutup
}

function printLaporanByDateRange() {
  const filterSup = document.getElementById('filterSupplierSelect').value;
  const startDate = document.getElementById('filterStartDate').value;
  const endDate = document.getElementById('filterEndDate').value;

  const filtered = savedPOs.filter(po => {
    if (filterSup && po.supplierNamaPT !== filterSup) return false;
    if (startDate || endDate) {
      const poDate = po.tglInvoice;
      if (!poDate) return false;
      if (startDate && poDate < startDate) return false;
      if (endDate && poDate > endDate) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    alert("Tidak ada data Purchase Order pada rentang tanggal/filter tersebut.");
    return;
  }

  // Tutup otomatis kotak filter setelah tombol cetak diklik
  closeForm('filterCollapsibleBox', 'filterToggleIcon');

  const container = document.getElementById('printAreaContainer');
  let combinedHtml = '';
  const fontSize = tokoProfile.fontSize || '11pt';

  filtered.forEach((po, index) => {
    let itemsHtml = '';
    po.items.forEach((item, i) => {
      itemsHtml += `
        <tr>
          <td style="border: 1.5px solid #000; padding: 4px 6px; text-align:center;">${i + 1}</td>
          <td style="border: 1.5px solid #000; padding: 4px 6px;">${item.namaBarang}</td>
          <td style="border: 1.5px solid #000; padding: 4px 6px; text-align:center;">${item.satuan}</td>
          <td style="border: 1.5px solid #000; padding: 4px 6px; text-align:center;">${item.qty}</td>
          <td style="border: 1.5px solid #000; padding: 4px 6px; text-align:right;">${formatNumber(item.harga)}</td>
          <td style="border: 1.5px solid #000; padding: 4px 6px;">${item.remarks}</td>
          <td style="border: 1.5px solid #000; padding: 4px 6px;">${item.lokasi}</td>
          <td style="border: 1.5px solid #000; padding: 4px 6px; text-align:right;">${formatNumber(item.total)}</td>
        </tr>
      `;
    });

    const firstItem = po.items[0] || {};
    const headerPt = firstItem.headerPt && firstItem.headerPt !== '-' ? firstItem.headerPt : tokoProfile.nama;
    const subHeader = firstItem.subHeader && firstItem.subHeader !== '-' ? firstItem.subHeader : 'Logistik AAIJ';
    const headerAlamat = firstItem.headerAlamat && firstItem.headerAlamat !== '-' ? firstItem.headerAlamat : tokoProfile.alamat;
    const headerTelp = firstItem.headerTelp && firstItem.headerTelp !== '-' ? firstItem.headerTelp : tokoProfile.telp;
    const headerNpwp = firstItem.headerNpwp && firstItem.headerNpwp !== '-' ? firstItem.headerNpwp : '01.334.523.5.234.3';

    const pageBreakStyle = index > 0 ? "page-break-before: always; margin-top: 10px;" : "";

    combinedHtml += `
      <div class="po-paper" style="${pageBreakStyle} font-size: ${fontSize};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px;">
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            ${tokoProfile.logo ? `<img src="${tokoProfile.logo}" alt="Logo" style="max-height: 45px; max-width: 100px; object-fit: contain;">` : ''}
            <div>
              <h3 style="font-size: 1.15rem; font-weight: bold; margin: 0 0 2px 0;">${headerPt}</h3>
              <p style="margin: 1px 0; font-size: 0.82rem;"><b>${subHeader}</b></p>
              <p style="margin: 1px 0; font-size: 0.8rem;">${headerAlamat}</p>
              <p style="margin: 1px 0; font-size: 0.8rem;">Telp: ${headerTelp} | Fax: - | No. NPWP: ${headerNpwp}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 1.3rem; font-weight: bold; text-decoration: underline; margin: 0 0 4px 0;">PURCHASE ORDER</h2>
            <div style="font-size: 0.8rem; line-height: 1.3; text-align: right;">
              <b>PO NO :</b> ${po.kodePO || '-'}<br>
              <b>Date :</b> ${formatDateToID(po.tglInvoice)}<br>
              <b>Doc. Code :</b> ${po.docCode || '-'}<br>
              <b>Project Code :</b> ${po.projectCode || '-'}
            </div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 0.8rem; border: 1.5px solid #000;">
          <thead>
            <tr style="background-color: #f1f5f9; font-weight: bold; border-bottom: 1.5px solid #000;">
              <th style="width: 45%; border-right: 1.5px solid #000; padding: 4px 6px; text-align: left;">VENDOR</th>
              <th style="width: 25%; border-right: 1.5px solid #000; padding: 4px 6px; text-align: left;">DOC. REFF</th>
              <th style="width: 30%; padding: 4px 6px; text-align: left;">SHIPMENT SCHEDULE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border-right: 1.5px solid #000; padding: 6px; vertical-align: top; line-height: 1.3;">
                <b style="font-size: 0.85rem; text-transform: uppercase;">${po.supplierNamaPT}</b><br>
                <b>Attn :</b> ${po.supplierAttn || '-'}&nbsp;|&nbsp;<b>Telp :</b> ${po.supplierTelp || '-'}<br>
                <b>Email :</b> ${po.supplierEmail || '-'}&nbsp;|&nbsp;<b>NPWP :</b> ${po.supplierNpwp || '-'}<br>
                <b>Alamat :</b> ${po.supplierAlamat || '-'}
              </td>
              <td style="border-right: 1.5px solid #000; padding: 6px; vertical-align: top; line-height: 1.3;">
                <b>RE :</b> ${po.reff || '-'}<br>
                <b>TOP :</b> ${po.top || 0} Hari<br>
                <small style="color: #475569; display: block; margin-top: 2px;">AFTER GOODS, INVOICE RECEIVED & APPROVED BY FINANCE.</small>
              </td>
              <td style="padding: 6px; vertical-align: top; line-height: 1.3;">
                <b>Due Date:</b> ${po.tglJatuhTempo || '-'}<br>
                <div style="font-size: 0.75rem; font-weight: bold;">${po.projectDesc || '-'}</div>
                <b>Pemesan:</b> ${adminCreds.username.toUpperCase()}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="table-responsive" style="margin-top: 8px;">
          <table class="po-table" style="border: 1.5px solid #000; width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="border: 1.5px solid #000; width: 5%; padding: 4px 6px; text-align: center;">No</th>
                <th style="border: 1.5px solid #000; width: 25%; padding: 4px 6px; text-align: left;">Nama Barang</th>
                <th style="border: 1.5px solid #000; width: 8%; padding: 4px 6px; text-align: center;">Satuan</th>
                <th style="border: 1.5px solid #000; width: 7%; padding: 4px 6px; text-align: center;">Qty</th>
                <th style="border: 1.5px solid #000; width: 15%; padding: 4px 6px; text-align: right;">Harga Satuan</th>
                <th style="border: 1.5px solid #000; width: 15%; padding: 4px 6px; text-align: left;">Remarks</th>
                <th style="border: 1.5px solid #000; width: 15%; padding: 4px 6px; text-align: left;">Lokasi Pengiriman</th>
                <th style="border: 1.5px solid #000; width: 10%; padding: 4px 6px; text-align: right;">Total Harga</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
          <div style="flex: 1.3;">
            <div style="background: #e2e8f0; font-weight: bold; font-size: 0.7rem; padding: 3px 6px; border: 1.5px solid #000; border-bottom: none;">
              Notes
            </div>
            <div style="border: 1.5px solid #000; padding: 6px; font-size: 0.7rem; line-height: 1.3;">
              * Upon this PO acceptance, please return a signed copy by fax to 0254 - 570666;<br>
              * Goods Received not comply with PO specification will be returned;<br>
              * Ask for Good Receiving Note when goods or services accepted;<br>
              * All commercial invoices to be addressed to Head Office Cilegon;<br>
              * Invoices will be recognized if completed with stamp, stamped & Signed PO copy.
            </div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; border: 1.5px solid #000;">
              <tr>
                <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; font-weight: bold;">SUBTOTAL I :</td>
                <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; text-align: right;">${formatNumber(po.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; font-weight: bold;">DISCOUNT :</td>
                <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; text-align: right;">${formatNumber(po.discVal)}</td>
              </tr>
              <tr>
                <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; font-weight: bold;">SUBTOTAL II :</td>
                <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; text-align: right;">${formatNumber(po.dpp)}</td>
              </tr>
              <tr>
                <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; font-weight: bold;">VAT ${po.ppnPercent} % :</td>
                <td style="padding: 3px 6px; border-bottom: 1px solid #ccc; text-align: right;">${formatNumber(po.ppn)}</td>
              </tr>
              <tr style="background: #f1f5f9; font-weight: bold;">
                <td style="padding: 4px 6px;">TOTAL :</td>
                <td style="padding: 4px 6px; text-align: right;">${formatNumber(po.total)}</td>
              </tr>
            </table>

            <div style="border: 1.5px solid #000; padding: 5px 8px; background: #fff;">
              <span style="font-weight: bold; font-style: italic; font-size: 0.7rem; display: block;">Terbilang :</span>
              <span style="font-weight: bold; font-size: 0.75rem; text-transform: capitalize;">${po.terbilang}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 8px; border: 1.5px solid #000; padding: 4px 8px; font-size: 0.65rem; text-align: center; background: #f8fafc;">
          In Order to realize Good Corporate Governance (GCG), We prohibit anyone dealing with our employees, give or receive compensation in any form.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 0.75rem; border: 1.5px solid #000; border-top: none;">
          <thead>
            <tr style="background-color: #cbd5e1; font-weight: bold; text-align: center;">
              <th style="width: 33.33%; border-right: 1.5px solid #000; padding: 4px; border-bottom: 1.5px solid #000;">Vendor Approval</th>
              <th style="width: 33.33%; border-right: 1.5px solid #000; padding: 4px; border-bottom: 1.5px solid #000;">Approved By</th>
              <th style="width: 33.33%; padding: 4px; border-bottom: 1.5px solid #000;">Prepared By</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border-right: 1.5px solid #000; padding: 6px; vertical-align: bottom; height: 75px;">
                <div style="margin-top: 45px; border-top: 1px solid #000; padding-top: 1px; font-size: 0.7rem;">Date :</div>
              </td>
              <td style="border-right: 1.5px solid #000; padding: 6px; vertical-align: bottom; height: 75px;">
                <div style="margin-top: 45px; border-top: 1px solid #000; padding-top: 1px; font-size: 0.7rem;">Date :</div>
              </td>
              <td style="padding: 6px; vertical-align: bottom; height: 75px;">
                <div style="margin-top: 45px; border-top: 1px solid #000; padding-top: 1px; font-size: 0.7rem;">Date :</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  });

  container.innerHTML = combinedHtml;
  showTab('detailLaporanTab');
  setTimeout(() => {
    window.print();
  }, 300);
}

function handleNavClick(tabId) {
  showTab(tabId);
  
  const navLinks = document.getElementById('navLinks');
  if (navLinks && navLinks.classList.contains('show')) {
    navLinks.classList.remove('show');
  }
}