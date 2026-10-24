// Günlük sitesini üretir. gunluk/ içindeki markdown dosyalarını okur, dist/ içine HTML yazar.
// Çalıştırmak için: node build.js

const fs = require('fs');
const path = require('path');

const SITE = {
  baslik: 'Günlük',
  isim: 'Tolga Uğurlu',
  aciklama: 'Her gün ne çalıştığımı, ne öğrendiğimi yazdığım yer.',
};
const ANASAYFADA_KAC_YAZI = 10;

const KOK = __dirname;
const GIRDI = path.join(KOK, 'gunluk');
const CIKTI = path.join(KOK, 'dist');

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function kacir(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function satirIci(s) {
  s = kacir(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

const BLOK_BASI = /^(#{1,6}\s|```|>|[-*]\s|\d+[.)]\s|---\s*$|\*\*\*\s*$)/;

function markdown(md) {
  const satirlar = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < satirlar.length) {
    const s = satirlar[i];
    if (s.trim() === '') { i++; continue; }

    if (s.startsWith('```')) {
      const buf = [];
      i++;
      while (i < satirlar.length && !satirlar[i].startsWith('```')) { buf.push(satirlar[i]); i++; }
      i++;
      out.push('<pre><code>' + kacir(buf.join('\n')) + '</code></pre>');
      continue;
    }

    const h = s.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const n = Math.min(h[1].length + 1, 6);
      out.push('<h' + n + '>' + satirIci(h[2]) + '</h' + n + '>');
      i++;
      continue;
    }

    if (/^(---|\*\*\*)\s*$/.test(s)) { out.push('<hr>'); i++; continue; }

    if (s.startsWith('>')) {
      const buf = [];
      while (i < satirlar.length && satirlar[i].startsWith('>')) { buf.push(satirlar[i].replace(/^>\s?/, '')); i++; }
      out.push('<blockquote>' + markdown(buf.join('\n')) + '</blockquote>');
      continue;
    }

    if (/^[-*]\s+/.test(s)) {
      const buf = [];
      while (i < satirlar.length && /^[-*]\s+/.test(satirlar[i])) {
        buf.push('<li>' + satirIci(satirlar[i].replace(/^[-*]\s+/, '')) + '</li>');
        i++;
      }
      out.push('<ul>' + buf.join('') + '</ul>');
      continue;
    }

    if (/^\d+[.)]\s+/.test(s)) {
      const buf = [];
      while (i < satirlar.length && /^\d+[.)]\s+/.test(satirlar[i])) {
        buf.push('<li>' + satirIci(satirlar[i].replace(/^\d+[.)]\s+/, '')) + '</li>');
        i++;
      }
      out.push('<ol>' + buf.join('') + '</ol>');
      continue;
    }

    const buf = [];
    while (i < satirlar.length && satirlar[i].trim() !== '' && !BLOK_BASI.test(satirlar[i])) {
      buf.push(satirlar[i].trim());
      i++;
    }
    out.push('<p>' + satirIci(buf.join(' ')) + '</p>');
  }
  return out.join('\n');
}

function tarihYaz(d) {
  return d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear();
}

function yazilariOku() {
  if (!fs.existsSync(GIRDI)) return [];
  return fs.readdirSync(GIRDI)
    .filter(f => /^\d{4}-\d{2}-\d{2}.*\.md$/.test(f))
    .sort()
    .reverse()
    .map(f => {
      const ham = fs.readFileSync(path.join(GIRDI, f), 'utf8').replace(/\r\n/g, '\n').trim();
      const satirlar = ham.split('\n');
      let baslik = null;
      let govde = ham;
      if (/^#\s+/.test(satirlar[0])) {
        baslik = satirlar[0].replace(/^#\s+/, '').trim();
        govde = satirlar.slice(1).join('\n').trim();
      }
      const slug = f.replace(/\.md$/, '');
      const tarih = slug.slice(0, 10);
      const d = new Date(tarih + 'T12:00:00');
      return {
        slug,
        tarih,
        baslik: baslik || tarihYaz(d),
        tarihMetni: tarihYaz(d),
        gun: GUNLER[d.getDay()],
        yil: d.getFullYear(),
        html: markdown(govde),
      };
    });
}

function sayfa(secenek) {
  const tamBaslik = secenek.baslik ? secenek.baslik + ' · ' + SITE.baslik : SITE.baslik;
  const kok = secenek.kok;
  return [
    '<!doctype html>',
    '<html lang="tr">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow">',
    '<title>' + kacir(tamBaslik) + '</title>',
    '<meta name="description" content="' + kacir(secenek.aciklama || SITE.aciklama) + '">',
    '<link rel="stylesheet" href="' + kok + 'style.css">',
    '</head>',
    '<body>',
    '<header class="ust">',
    '  <a class="ad" href="' + kok + 'index.html">' + kacir(SITE.baslik) + '</a>',
    '  <nav><a href="' + kok + 'arsiv.html">Arşiv</a></nav>',
    '</header>',
    '<main>',
    secenek.icerik,
    '</main>',
    '<footer class="alt">' + kacir(SITE.isim) + '</footer>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function makale(y, kok, tekSayfa) {
  const zaman = '<time datetime="' + y.tarih + '">' + y.tarihMetni + ', ' + y.gun + '</time>';
  const baslik = tekSayfa
    ? '<h1>' + kacir(y.baslik) + '</h1>'
    : '<h2><a href="' + kok + 'yazi/' + y.slug + '.html">' + kacir(y.baslik) + '</a></h2>';
  return '<article class="yazi">\n<header>' + zaman + baslik + '</header>\n<div class="govde">\n' + y.html + '\n</div>\n</article>';
}

function anasayfa(yazilar) {
  if (yazilar.length === 0) {
    return sayfa({ kok: './', icerik: '<p class="not">Henüz bir şey yazılmadı.</p>' });
  }
  const sonlar = yazilar.slice(0, ANASAYFADA_KAC_YAZI).map(y => makale(y, './', false)).join('\n');
  const devam = yazilar.length > ANASAYFADA_KAC_YAZI
    ? '<p class="devam"><a href="./arsiv.html">Daha eskiler arşivde.</a></p>'
    : '';
  return sayfa({ kok: './', icerik: sonlar + '\n' + devam });
}

function arsivSayfasi(yazilar) {
  if (yazilar.length === 0) {
    return sayfa({ baslik: 'Arşiv', kok: './', icerik: '<p class="not">Henüz bir şey yazılmadı.</p>' });
  }
  const yillar = new Map();
  for (const y of yazilar) {
    if (!yillar.has(y.yil)) yillar.set(y.yil, []);
    yillar.get(y.yil).push(y);
  }
  let icerik = '<section class="arsiv"><h1>Arşiv</h1>';
  for (const [yil, liste] of yillar) {
    icerik += '<h2>' + yil + '</h2><ul>';
    for (const y of liste) {
      const kisaTarih = y.tarihMetni.replace(/ \d{4}$/, '');
      icerik += '<li><time datetime="' + y.tarih + '">' + kisaTarih + '</time><a href="./yazi/' + y.slug + '.html">' + kacir(y.baslik) + '</a></li>';
    }
    icerik += '</ul>';
  }
  icerik += '</section>';
  return sayfa({ baslik: 'Arşiv', kok: './', icerik });
}

function yaziSayfasi(y, eski, yeni) {
  let gezin = '<nav class="gezin">';
  gezin += eski ? '<a href="./' + eski.slug + '.html">Önceki: ' + kacir(eski.baslik) + '</a>' : '<span></span>';
  gezin += yeni ? '<a href="./' + yeni.slug + '.html">Sonraki: ' + kacir(yeni.baslik) + '</a>' : '<span></span>';
  gezin += '</nav>';
  return sayfa({
    baslik: y.baslik,
    kok: '../',
    icerik: makale(y, '../', true) + '\n' + gezin,
    aciklama: y.tarihMetni + ', ' + y.baslik,
  });
}

function uret() {
  const yazilar = yazilariOku();
  fs.rmSync(CIKTI, { recursive: true, force: true });
  fs.mkdirSync(path.join(CIKTI, 'yazi'), { recursive: true });
  fs.copyFileSync(path.join(KOK, 'style.css'), path.join(CIKTI, 'style.css'));
  fs.writeFileSync(path.join(CIKTI, 'index.html'), anasayfa(yazilar));
  fs.writeFileSync(path.join(CIKTI, 'arsiv.html'), arsivSayfasi(yazilar));
  yazilar.forEach((y, i) => {
    const eski = yazilar[i + 1] || null;
    const yeni = yazilar[i - 1] || null;
    fs.writeFileSync(path.join(CIKTI, 'yazi', y.slug + '.html'), yaziSayfasi(y, eski, yeni));
  });
  console.log(yazilar.length + ' yazı, dist/ hazır.');
}

uret();
