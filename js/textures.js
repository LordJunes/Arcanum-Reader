/**
 * TextureFactory - Generiert Holzmuster für den Schreibtisch
 */
const TextureFactory = {
  getWoodDataURL(type = 'oak') {
    const c = document.createElement('canvas');
    c.width = 600; c.height = 600;
    const ctx = c.getContext('2d');

    let baseR, baseG, baseB, multR, multG, multB, freq;

    switch (type) {
      case 'mahogany':
        baseR = 45; baseG = 15; baseB = 10;
        multR = 1.8; multG = 0.6; multB = 0.4; freq = 0.05;
        break;
      case 'pine':
        baseR = 100; baseG = 75; baseB = 40;
        multR = 1.3; multG = 1.0; multB = 0.6; freq = 0.035;
        break;
      case 'ebony':
        baseR = 12; baseG = 10; baseB = 12;
        multR = 0.8; multG = 0.8; multB = 0.85; freq = 0.06;
        break;
      case 'oak':
      default:
        baseR = 25; baseG = 15; baseB = 10;
        multR = 1.5; multG = 0.95; multB = 0.65; freq = 0.04;
        break;
    }

    ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
    ctx.fillRect(0, 0, c.width, c.height);

    for (let i = 0; i < c.height; i += 2) {
      const tone = 20 + Math.sin(i * freq) * 10 + (Math.random() * 8);
      ctx.fillStyle = `rgb(${Math.floor(baseR + tone * multR)}, ${Math.floor(baseG + tone * multG)}, ${Math.floor(baseB + tone * multB)})`;
      ctx.fillRect(0, i, c.width, 2);
    }

    return c.toDataURL();
  }
};