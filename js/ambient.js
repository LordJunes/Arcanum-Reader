/**
 * AmbientManager - Handhabt Partikelsystem, Kerzenschein & Tischhintergrund
 */
class AmbientManager {
  constructor() {
    this.canvas = document.getElementById('ambient-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 120;
    this.particleColor = '#ffd375';
    this.flickerEnabled = true;
    this.candleBase = 0.75;
    this.isNight = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
    this.setWood('oak');
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  setWood(type) {
    const url = TextureFactory.getWoodDataURL(type);
    document.getElementById('desk-surface').style.backgroundImage = `url(${url})`;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: Math.random() * 2.2 + 0.8,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4 - 0.2,
        alpha: Math.random() * 0.7 + 0.2
      });
    }
  }

  setParticleCount(count) {
    this.particleCount = parseInt(count, 10);
    this.initParticles();
  }

  setParticleColor(color) {
    this.particleColor = color;
  }

  setMode(isNight) {
    this.isNight = isNight;
    const overlay = document.getElementById('candle-overlay');
    if (isNight) {
      overlay.style.background = 'radial-gradient(circle at 50% 45%, rgba(60, 120, 240, 0.25) 0%, rgba(10, 15, 30, 0.75) 65%, rgba(2, 4, 8, 0.98) 100%)';
    } else {
      overlay.style.background = 'radial-gradient(circle at 50% 45%, rgba(255, 170, 70, 0.28) 0%, rgba(20, 10, 5, 0.7) 65%, rgba(5, 3, 2, 0.95) 100%)';
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.ctx.clearRect(0, 0, this.width, this.height);
    const t = performance.now() * 0.001;

    // Kerzenflackern
    if (this.flickerEnabled) {
      const fl = Math.sin(t * 11) * 0.05 + Math.cos(t * 23) * 0.03 + (Math.random() - 0.5) * 0.02;
      document.getElementById('candle-overlay').style.opacity = Math.max(0.2, this.candleBase + fl);
    } else {
      document.getElementById('candle-overlay').style.opacity = this.candleBase;
    }

    // Partikel rendern
    this.ctx.fillStyle = this.particleColor;
    this.particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      this.ctx.globalAlpha = p.alpha * (0.7 + Math.sin(t * 2 + p.x) * 0.3);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1.0;
  }
}