// Build script for the self-hosted (GitHub Pages / Netlify / any static
// host) edition of NeuroAssess. Unlike the Claude-artifact edition, there's
// no self-publishing "quine" step here — this just bakes the QR code
// library and the verbal-recall word list into a single static index.html.
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'app-src.html');
const qrPath = path.join(__dirname, 'qrcode.min2.js');
const wordlistPath = path.join(__dirname, 'final_wordlist.json');
const outPath = path.join(__dirname, 'index.html');

let src = fs.readFileSync(srcPath, 'utf8');
const qrLib = fs.readFileSync(qrPath, 'utf8');
const wordlist = JSON.parse(fs.readFileSync(wordlistPath, 'utf8'));

function countOccurrences(str, token) {
  return str.split(token).length - 1;
}

if (countOccurrences(src, '__QRCODE_LIB__') !== 1) {
  throw new Error('Expected exactly 1 occurrence of __QRCODE_LIB__');
}
src = src.replace('__QRCODE_LIB__', function () { return qrLib; });

if (countOccurrences(src, '__WORDLIST_JSON__') !== 1) {
  throw new Error('Expected exactly 1 occurrence of __WORDLIST_JSON__');
}
const wordlistJson = JSON.stringify(wordlist).replace(/<\/(script)/gi, '<\\/$1');
src = src.replace('__WORDLIST_JSON__', function () { return wordlistJson; });

if (!src.startsWith('<!doctype html>')) {
  throw new Error('Output does not start with <!doctype html>');
}

fs.writeFileSync(outPath, src, 'utf8');
console.log('Wrote', outPath, '(' + (src.length / 1024).toFixed(1) + ' KB)');
