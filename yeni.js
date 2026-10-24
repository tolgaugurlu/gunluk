// Bugünün tarihiyle yeni bir yazı dosyası açar.
// Kullanım: node yeni.js "Başlık"

const fs = require('fs');
const path = require('path');

const simdi = new Date();
const tarih = [
  simdi.getFullYear(),
  String(simdi.getMonth() + 1).padStart(2, '0'),
  String(simdi.getDate()).padStart(2, '0'),
].join('-');

const baslik = process.argv.slice(2).join(' ').trim();
const klasor = path.join(__dirname, 'gunluk');
fs.mkdirSync(klasor, { recursive: true });

let dosya = path.join(klasor, tarih + '.md');
let n = 2;
while (fs.existsSync(dosya)) {
  dosya = path.join(klasor, tarih + '-' + n + '.md');
  n++;
}

fs.writeFileSync(dosya, (baslik ? '# ' + baslik : '# ') + '\n\n');
console.log('Açıldı: ' + path.relative(process.cwd(), dosya));
