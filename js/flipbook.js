/**
 * FlipbookController - Integriert die echte Heyzine-Engine (StPageFlip) mit PDF.js On-Demand Rasterisierung
 */
class FlipbookController {
  constructor(app) {
    this.app = app;
    this.pageFlip = null;
    this.renderedPages = new Set();
  }

  async initFromPDF(doc) {
    document.getElementById('placeholder-book').style.display = 'none';
    const flipContainer = document.getElementById('flipbook');
    flipContainer.innerHTML = '';

    const total = doc.numPages;

    // Erzeuge leichtgewichtige Seiten-Container
    for (let i = 1; i <= total; i++) {
      const pageEl = document.createElement('div');
      pageEl.className = 'page';
      pageEl.dataset.pageNumber = i;
      flipContainer.appendChild(pageEl);
    }

    // Heyzine StPageFlip Engine Konfiguration (DIN A5 Verhältnis 520x735)
    this.pageFlip = new St.PageFlip(flipContainer, {
      width: 520,
      height: 735,
      size: 'stretch',
      minWidth: 320,
      maxWidth: 800,
      minHeight: 450,
      maxHeight: 1131,
      maxShadowOpacity: 0.55,
      showCover: false,
      mobileScrollSupport: false,
      flippingTime: 700,
      usePortrait: false,
      startPage: Math.max(0, this.app.currentPage - 1)
    });

    this.pageFlip.loadFromHTML(flipContainer.querySelectorAll('.page'));

    // Sound und Render-Trigger beim Umblättern
    this.pageFlip.on('flip', (e) => {
      window.grimoireAudio.playPageTurn();
      const currentIdx = e.data;
      this.app.currentPage = currentIdx + 1;
      this.updatePageDisplay();
      this.renderNearbyPages(currentIdx);
      localStorage.setItem(this.app.bookKey + '_last_page', this.app.currentPage);
    });

    // Erste Seiten sofort scharf rendern
    await this.renderNearbyPages(Math.max(0, this.app.currentPage - 1));
	// Ecken-Sensibilität auf das letzte 1/8 begrenzen
    const flipCtrl = this.pageFlip.getFlipController();
    if (flipCtrl && flipCtrl.showCorner) {
      const origShow = flipCtrl.showCorner.bind(flipCtrl);
      flipCtrl.showCorner = (pos) => {
        const rect = this.pageFlip.getBoundsRect();
        const singlePageW = rect.width / 2;
        const cornerW = singlePageW / 8; // Nur noch 1/8 der Seitenbreite
        const cornerH = rect.height / 8;  // Nur noch 1/8 der Seitenhöhe

        const isLeftEdge  = (pos.x >= rect.left && pos.x <= rect.left + cornerW);
        const isRightEdge = (pos.x <= rect.left + rect.width && pos.x >= rect.left + rect.width - cornerW);
        const isTopEdge   = (pos.y >= rect.top && pos.y <= rect.top + cornerH);
        const isBottomEdge= (pos.y <= rect.top + rect.height && pos.y >= rect.top + rect.height - cornerH);

        if ((isLeftEdge || isRightEdge) && (isTopEdge || isBottomEdge)) {
          origShow(pos);
        } else if (flipCtrl.getState && flipCtrl.getState() === 'fold_corner') {
          flipCtrl.stopMove();
        }
      };
    }
    this.updatePageDisplay();
  }

  async renderNearbyPages(centerIndex) {
    if (!this.app.doc) return;
    const total = this.app.totalPages;

    // Rendere das aktuelle Doppelblatt sowie die Blätter davor und danach voraus (Buffer)
    const start = Math.max(0, centerIndex - 3);
    const end = Math.min(total - 1, centerIndex + 4);

    for (let i = start; i <= end; i++) {
      if (!this.renderedPages.has(i)) {
        await this.renderSinglePage(i + 1);
        this.renderedPages.add(i);
      }
    }
  }

  async renderSinglePage(pageNumber) {
    const pageContainer = document.querySelector(`.page[data-page-number="${pageNumber}"]`);
    if (!pageContainer || pageContainer.querySelector('canvas')) return;

    const page = await this.app.doc.getPage(pageNumber);
    // Skalierung für ultra-scharfe, unverzerrte Vektorschrift
    const viewport = page.getViewport({ scale: 2.0 * window.devicePixelRatio });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    pageContainer.innerHTML = '';
    pageContainer.appendChild(canvas);
  }

  flipNext() {
    if (this.pageFlip) this.pageFlip.flipNext();
  }

  flipPrev() {
    if (this.pageFlip) this.pageFlip.flipPrev();
  }

  turnToPage(idx) {
    if (this.pageFlip) this.pageFlip.turnToPage(idx);
  }

  updatePageDisplay() {
    const cur = this.app.currentPage;
    const total = this.app.totalPages;
    const right = Math.min(cur + 1, total);
    document.getElementById('page-display').textContent = `Seiten ${cur} - ${right} von ${total}`;
  }
}