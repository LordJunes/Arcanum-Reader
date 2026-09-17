/**
 * Main Controller - Bündelt Tastatur-Events, Menüs, Blickwinkel, Touch-Events, IndexedDB & PDF-Laden
 */
class GrimoireApp {
  constructor() {
    window.arcanumApp = this;
    this.ambient = new AmbientManager();
    this.bookmarksManager = new BookmarksManager(this);
    this.flipbook = new FlipbookController(this);

    this.doc = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.bookKey = 'default_grimoire';
    this.pdfFileName = "Grimoire";
    this.currentBookId = null;

    this.setupEvents();
    this.setupTouchGestures();
    this.setupAutoFit();
    this.initLibrary();
  }

  // Universelle Ladefunktion für Datei-Uploads & Blobs
  async loadPDF(file) {
    const blob = file.slice(0, file.size, file.type);
    const bookId = 'local_' + file.name + '_' + file.size;
    await saveBookToDB(bookId, file.name, blob);
    await this.loadPDFFromBlob(blob, file.name, bookId);
  }

  async loadPDFFromBlob(blob, name, id) {
    this.pdfFileName = name;
    this.currentBookId = id;
    document.getElementById('instruction-hint').style.display = 'none';
    document.getElementById('book-title').textContent = name.replace(/\.pdf$/i, '');
    document.getElementById('book-meta').textContent = "Heyzine Magie aktiv";

    this.bookKey = 'grimoire_' + id;
    const saved = localStorage.getItem(this.bookKey + '_last_page');
    this.currentPage = saved ? parseInt(saved, 10) : 1;

    const arrayBuffer = await blob.arrayBuffer();
    this.doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    this.totalPages = this.doc.numPages;

    this.bookmarksManager.load();
    await this.flipbook.initFromPDF(this.doc);
    this.updateAutoFit();
  }

  // Wischgesten für Smartphones
  setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;

    const targetArea = document.getElementById('reading-viewport');

    targetArea.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    targetArea.addEventListener('touchend', (e) => {
      const diffX = e.changedTouches[0].screenX - touchStartX;
      const diffY = e.changedTouches[0].screenY - touchStartY;

      // Nur reagieren, wenn horizontaler Wisch stärker als vertikaler ist
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
        if (diffX < 0) {
          this.flipbook.flipNext(); // Wisch nach links = Nächste Seite
        } else {
          this.flipbook.flipPrev(); // Wisch nach rechts = Vorherige Seite
        }
      }
    }, { passive: true });
  }

  // Auto-Fit: Passt das 3D Grimoire optimal an Mobilgeräte & Laptops an
  setupAutoFit() {
    window.addEventListener('resize', () => this.updateAutoFit());
    setTimeout(() => this.updateAutoFit(), 200);
  }

  updateAutoFit() {
    const casing = document.getElementById('grimoire-casing');
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Basisgröße des Buch-Casings ist ca. 1080x780px
    const baseW = 1080;
    const baseH = 780;

    const scaleX = (vw * 0.94) / baseW;
    const scaleY = (vh * 0.80) / baseH;
    let autoScale = Math.min(scaleX, scaleY, 1.25);

    const manualZoom = parseFloat(document.getElementById('zoom-slider').value) || 1.0;
    const angle = document.getElementById('angle-slider').value || 0;
    
    const finalScale = autoScale * manualZoom;
    casing.style.transform = `rotateX(${angle}deg) scale(${finalScale})`;
  }

  async initLibrary() {
    const books = await getAllBooksFromDB();
    if (books && books.length > 0) {
      books.sort((a, b) => b.lastRead - a.lastRead);
      const last = books[0];
      // Zuletzt gelesenes Buch automatisch aufschlagen!
      this.loadPDFFromBlob(last.data, last.title, last.id);
    }
  }

  async renderLibraryUI() {
    const list = document.getElementById('library-items');
    list.innerHTML = '';
    const books = await getAllBooksFromDB();

    if (books.length === 0) {
      list.innerHTML = '<li style="text-align:center; color:#888;">Noch keine Bücher im Archiv. Lade eines per Google Drive oder PDF!</li>';
      return;
    }

    books.forEach(b => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📖 ${b.title}</span>
        <span style="color:#d9534f; cursor:pointer; margin-left:12px;" title="Aus Offline-Archiv löschen">🗑️</span>
      `;

      li.querySelector('span').addEventListener('click', () => {
        this.loadPDFFromBlob(b.data, b.title, b.id);
        document.getElementById('library-modal').classList.remove('visible');
      });

      li.children[1].addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Möchtest du "${b.title}" aus dem Speicher entfernen?`)) {
          await deleteBookFromDB(b.id);
          this.renderLibraryUI();
        }
      });

      list.appendChild(li);
    });
  }

  setupEvents() {
    // Tasten A & D sowie Pfeile
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || e.key === 'ArrowLeft') this.flipbook.flipPrev();
      if (k === 'd' || e.key === 'ArrowRight') this.flipbook.flipNext();
    });

    // Rechtsklick blendet das gesamte HUD ein / aus
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      document.querySelector('.hud').classList.toggle('hud-hidden');
    });

    // Klick auf Startseiten zum Laden
    document.getElementById('placeholder-book').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });

    const fileInput = document.getElementById('file-input');
    document.getElementById('btn-open').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) this.loadPDF(e.target.files[0]);
    });

    // Google Drive Button
    document.getElementById('btn-gdrive').addEventListener('click', () => {
      if (typeof openGoogleDrivePicker === 'function') {
        openGoogleDrivePicker();
      }
    });

    // Offline Archiv Button
    document.getElementById('btn-library').addEventListener('click', () => {
      this.renderLibraryUI();
      document.getElementById('library-modal').classList.toggle('visible');
    });
    document.getElementById('close-library').addEventListener('click', () => {
      document.getElementById('library-modal').classList.remove('visible');
    });

    // Pfeile unten
    document.getElementById('arrow-prev').addEventListener('click', () => this.flipbook.flipPrev());
    document.getElementById('arrow-next').addEventListener('click', () => this.flipbook.flipNext());

    // Negativ-Modus (Weiß auf Schwarz)
    document.getElementById('btn-invert').addEventListener('click', () => {
      document.body.classList.toggle('inverted-mode');
    });

    // Tag / Nacht
    document.getElementById('btn-mode').addEventListener('click', () => {
      this.ambient.setMode(!this.ambient.isNight);
    });

    // Modals
    document.getElementById('btn-settings').addEventListener('click', () => {
      document.getElementById('settings-modal').classList.toggle('visible');
    });
    document.getElementById('close-settings').addEventListener('click', () => {
      document.getElementById('settings-modal').classList.remove('visible');
    });

    document.getElementById('btn-bookmarks').addEventListener('click', () => {
      document.getElementById('bookmarks-modal').classList.toggle('visible');
    });
    document.getElementById('close-bookmarks').addEventListener('click', () => {
      document.getElementById('bookmarks-modal').classList.remove('visible');
    });

    // Lesezeichen Klicks
    document.getElementById('page-display').addEventListener('click', () => this.bookmarksManager.addCurrent());
    document.getElementById('btn-add-bookmark').addEventListener('click', () => this.bookmarksManager.addCurrent());

    // Export & Import
    document.getElementById('btn-export-bookmarks').addEventListener('click', () => this.bookmarksManager.exportJSON());
    const bkmImport = document.getElementById('bookmark-import-input');
    document.getElementById('btn-import-bookmarks').addEventListener('click', () => bkmImport.click());
    bkmImport.addEventListener('change', (e) => {
      if (e.target.files.length > 0) this.bookmarksManager.importJSON(e.target.files[0]);
    });

    // Perspektive & Draufsicht
    document.getElementById('angle-slider').addEventListener('input', () => this.updateAutoFit());
    document.getElementById('zoom-slider').addEventListener('input', () => this.updateAutoFit());

    // Licht, Holz, Partikel & Sound
    document.getElementById('candle-slider').addEventListener('input', (e) => {
      this.ambient.candleBase = parseFloat(e.target.value);
    });

    document.getElementById('toggle-flicker').addEventListener('change', (e) => {
      this.ambient.flickerEnabled = e.target.checked;
    });

    document.getElementById('select-wood').addEventListener('change', (e) => {
      this.ambient.setWood(e.target.value);
    });

    document.getElementById('select-particles-density').addEventListener('change', (e) => {
      this.ambient.setParticleCount(e.target.value);
    });

    document.getElementById('select-particles-color').addEventListener('change', (e) => {
      this.ambient.setParticleColor(e.target.value);
    });

    document.getElementById('select-sound-type').addEventListener('change', (e) => {
      window.grimoireAudio.soundProfile = e.target.value;
      window.grimoireAudio.playPageTurn();
    });

    document.getElementById('volume-slider').addEventListener('input', (e) => {
      window.grimoireAudio.volume = parseFloat(e.target.value);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GrimoireApp();
});