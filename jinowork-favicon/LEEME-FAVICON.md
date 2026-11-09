# Favicon de Jinowork

Pala en crema y terracota sobre un cuadrado redondeado verde oscuro (`#16302B`). Está más gruesa que la pala del logo para que se lea bien en tamaños pequeños.

| Archivo | Para qué |
|---|---|
| `favicon.ico` | Navegadores antiguos (trae 16, 32 y 48 px) |
| `favicon.svg` | Navegadores modernos (vectorial, se ve nítido siempre) |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Pestañas y resultados de Google |
| `apple-touch-icon.png` | Pantalla de inicio en iPhone (180 px) |
| `favicon-192.png`, `favicon-512.png` | Android y PWA |

## Código para el `<head>`
```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#16302B">
```

`site.webmanifest`:
```json
{
  "name": "Jinowork",
  "short_name": "Jinowork",
  "icons": [
    { "src": "/favicon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/favicon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#16302B",
  "background_color": "#F7EDE6",
  "display": "standalone"
}
```

Sube todos los archivos a la raíz del sitio (la misma carpeta de tu `index.html`).
