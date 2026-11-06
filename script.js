/* ==========================================
   FILENAME: script.js
   ========================================== */

// --- INITIAL DATABASE IN LOCALSTORAGE ---
const defaultData = {
  user: { username: "Admin", password: "12345", avatar: "https://via.placeholder.com/150" },
  store: { name: "Toko Sembako Berkah", phone: "08123456789", address: "Jl. Pasar Anyar No. 45", footer: "Terima kasih atas kunjungan Anda!" },
  barang: [],
  transaksi: [],
  pengeluaran: [],
  session: false
};

let tempAvatarBase64 = null;

function getData() {
  const data = localStorage.getItem("SEMBAKO_APP_DATA");
  return data ? JSON.parse(data) : defaultData;
}

function saveData(data) {
  localStorage.setItem("SEMBAKO_APP_DATA", JSON.stringify(data));
}

let cart = [];
let editingNota = null;

// --- UTILS ---
function formatRupiah(number) {
  return "Rp " + Number(number).toLocaleString("id-ID");
}

function getFormattedDateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${hours}.${minutes}-${day}/${month}/${year}`;
}

// --- TOGGLE SIDEBAR SLIDE OFF-CANVAS MOBILE ---
function toggleSidebar() {
  const sidebar = document.getElementById("sidebarMenu");
  const overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.toggle("show");
  overlay.classList.toggle("show");
}

// --- TOGGLE NOTIFIKASI DROPDOWN ---
function toggleNotificationDropdown() {
  const dropdown = document.getElementById("notifDropdown");
  dropdown.classList.toggle("hidden");
}

window.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.notification-wrapper');
  const dropdown = document.getElementById('notifDropdown');
  if (wrapper && dropdown && !wrapper.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

// --- CEK EXPIRED 15 HARI & UPDATE BADGE NOTIFIKASI ---
function checkExpiredNotifications() {
  const db = getData();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let expiredItems = [];

  db.barang.forEach(b => {
    if (b.expired) {
      const expDate = new Date(b.expired);
      expDate.setHours(0, 0, 0, 0);
      
      const diffTime = expDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        expiredItems.push({ kode: b.kode, nama: b.nama, status: 'expired', text: 'Sudah Kedaluwarsa!' });
      } else if (diffDays <= 15) {
        expiredItems.push({ kode: b.kode, nama: b.nama, status: 'warning', text: `Segera Kedaluwarsa (${diffDays} hari lagi)` });
      }
    }
  });

  const badge = document.getElementById("notifBadge");
  const contentList = document.getElementById("notifContentList");

  if (expiredItems.length > 0) {
    badge.innerText = expiredItems.length;
    badge.classList.remove("hidden");

    contentList.innerHTML = expiredItems.map(item => `
      <div class="notif-item ${item.status === 'expired' ? 'expired' : ''}" onclick="clickNotifItem('${item.kode}')">
        <strong>${item.nama} (${item.kode})</strong>
        <small>${item.text}</small>
      </div>
    `).join("");
  } else {
    badge.classList.add("hidden");
    contentList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 10px;">Tidak ada produk kedaluwarsa</p>`;
  }
}

// --- FUNGSI KETIKA NOTIFIKASI DIKLIK ---
function clickNotifItem(kode) {
  document.getElementById("notifDropdown").classList.add("hidden");
  switchPage('barang');

  setTimeout(() => {
    const rows = document.querySelectorAll("#barangTableBody tr");
    rows.forEach(row => {
      if (row.innerHTML.includes(kode)) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, 150);
}

// --- INIT APP ---
window.onload = function() {
  const data = getData();
  if (data.session) {
    showAppScreen();
  } else {
    showLoginScreen();
  }
};

// --- AUTH SYSTEM ---
document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const u = document.getElementById("loginUsername").value;
  const p = document.getElementById("loginPassword").value;
  const db = getData();

  if (u === db.user.username && p === db.user.password) {
    db.session = true;
    saveData(db);
    showAppScreen();
  } else {
    alert("Username atau Password salah! Silahkan Coba Lagi");
  }
});

function logout() {
  const db = getData();
  db.session = false;
  saveData(db);
  showLoginScreen();
}

function showLoginScreen() {
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("appScreen").classList.add("hidden");
}

function showAppScreen() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");
  loadAppHeader();
  renderBarangTable();
  renderRiwayatTable();
  renderPengeluaranTable();
  generateReport();
  checkExpiredNotifications();
}

function loadAppHeader() {
  const db = getData();
  document.getElementById("storeTitleDisplay").innerText = db.store.name;
  document.getElementById("storeSubDisplay").innerText = db.store.address;
  document.getElementById("headerUsername").innerText = db.user.username;
  
  const avatarUrl = db.user.avatar || "https://via.placeholder.com/150";
  document.getElementById("headerAvatar").src = avatarUrl;
  
  document.getElementById("profUsername").value = db.user.username;
  document.getElementById("profAvatarPreview").src = avatarUrl;
  
  document.getElementById("storeName").value = db.store.name;
  document.getElementById("storePhone").value = db.store.phone;
  document.getElementById("storeAddress").value = db.store.address;
  document.getElementById("storeFooter").value = db.store.footer;
}

// --- NAVIGATION ---
function switchPage(pageId) {
  document.querySelectorAll(".page-view").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".sidebar-menu a").forEach(el => el.classList.remove("active"));
  
  document.getElementById(`page-${pageId}`).classList.remove("hidden");
  document.getElementById(`menu-${pageId}`).classList.add("active");

  if(window.innerWidth <= 768) {
    document.getElementById("sidebarMenu").classList.remove("show");
    document.getElementById("sidebarOverlay").classList.remove("show");
  }

  if(pageId === 'barang') renderBarangTable();
  if(pageId === 'riwayat-transaksi') renderRiwayatTable();
  if(pageId === 'pengeluaran') renderPengeluaranTable();
  if(pageId === 'laporan') generateReport();
  if(pageId === 'transaksi') {
    setTimeout(() => {
      const scanInput = document.getElementById("barcodeScannerInput");
      if(scanInput) scanInput.focus();
    }, 100);
  }
}

// --- PROFIL & TOKO ---
function previewProfileImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      tempAvatarBase64 = e.target.result;
      document.getElementById("profAvatarPreview").src = tempAvatarBase64;
    };
    reader.readAsDataURL(file);
  }
}

function handleProfileSubmit(e) {
  e.preventDefault();
  const db = getData();
  db.user.username = document.getElementById("profUsername").value;
  
  if (tempAvatarBase64) {
    db.user.avatar = tempAvatarBase64;
  }
  
  const newPass = document.getElementById("profPassword").value;
  if(newPass.trim() !== "") db.user.password = newPass;
  
  saveData(db);
  loadAppHeader();
  alert("Profil berhasil diperbarui!");
}

function handleStoreSubmit(e) {
  e.preventDefault();
  const db = getData();
  db.store.name = document.getElementById("storeName").value;
  db.store.phone = document.getElementById("storePhone").value;
  db.store.address = document.getElementById("storeAddress").value;
  db.store.footer = document.getElementById("storeFooter").value;
  
  saveData(db);
  loadAppHeader();
  alert("Setting Toko berhasil diperbarui!");
}

// --- BARANG ---
function handleBarangSubmit(e) {
  e.preventDefault();
  const db = getData();
  const editKode = document.getElementById("editBarangKode").value;

  const itemData = {
    kode: document.getElementById("barKode").value.trim(),
    barcode: document.getElementById("barBarcode").value.trim() || document.getElementById("barKode").value.trim(),
    nama: document.getElementById("barNama").value.trim(),
    satuan: document.getElementById("barSatuan").value.trim(),
    modal: Number(document.getElementById("barHargaModal").value),
    jual: Number(document.getElementById("barHargaJual").value),
    stok: Number(document.getElementById("barStok").value),
    expired: document.getElementById("barExpired").value,
    terjual: 0,
    tgl: getFormattedDateTime()
  };

  if(editKode) {
    const idx = db.barang.findIndex(b => b.kode === editKode);
    if(idx !== -1) {
      itemData.terjual = db.barang[idx].terjual;
      itemData.tgl = db.barang[idx].tgl;
      db.barang[idx] = itemData;
    }
  } else {
    if(db.barang.some(b => b.kode === itemData.kode)) return alert("Kode Barang sudah ada!");
    db.barang.push(itemData);
  }

  saveData(db);
  resetBarangForm();
  renderBarangTable();
  checkExpiredNotifications();
  
  document.getElementById("barangDetails").removeAttribute("open");
  alert("Data barang disimpan!");
}

function resetBarangForm() {
  document.getElementById("editBarangKode").value = "";
  document.getElementById("barangForm").reset();
  document.getElementById("formBarangTitle").innerHTML = `<span>➕ Tambah Data Barang</span><span style="font-size: 0.85rem; color: var(--text-muted); font-weight: normal;">(Klik untuk buka/tutup)</span>`;
  document.getElementById("cancelEditBarBtn").classList.add("hidden");
  document.getElementById("barKode").removeAttribute("readonly");
}

function renderBarangTable() {
  const db = getData();
  const tbody = document.getElementById("barangTableBody");
  const searchVal = document.getElementById("searchBarangInput") ? document.getElementById("searchBarangInput").value.toLowerCase() : "";
  const today = new Date();
  today.setHours(0,0,0,0);

  // Filter data berdasarkan Kode, Barcode, atau Nama Barang
  const filteredBarang = db.barang.filter(b => 
    b.kode.toLowerCase().includes(searchVal) || 
    (b.barcode && b.barcode.toLowerCase().includes(searchVal)) || 
    b.nama.toLowerCase().includes(searchVal)
  );

  tbody.innerHTML = filteredBarang.map((b, i) => {
    let expiredClass = "";
    let formattedExp = "-";

    if (b.expired) {
      const expDate = new Date(b.expired);
      expDate.setHours(0,0,0,0);
      
      const parts = b.expired.split("-");
      if (parts.length === 3) {
        formattedExp = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else {
        formattedExp = b.expired;
      }

      const diffTime = expDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 15) {
        expiredClass = "expired-highlight-cell";
      }
    }

    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${b.kode}</strong></td>
        <td><code>${b.barcode || b.kode}</code></td>
        <td>${b.nama}</td>
        <td>${b.stok}</td>
        <td>${b.terjual}</td>
        <td>${b.satuan}</td>
        <td>${formatRupiah(b.modal)}</td>
        <td>${formatRupiah(b.jual)}</td>
        <td><small>${b.tgl}</small></td>
        <td class="${expiredClass}">${formattedExp}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="openStokModal('${b.kode}')">+ Stok</button>
            <button class="btn btn-sm btn-warning" onclick="editBarang('${b.kode}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteBarang('${b.kode}')">Hapus</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function editBarang(kode) {
  const db = getData();
  const b = db.barang.find(item => item.kode === kode);
  if(!b) return;

  document.getElementById("editBarangKode").value = b.kode;
  document.getElementById("barKode").value = b.kode;
  document.getElementById("barKode").setAttribute("readonly", true);
  document.getElementById("barBarcode").value = b.barcode || "";
  document.getElementById("barNama").value = b.nama;
  document.getElementById("barSatuan").value = b.satuan;
  document.getElementById("barHargaModal").value = b.modal;
  document.getElementById("barHargaJual").value = b.jual;
  document.getElementById("barStok").value = b.stok;
  document.getElementById("barExpired").value = b.expired || "";

  document.getElementById("formBarangTitle").innerHTML = `<span>✏️ Edit Data Barang: ${b.kode}</span>`;
  document.getElementById("cancelEditBarBtn").classList.remove("hidden");
  
  document.getElementById("barangDetails").setAttribute("open", "true");
}

function deleteBarang(kode) {
  if(!confirm("Yakin hapus barang ini?")) return;
  const db = getData();
  db.barang = db.barang.filter(b => b.kode !== kode);
  saveData(db);
  renderBarangTable();
  checkExpiredNotifications();
}

function openStokModal(kode) {
  const db = getData();
  const b = db.barang.find(i => i.kode === kode);
  if(!b) return;
  document.getElementById("stokKodeTarget").value = b.kode;
  document.getElementById("stokNamaTarget").innerText = `Barang: ${b.nama} (Stok Saat Ini: ${b.stok})`;
  document.getElementById("stokModal").style.display = "flex";
}
function closeStokModal() { document.getElementById("stokModal").style.display = "none"; }
function confirmAddStok() {
  const kode = document.getElementById("stokKodeTarget").value;
  const qty = Number(document.getElementById("stokJumlahInput").value);
  if(qty <= 0) return;
  
  const db = getData();
  const b = db.barang.find(i => i.kode === kode);
  if(b) {
    b.stok += qty;
    saveData(db);
    renderBarangTable();
    closeStokModal();
    alert("Stok berhasil ditambahkan!");
  }
}

// --- KASIR TRANSAKSI & BARCODE SCANNER ---
function handleBarcodeScan(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const inputEl = document.getElementById("barcodeScannerInput");
    const query = inputEl.value.trim().toLowerCase();
    if (!query) return;

    const db = getData();
    const foundItem = db.barang.find(b => 
      (b.barcode && b.barcode.toLowerCase() === query) || 
      b.kode.toLowerCase() === query || 
      b.nama.toLowerCase() === query
    );

    if (foundItem) {
      addToCart(foundItem.kode);
      inputEl.value = "";
    } else {
      alert("Barang dengan Barcode/Kode tersebut tidak ditemukan!");
      inputEl.select();
    }
  }
}

function openSearchModal() {
  document.getElementById("searchModal").style.display = "flex";
  renderModalItemList();
}
function closeSearchModal() { document.getElementById("searchModal").style.display = "none"; }

function renderModalItemList() {
  const q = document.getElementById("modalSearchInput").value.toLowerCase();
  const db = getData();
  const filtered = db.barang.filter(b => 
    b.kode.toLowerCase().includes(q) || 
    (b.barcode && b.barcode.toLowerCase().includes(q)) || 
    b.nama.toLowerCase().includes(q)
  );
  
  document.getElementById("modalItemTableBody").innerHTML = filtered.map(b => `
    <tr>
      <td>${b.kode}</td>
      <td><code>${b.barcode || b.kode}</code></td>
      <td>${b.nama}</td>
      <td>${b.stok}</td>
      <td>${formatRupiah(b.jual)}</td>
      <td><button class="btn btn-sm btn-success" onclick="addToCart('${b.kode}')">Pilih</button></td>
    </tr>
  `).join("");
}

function addToCart(kode) {
  const db = getData();
  const b = db.barang.find(i => i.kode === kode);
  if(!b || b.stok <= 0) return alert("Stok habis atau barang tidak ditemukan!");

  const exist = cart.find(c => c.kode === kode);
  if(exist) {
    if(exist.qty + 1 > b.stok) return alert("Stok tidak mencukupi!");
    exist.qty += 1;
  } else {
    cart.push({ kode: b.kode, barcode: b.barcode || b.kode, nama: b.nama, satuan: b.satuan, harga: b.jual, modal: b.modal, qty: 1 });
  }

  renderCartTable();
  closeSearchModal();

  const scanInput = document.getElementById("barcodeScannerInput");
  if(scanInput) {
    scanInput.focus();
    scanInput.select();
  }
}

function updateCartQty(kode, delta) {
  const db = getData();
  const b = db.barang.find(i => i.kode === kode);
  const item = cart.find(c => c.kode === kode);
  if(!item) return;

  if(delta > 0 && item.qty + delta > b.stok) return alert("Stok tidak mencukupi!");
  item.qty += delta;
  if(item.qty <= 0) cart = cart.filter(c => c.kode !== kode);
  renderCartTable();
}

function removeFromCart(kode) {
  cart = cart.filter(c => c.kode !== kode);
  renderCartTable();
}

function resetCart() {
  cart = [];
  editingNota = null;
  
  document.getElementById("pelangganToggle").checked = false;
  const cPelanggan = document.getElementById("cartPelanggan");
  cPelanggan.value = "Umum";
  cPelanggan.readOnly = true;

  document.getElementById("diskonToggle").checked = false;
  const cDiskon = document.getElementById("cartDiskonPercent");
  cDiskon.value = "0";
  cDiskon.readOnly = true;

  document.getElementById("potonganToggle").checked = false;
  const cPotongan = document.getElementById("cartPotongan");
  cPotongan.value = "0";
  cPotongan.readOnly = true;

  document.getElementById("cartDibayar").value = "0";
  renderCartTable();
}

function toggleInputState(type) {
  if (type === 'pelanggan') {
    const isChecked = document.getElementById("pelangganToggle").checked;
    const inputEl = document.getElementById("cartPelanggan");
    inputEl.readOnly = !isChecked;
    if (!isChecked) {
      inputEl.value = "Umum";
    }
  } else if (type === 'diskon') {
    const isChecked = document.getElementById("diskonToggle").checked;
    const inputEl = document.getElementById("cartDiskonPercent");
    inputEl.readOnly = !isChecked;
    if (!isChecked) {
      inputEl.value = "0";
    }
    calculateCartTotal();
  } else if (type === 'potongan') {
    const isChecked = document.getElementById("potonganToggle").checked;
    const inputEl = document.getElementById("cartPotongan");
    inputEl.readOnly = !isChecked;
    if (!isChecked) {
      inputEl.value = "0";
    }
    calculateCartTotal();
  }
}

function renderCartTable() {
  const tbody = document.getElementById("cartTableBody");
  tbody.innerHTML = cart.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.kode}</td>
      <td><code>${item.barcode}</code></td>
      <td>${item.nama}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="updateCartQty('${item.kode}', -1)">-</button>
        <strong>${item.qty}</strong>
        <button class="btn btn-sm btn-primary" onclick="updateCartQty('${item.kode}', 1)">+</button>
      </td>
      <td>${item.satuan}</td>
      <td>${formatRupiah(item.harga)}</td>
      <td>${formatRupiah(item.harga * item.qty)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="removeFromCart('${item.kode}')">Hapus</button></td>
    </tr>
  `).join("");
  calculateCartTotal();
}

function calculateCartTotal() {
  let subtotal = cart.reduce((acc, item) => acc + (item.harga * item.qty), 0);
  const diskonOn = document.getElementById("diskonToggle").checked;
  const diskonPercent = Number(document.getElementById("cartDiskonPercent").value) || 0;
  const potongan = Number(document.getElementById("cartPotongan").value) || 0;

  if (diskonOn && diskonPercent > 0) {
    subtotal -= (subtotal * (diskonPercent / 100));
  }
  subtotal = Math.max(0, subtotal - potongan);

  document.getElementById("cartSubtotal").value = formatRupiah(subtotal);

  const dibayar = Number(document.getElementById("cartDibayar").value) || 0;
  const kembalian = dibayar - subtotal;
  document.getElementById("cartKembalian").value = formatRupiah(kembalian > 0 ? kembalian : 0);

  return { subtotal, dibayar, kembalian };
}

function processTransaction(action) {
  if(cart.length === 0) return alert("Keranjang belanja kosong!");
  const { subtotal, dibayar, kembalian } = calculateCartTotal();
  if(dibayar < subtotal) return alert("Uang dibayar masih kurang!");

  const db = getData();
  const pelanggan = document.getElementById("cartPelanggan").value || "Umum";
  const totalQty = cart.reduce((acc, i) => acc + i.qty, 0);
  
  let totalModalTx = cart.reduce((acc, c) => {
    const b = db.barang.find(item => item.kode === c.kode);
    const modalSatuan = b ? b.modal : (c.modal || 0);
    return acc + (modalSatuan * c.qty);
  }, 0);

  if (editingNota) {
    const idx = db.transaksi.findIndex(t => t.nota === editingNota);
    if (idx !== -1) {
      db.transaksi[idx].pelanggan = pelanggan;
      db.transaksi[idx].items = [...cart];
      db.transaksi[idx].totalQty = totalQty;
      db.transaksi[idx].totalModal = totalModalTx;
      db.transaksi[idx].subtotal = subtotal;
      db.transaksi[idx].dibayar = dibayar;
      db.transaksi[idx].kembalian = kembalian;
    }
    alert("Perubahan Transaksi Berhasil Disimpan!");
  } else {
    const notaNo = "NT-" + Date.now().toString().slice(-6);
    cart.forEach(c => {
      const b = db.barang.find(item => item.kode === c.kode);
      if(b) {
        b.stok -= c.qty;
        b.terjual += c.qty;
      }
    });

    const txData = {
      nota: notaNo,
      tgl: getFormattedDateTime(),
      rawDate: new Date().toISOString(),
      pelanggan: pelanggan,
      items: [...cart],
      totalQty: totalQty,
      totalModal: totalModalTx,
      subtotal: subtotal,
      dibayar: dibayar,
      kembalian: kembalian
    };

    db.transaksi.push(txData);
    if(action === 'print') {
      printNota(txData);
    } else {
      alert("Transaksi Berhasil Disimpan!");
    }
  }

  saveData(db);
  resetCart();
  renderBarangTable();
  renderRiwayatTable();
  switchPage('riwayat-transaksi');
}

// --- RIWAYAT TRANSAKSI ---
function renderRiwayatTable() {
  const db = getData();
  const tbody = document.getElementById("riwayatTableBody");
  const searchVal = document.getElementById("searchRiwayatInput") ? document.getElementById("searchRiwayatInput").value.toLowerCase() : "";

  // Filter transaksi berdasarkan No Nota, Nama Pelanggan, atau Nama/Kode Barang di dalam item transaksi
  const filteredTx = db.transaksi.filter(t => {
    const matchHeader = t.nota.toLowerCase().includes(searchVal) || t.pelanggan.toLowerCase().includes(searchVal);
    const matchItems = t.items.some(item => 
      item.nama.toLowerCase().includes(searchVal) || 
      item.kode.toLowerCase().includes(searchVal) || 
      (item.barcode && item.barcode.toLowerCase().includes(searchVal))
    );
    return matchHeader || matchItems;
  });

  tbody.innerHTML = filteredTx.map((t, i) => {
    let tModal = t.totalModal;
    if (tModal === undefined) {
      tModal = t.items.reduce((acc, item) => {
        const b = db.barang.find(brg => brg.kode === item.kode);
        const m = b ? b.modal : (item.modal || 0);
        return acc + (m * item.qty);
      }, 0);
    }

    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${t.nota}</strong></td>
        <td>${t.tgl}</td>
        <td>${t.pelanggan}</td>
        <td>${t.totalQty}</td>
        <td>${formatRupiah(tModal)}</td>
        <td>${formatRupiah(t.subtotal)}</td>
        <td>${formatRupiah(t.dibayar)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="openTxBarang('${t.nota}')">Open</button>
            <button class="btn btn-sm btn-success" onclick='printNota(${JSON.stringify(t)})'>Cetak</button>
            <button class="btn btn-sm btn-warning" onclick='showTxDetail(${JSON.stringify(t)})'>Detail</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTx('${t.nota}')">Hapus</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function openTxBarang(nota) {
  const db = getData();
  const targetTx = db.transaksi.find(t => t.nota === nota);
  if (!targetTx) return alert("Data transaksi tidak ditemukan!");

  editingNota = targetTx.nota;
  switchPage('transaksi');

  cart = JSON.parse(JSON.stringify(targetTx.items));
  document.getElementById("cartPelanggan").value = targetTx.pelanggan || "Umum";
  document.getElementById("cartDibayar").value = targetTx.dibayar || 0;

  renderCartTable();
}

function showTxDetail(t) {
  const db = getData();
  let tModal = t.totalModal !== undefined ? t.totalModal : t.items.reduce((acc, item) => {
    const b = db.barang.find(brg => brg.kode === item.kode);
    const m = b ? b.modal : (item.modal || 0);
    return acc + (m * item.qty);
  }, 0);

  const content = `
    <p><strong>Nota:</strong> ${t.nota}</p>
    <p><strong>Tanggal:</strong> ${t.tgl}</p>
    <p><strong>Pelanggan:</strong> ${t.pelanggan}</p>
    <hr style="margin: 0.5rem 0;">
    <ul>
      ${t.items.map(i => `<li>${i.nama} x ${i.qty} ${i.satuan} = ${formatRupiah(i.harga * i.qty)}</li>`).join("")}
    </ul>
    <hr style="margin: 0.5rem 0;">
    <p><strong>Total Modal:</strong> ${formatRupiah(tModal)}</p>
    <p><strong>Subtotal:</strong> ${formatRupiah(t.subtotal)}</p>
    <p><strong>Dibayar:</strong> ${formatRupiah(t.dibayar)}</p>
    <p><strong>Kembalian:</strong> ${formatRupiah(t.kembalian)}</p>
  `;
  document.getElementById("detailTxContent").innerHTML = content;
  document.getElementById("detailModal").style.display = "flex";
}
function closeDetailModal() { document.getElementById("detailModal").style.display = "none"; }

function deleteTx(nota) {
  if(!confirm("Yakin hapus transaksi ini?")) return;
  const db = getData();
  db.transaksi = db.transaksi.filter(t => t.nota !== nota);
  saveData(db);
  renderRiwayatTable();
}

// --- PENGELUARAN ---
function calcPengJumlah() {
  const q = Number(document.getElementById("pengQty").value) || 0;
  const h = Number(document.getElementById("pengHarga").value) || 0;
  document.getElementById("pengJumlah").value = q * h;
}

function handlePengeluaranSubmit(e) {
  e.preventDefault();
  const db = getData();
  const editId = document.getElementById("editPengeluaranId").value;
  
  const pData = {
    id: editId ? Number(editId) : Date.now(),
    tgl: getFormattedDateTime(),
    rawDate: new Date().toISOString(),
    nama: document.getElementById("pengNama").value.trim(),
    qty: Number(document.getElementById("pengQty").value),
    harga: Number(document.getElementById("pengHarga").value),
    jumlah: Number(document.getElementById("pengJumlah").value)
  };

  if(editId) {
    const idx = db.pengeluaran.findIndex(p => p.id === pData.id);
    if(idx !== -1) db.pengeluaran[idx] = pData;
  } else {
    db.pengeluaran.push(pData);
  }

  saveData(db);
  resetPengeluaranForm();
  renderPengeluaranTable();
  
  document.getElementById("pengeluaranDetails").removeAttribute("open");
  alert("Pengeluaran disimpan!");
}

function resetPengeluaranForm() {
  document.getElementById("editPengeluaranId").value = "";
  document.getElementById("pengeluaranForm").reset();
  document.getElementById("formPengeluaranTitle").innerHTML = `<span>➕ Tambah Data Pengeluaran</span><span style="font-size: 0.85rem; color: var(--text-muted); font-weight: normal;">(Klik untuk buka/tutup)</span>`;
}

function renderPengeluaranTable() {
  const db = getData();
  const tbody = document.getElementById("pengeluaranTableBody");
  const searchVal = document.getElementById("searchPengeluaranInput") ? document.getElementById("searchPengeluaranInput").value.toLowerCase() : "";
  let totalBulanIni = 0;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter pengeluaran berdasarkan nama barang/pengeluaran
  const filteredPeng = db.pengeluaran.filter(p => p.nama.toLowerCase().includes(searchVal));

  tbody.innerHTML = filteredPeng.map((p, i) => {
    const pDate = new Date(p.rawDate || Date.now());
    if(pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
      totalBulanIni += p.jumlah;
    }

    return `
      <tr>
        <td>${i + 1}</td>
        <td>${p.tgl}</td>
        <td>${p.nama}</td>
        <td>${p.qty}</td>
        <td>${formatRupiah(p.harga)}</td>
        <td>${formatRupiah(p.jumlah)}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="editPengeluaran(${p.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deletePengeluaran(${p.id})">Hapus</button>
        </td>
      </tr>
    `;
  }).join("");

  document.getElementById("totalPengeluaranBulanIni").innerText = formatRupiah(totalBulanIni);
}

function editPengeluaran(id) {
  const db = getData();
  const p = db.pengeluaran.find(i => i.id === id);
  if(!p) return;
  document.getElementById("editPengeluaranId").value = p.id;
  document.getElementById("pengNama").value = p.nama;
  document.getElementById("pengQty").value = p.qty;
  document.getElementById("pengHarga").value = p.harga;
  document.getElementById("pengJumlah").value = p.jumlah;
  document.getElementById("formPengeluaranTitle").innerHTML = `<span>✏️ Edit Data Pengeluaran</span>`;
  
  document.getElementById("pengeluaranDetails").setAttribute("open", "true");
}

function deletePengeluaran(id) {
  if(!confirm("Hapus data pengeluaran ini?")) return;
  const db = getData();
  db.pengeluaran = db.pengeluaran.filter(p => p.id !== id);
  saveData(db);
  renderPengeluaranTable();
}

// --- LAPORAN & CETAK ---
function generateReport() {
  const jenis = document.getElementById("lapJenis").value;
  const db = getData();

  const thead = document.getElementById("reportTableHead");
  const tbody = document.getElementById("reportTableBody");
  const financialArea = document.getElementById("financialMetricsArea");

  financialArea.classList.add("hidden");
  document.getElementById("reportTitleHeader").innerText = `Hasil Laporan ${jenis.toUpperCase()}`;

  if (jenis === 'stok') {
    thead.innerHTML = `<tr><th>No</th><th>Kode</th><th>Nama Barang</th><th>Jumlah Stok Masuk</th></tr>`;
    tbody.innerHTML = db.barang.map((b, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${b.kode}</td>
        <td>${b.nama}</td>
        <td>${b.stok + b.terjual}</td>
      </tr>
    `).join("");
  } else if (jenis === 'penjualan') {
    thead.innerHTML = `<tr><th>No</th><th>Nota</th><th>Tanggal</th><th>Pelanggan</th><th>Total Qty</th><th>Subtotal</th></tr>`;
    tbody.innerHTML = db.transaksi.map((t, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${t.nota}</td>
        <td>${t.tgl}</td>
        <td>${t.pelanggan}</td>
        <td>${t.totalQty}</td>
        <td>${formatRupiah(t.subtotal)}</td>
      </tr>
    `).join("");
  } else if (jenis === 'pengeluaran') {
    thead.innerHTML = `<tr><th>No</th><th>Tanggal</th><th>Nama Barang</th><th>Qty</th><th>Total Pengeluaran</th></tr>`;
    tbody.innerHTML = db.pengeluaran.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.tgl}</td>
        <td>${p.nama}</td>
        <td>${p.qty}</td>
        <td>${formatRupiah(p.jumlah)}</td>
      </tr>
    `).join("");
  } else if (jenis === 'keuangan') {
    financialArea.classList.remove("hidden");
    
    let totalOmset = db.transaksi.reduce((acc, t) => acc + t.subtotal, 0);
    let totalModal = db.transaksi.reduce((acc, t) => {
      let modalTx = t.totalModal !== undefined ? t.totalModal : t.items.reduce((mAcc, item) => {
        let b = db.barang.find(brg => brg.kode === item.kode);
        let m = b ? b.modal : (item.modal || 0);
        return mAcc + (m * item.qty);
      }, 0);
      return acc + modalTx;
    }, 0);
    let totalPengeluaran = db.pengeluaran.reduce((acc, p) => acc + p.jumlah, 0);
    let bersih = totalOmset - totalModal - totalPengeluaran;

    document.getElementById("lapOmset").innerText = formatRupiah(totalOmset);
    document.getElementById("lapModal").innerText = formatRupiah(totalModal);
    document.getElementById("lapPengeluaran").innerText = formatRupiah(totalPengeluaran);
    document.getElementById("lapBersih").innerText = formatRupiah(bersih);

    thead.innerHTML = `<tr><th>Kategori</th><th>Total Rincian</th></tr>`;
    tbody.innerHTML = `
      <tr><td>Total Omset / Penjualan</td><td>${formatRupiah(totalOmset)}</td></tr>
      <tr><td>Total Modal Barang Terjual</td><td>${formatRupiah(totalModal)}</td></tr>
      <tr><td>Total Pengeluaran Operasional</td><td>${formatRupiah(totalPengeluaran)}</td></tr>
      <tr><td><strong>Pendapatan Bersih</strong></td><td><strong>${formatRupiah(bersih)}</strong></td></tr>
    `;
  }
}

// --- PRINTING NOTA & LAPORAN ---
function printNota(t) {
  const db = getData();
  const printContent = `
    <div style="font-family: monospace; width: 300px; padding: 10px;">
      <h3 style="text-align: center; margin:0;">${db.store.name}</h3>
      <p style="text-align: center; font-size: 12px; margin: 0;">${db.store.address}</p>
      <p style="text-align: center; font-size: 12px; margin: 0;">Telp: ${db.store.phone}</p>
      <p>--------------------------------</p>
      <p style="font-size: 12px;">Nota: ${t.nota}<br>Tgl: ${t.tgl}<br>Pelanggan: ${t.pelanggan}</p>
      <p>--------------------------------</p>
      ${t.items.map(i => `
        <div style="font-size: 12px;">
          <div>${i.nama}</div>
          <div style="display:flex; justify-content:space-between;">
            <span>${i.qty} x ${i.harga}</span>
            <span>${i.harga * i.qty}</span>
          </div>
        </div>
      `).join("")}
      <p>--------------------------------</p>
      <div style="font-size: 12px; display:flex; justify-content:space-between;">
        <strong>Total:</strong>
        <strong>${formatRupiah(t.subtotal)}</strong>
      </div>
      <div style="font-size: 12px; display:flex; justify-content:space-between;">
        <span>Dibayar:</span>
        <span>${formatRupiah(t.dibayar)}</span>
      </div>
      <div style="font-size: 12px; display:flex; justify-content:space-between;">
        <span>Kembalian:</span>
        <span>${formatRupiah(t.kembalian)}</span>
      </div>
      <p>--------------------------------</p>
      <p style="text-align: center; font-size: 12px;">${db.store.footer}</p>
    </div>
  `;
  executePrint(printContent);
}

function printReport() {
  const db = getData();
  const cardHtml = document.getElementById("reportResultCard").innerHTML;
  
  executePrint(`
    <div style="padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px;">
        <h2 style="margin: 0; font-size: 24px; color: #0f172a;">${db.store.name}</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">${db.store.address} | Telp: ${db.store.phone}</p>
      </div>
      ${cardHtml}
    </div>
  `);
}

function executePrint(content) {
  const printArea = document.getElementById("printable-area");
  printArea.innerHTML = content;
  window.print();
  printArea.innerHTML = "";
}