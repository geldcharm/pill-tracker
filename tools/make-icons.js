// Generates the PNG app icons with no dependencies:  node tools/make-icons.js
// Draws a teal rounded square with a two-tone capsule on it.
var fs = require('fs'), path = require('path'), zlib = require('zlib');

var BG = [13, 148, 136];        // #0d9488
var CAP_A = [255, 255, 255];    // white half
var CAP_B = [204, 251, 241];    // pale teal half
var OUT = path.join(__dirname, '..', 'icons');

function crcTable() {
  var t = [], c, n, k;
  for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
  return t;
}
var CRC = crcTable();
function crc32(buf) { var c = 0xffffffff; for (var i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  var len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  var td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  var crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(width, height, rgba) {
  var raw = Buffer.alloc((width * 4 + 1) * height);
  for (var y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

// Signed distance helpers
function sdRoundRect(x, y, half, r) {
  var qx = Math.abs(x) - half + r, qy = Math.abs(y) - half + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
function capsule(x, y, ax, ay, bx, by, r) {
  var pax = x - ax, pay = y - ay, bax = bx - ax, bay = by - ay;
  var t = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return { d: Math.hypot(pax - bax * t, pay - bay * t) - r, t: t };
}
function coverage(d) { return Math.max(0, Math.min(1, 0.5 - d)); } // 1px anti-alias edge

function draw(size, opts) {
  var SS = 3, buf = Buffer.alloc(size * size * 4);
  var half = size / 2;
  var corner = opts.square ? 0 : size * 0.22;
  var scale = opts.safe ? 0.62 : 0.78;             // maskable icons keep the art inside the safe zone
  var L = size * scale * 0.5, R = size * 0.13 * (opts.safe ? 0.8 : 1);
  var ax = -L * 0.62, ay = L * 0.62, bx = L * 0.62, by = -L * 0.62;
  for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
    var r = 0, g = 0, b = 0, a = 0;
    for (var sy = 0; sy < SS; sy++) for (var sx = 0; sx < SS; sx++) {
      var px = x + (sx + 0.5) / SS - half, py = y + (sy + 0.5) / SS - half;
      var bgCov = opts.square ? 1 : coverage(sdRoundRect(px, py, half, corner));
      var col = BG, alpha = bgCov;
      var c = capsule(px, py, ax, ay, bx, by, R);
      var capCov = coverage(c.d) * bgCov;
      if (capCov > 0) {
        var cc = c.t < 0.5 ? CAP_A : CAP_B;
        // thin seam between the halves
        var seam = Math.abs(c.t - 0.5) * Math.hypot(bx - ax, by - ay);
        var seamCov = coverage(seam - size * 0.012);
        cc = [cc[0] * (1 - seamCov) + BG[0] * seamCov, cc[1] * (1 - seamCov) + BG[1] * seamCov, cc[2] * (1 - seamCov) + BG[2] * seamCov];
        col = [col[0] * (1 - capCov) + cc[0] * capCov, col[1] * (1 - capCov) + cc[1] * capCov, col[2] * (1 - capCov) + cc[2] * capCov];
      }
      r += col[0] * alpha; g += col[1] * alpha; b += col[2] * alpha; a += alpha;
    }
    var n = SS * SS, i = (y * size + x) * 4;
    if (a > 0) { buf[i] = Math.round(r / a); buf[i + 1] = Math.round(g / a); buf[i + 2] = Math.round(b / a); }
    buf[i + 3] = Math.round(255 * a / n);
  }
  return png(size, size, buf);
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'icon-192.png'), draw(192, {}));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), draw(512, {}));
fs.writeFileSync(path.join(OUT, 'icon-maskable-512.png'), draw(512, { square: true, safe: true }));
fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), draw(180, { square: true }));
console.log('Icons written to ' + OUT);
