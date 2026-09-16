/**
 * BookmarksManager - Lesezeichen Speichern, Laden, Exportieren & Importieren
 */
class BookmarksManager {
  constructor(app) {
    this.app = app;
    this.bookmarks = [];
  }

  getStorageKey() {
    return (this.app.bookKey || 'default') + '_bookmarks';
  }

  load() {
    const saved = localStorage.getItem(this.getStorageKey());
    this.bookmarks = saved ? JSON.parse(saved) : [];
    this.renderUI();
  }

  save() {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this.bookmarks));
    this.renderUI();
  }

  addCurrent() {
    if (!this.app.doc) return;
    const p = this.app.currentPage;
    if (!this.bookmarks.includes(p)) {
      this.bookmarks.push(p);
      this.bookmarks.sort((a, b) => a - b);
      this.save();
      alert(`✨ Lesezeichen für Seite ${p} wurde versiegelt!`);
    } else {
      alert(`ℹ️ Seite ${p} ist bereits gespeichert.`);
    }
  }

  remove(page) {
    this.bookmarks = this.bookmarks.filter(b => b !== page);
    this.save();
  }

  renderUI() {
    const list = document.getElementById('bookmark-items');
    list.innerHTML = '';
    if (this.bookmarks.length === 0) {
      list.innerHTML = '<li style="text-align:center; color:#888;">Keine Lesezeichen hinterlegt</li>';
      return;
    }

    this.bookmarks.forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `<span>📖 Seite ${p}</span> <span style="color:#d9534f; cursor:pointer;">✕</span>`;
      
      li.querySelector('span').addEventListener('click', () => {
        // Heyzine PageIndex ist 0-basiert
        const targetIndex = (p % 2 === 0) ? p - 2 : p - 1;
        this.app.flipbook.turnToPage(Math.max(0, targetIndex));
        document.getElementById('bookmarks-modal').classList.remove('visible');
      });

      li.children[1].addEventListener('click', (e) => {
        e.stopPropagation();
        this.remove(p);
      });

      list.appendChild(li);
    });
  }

  exportJSON() {
    if (!this.app.doc) {
      alert("Bitte lade zuerst ein Buch!");
      return;
    }
    const data = {
      pdfName: this.app.pdfFileName,
      exportedAt: new Date().toISOString(),
      bookmarks: this.bookmarks
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.app.pdfFileName.replace(/\.pdf$/i, '')}_Lesezeichen.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (Array.isArray(json.bookmarks)) {
          this.bookmarks = Array.from(new Set([...this.bookmarks, ...json.bookmarks])).sort((a, b) => a - b);
          this.save();
          alert(`✨ ${json.bookmarks.length} Lesezeichen erfolgreich importiert!`);
        }
      } catch (err) {
        alert("Konnte Datei nicht lesen: " + err.message);
      }
    };
    reader.readAsText(file);
  }
}