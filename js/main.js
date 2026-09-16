/**
 * Main Controller - Bündelt Tastatur-Events, Menüs, Blickwinkel und PDF-Laden
 */
class GrimoireApp {
  constructor() {
    this.ambient = new AmbientManager();
    this.bookmarksManager = new BookmarksManager(this);
    this.flipbook = new FlipbookController(this);

    this.doc = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.bookKey = 'default_grimoire';
    this.pdfFileName = "Grimoire";

    this.setupEvents();
  }

  async loadPDF(file) {
    this.pdfFileName = file.name;
    document.getElementById('instruction-hint').style.display = 'none';
    document.getElementById('book-title').textContent = file.name.replace(/\.pdf$/i, '');
    document.getElementById('book-meta').textContent = "Heyzine Magie aktiv";

    this.bookKey = 'grimoire_' + file.name + '_' + file.size;
    const saved = localStorage.getItem(this.bookKey + '_last_page');
    this.currentPage = saved ? parseInt(saved, 10) : 1;

    const arrayBuffer = await file.arrayBuffer();
    this.doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    this.totalPages = this.doc.numPages;

    this.bookmarksManager.load();
    await this.flipbook.initFromPDF(this.doc);
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
      e.preventDefault(); // Standard-Browser-Kontextmenü unterdrücken
      document.querySelector('.hud').classList.toggle('hud-hidden');
    });

    // Klick auf Startseiten zum Laden
    document.getElementById('placeholder-book').addEventListener('click', () => {
      document.getElementById('file-input').click();
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

    // EINSTELLUNGEN: Perspektive & Draufsicht
    const casing = document.getElementById('grimoire-casing');
    const updatePerspective = () => {
      const angle = document.getElementById('angle-slider').value;
      const zoom = document.getElementById('zoom-slider').value;
      casing.style.transform = `rotateX(${angle}deg) scale(${zoom})`;
    };

    document.getElementById('angle-slider').addEventListener('input', updatePerspective);
    document.getElementById('zoom-slider').addEventListener('input', updatePerspective);

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