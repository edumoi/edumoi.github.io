# Backend de ejemplo para subir imágenes

Este backend es un ejemplo mínimo con Node.js + Express + Multer que expone un endpoint `/upload-image` para recibir imágenes en `multipart/form-data` y guardarlas en `backend/public/img`.

Instalación

```bash
cd backend
npm install
```

Ejecutar en desarrollo

```bash
npm run dev
```

Probar manualmente

Puedes usar `curl` para probar la subida:

```bash
curl -F "file=@ruta/a/miimagen.jpg" http://localhost:3001/upload-image
```

Respuesta esperada

```json
{ "success": true, "filename": "img/1691234567890_miimagen.jpg" }
```

Integración con el frontend

- En `script.js` del frontend, ajusta `UPLOAD_URL` a `http://localhost:3001/upload-image` (o la URL pública de tu hosting).
- El backend sirve las imágenes en `/img/...`, por lo que el frontend puede referenciarlas como `img/<filename>`.

Seguridad y producción

Este ejemplo es intencionalmente simple. Para producción considera:
- Validar tipos MIME y extensiones permitidas.
- Autenticación/autorización para evitar subidas públicas.
- Almacenamiento en CDN o bucket (S3, Cloud Storage) y limpieza de nombres únicos.
- Límite razonable de tamaño y escaneo antivirus si procede.
