const fs = require('fs')
const path = require('path')

const source = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
const destination = path.join(__dirname, '..', 'public', 'pdf.worker.min.mjs')

if (!fs.existsSync(source)) {
  console.warn('pdfjs-dist worker file not found, skipping copy:', source)
  process.exit(0)
}

fs.copyFileSync(source, destination)
console.log('Copied pdf.worker.min.mjs to public/')
