const express = require('express');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Carpeta pública donde se servirán las imágenes
const UPLOAD_DIR = path.join(__dirname, 'public', 'img');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));

// configurar storage de multer para preservar el nombre o usar timestamp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // limpiar nombre y añadir timestamp para evitar colisiones
    const name = file.originalname.replace(/[^a-zA-Z0-9.\-\_]/g, '_');
    const finalName = `${Date.now()}_${name}`;
    cb(null, finalName);
  }
});

const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// endpoint simple para subir imagen
app.post('/upload-image', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  // devolvemos la ruta relativa respecto al sitio (ej: img/12345_nombre.jpg)
  const filename = `img/${req.file.filename}`;
  res.json({ success: true, filename });
});

app.get('/', (req, res) => {
  res.send('Uploader example running');
});

app.listen(PORT, () => console.log(`Uploader listening on http://localhost:${PORT}`));
