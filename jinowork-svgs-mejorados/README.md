# Jinowork · Pack SVG para Acceso / Crear cuenta

Fondos decorativos para la pantalla de autenticación (panel verde izquierdo + panel crema derecho).
Todo es **ondas, curvas de nivel y sombras suaves**, con opacidades bajas para dar profundidad sin competir con el contenido.

Abre `preview.html` para ver cómo se apilan las capas.

## Paleta usada

| Token | Hex | Uso |
|---|---|---|
| Verde profundo | `#1B3A33` | Panel izquierdo, sombras |
| Verde medio | `#2F5F52` | Botón, líneas del lado claro |
| Verde brillo | `#3E7F69` | Resplandores / cerros |
| Coral | `#E08C74` | Puntos, línea de onda, rama de café |
| Crema | `#FCF8F5` | Panel derecho |
| Rosado | `#F4D9D0` | Brillo esquina superior derecha |

## Estructura

```
left/      panel verde (viewBox 1080×1000)
  02-resplandor-oscuro.svg    luz verde abajo-derecha + viñeta arriba-izquierda
  01-contornos-oscuros.svg    curvas de nivel (topográficas), blanco ~5–9 %
  05-orbitas-oscuras.svg      elipses y 3 puntos coral con halo
  04-cerros-jinotega.svg      3 siluetas de cerros, casi invisibles
  03-ondas-oscuras.svg        3 ondas apiladas + 1 línea coral al 22 %
right/     panel crema (viewBox 780×1000)
  11-brillo-rosado.svg        degradado rosado (arriba-der.) y verde menta (abajo-izq.)
  10-contornos-claros.svg     curvas de nivel verdes, se desvanecen hacia los bordes
  13-orbitas-claras.svg       elipses + puntos coral (como los del diseño actual)
  12-ondas-claras.svg         ondas muy tenues al pie
divider/   corte orgánico entre paneles (viewBox 200×1000)
  20-borde-organico.svg       forma verde con sombra proyectada y línea de luz
  21-sombra-borde.svg         solo la sombra, por si ya tienes el corte en CSS/clip-path
extras/
  30-grano.svg                ruido fino (mosaico 300×300) para quitar el aspecto "plano"
  31-malla-puntos.svg         patrón de puntos, lado claro (31b: lado oscuro)
  32-rama-de-cafe.svg         rama de café en línea (guiño a Jinotega), coral al 38 %
  33-brillo-boton.svg         resplandor verde bajo el botón "Crear cuenta"
  34-sombra-tarjeta.svg       sombra + cristal para envolver el formulario (opcional)
  35-sombra-input.svg         sombra de 1 input (se estira en horizontal)
  36-brillo-tab-activo.svg    brillo bajo el tab activo "Crear una cuenta"
```

## Orden de capas recomendado (de atrás hacia adelante)

**Panel izquierdo:** `02` → `01` → `05` → `04` → `03` → contenido
**Panel derecho:** `11` → `10` → `13` → `12` → (`34` opcional) → contenido
**Encima de todo:** `20` en el borde entre paneles, y `30-grano` a pantalla completa.

## Uso rápido (CSS)

```css
.auth-left  { position: relative; background:#1B3A33; overflow:hidden; isolation:isolate; }
.auth-right { position: relative; background:#FCF8F5; overflow:hidden; isolation:isolate; }

.auth-layer {
  position:absolute; inset:0; width:100%; height:100%;
  object-fit:cover; pointer-events:none; user-select:none;
}
.auth-left > :not(.auth-layer), .auth-right > :not(.auth-layer) { position:relative; z-index:1; }

/* borde orgánico: ancla al borde derecho del panel izquierdo */
.auth-edge {
  position:absolute; top:0; bottom:0; right:-82px;   /* ajusta hasta que calce con tu corte */
  width:200px; height:100%; z-index:2; pointer-events:none;
}

/* grano global */
body::after{
  content:""; position:fixed; inset:0; z-index:50; pointer-events:none;
  background:url(/assets/auth/extras/30-grano.svg); opacity:.8;
}

/* malla de puntos (opcional) */
.auth-right::before{ content:""; position:absolute; inset:0;
  background:url(/assets/auth/extras/31-malla-puntos.svg);
  mask-image:radial-gradient(circle at 80% 20%, #000, transparent 60%); }
```

```html
<section class="auth-left">
  <img class="auth-layer" src="/assets/auth/left/02-resplandor-oscuro.svg" alt="" aria-hidden="true">
  <img class="auth-layer" src="/assets/auth/left/01-contornos-oscuros.svg" alt="" aria-hidden="true">
  <img class="auth-layer" src="/assets/auth/left/05-orbitas-oscuras.svg"   alt="" aria-hidden="true">
  <img class="auth-layer" src="/assets/auth/left/04-cerros-jinotega.svg"   alt="" aria-hidden="true">
  <img class="auth-layer" src="/assets/auth/left/03-ondas-oscuras.svg"     alt="" aria-hidden="true">
  <!-- contenido -->
  <img class="auth-edge"  src="/assets/auth/divider/20-borde-organico.svg" alt="" aria-hidden="true">
</section>
```

Sombras de componentes:

```css
.btn-primary{ position:relative; }
.btn-primary::after{ content:""; position:absolute; left:-4%; right:-4%; bottom:-34px; height:70px;
  background:url(/assets/auth/extras/33-brillo-boton.svg) center/100% 100% no-repeat;
  z-index:-1; pointer-events:none; }
/* alternativa sin archivo: box-shadow:0 14px 30px -12px rgba(47,95,82,.45) */
```

## Ajustar intensidad

- Más/menos presencia: cambia `opacity` del `<img>` (ej. `.auth-layer.contours{opacity:.7}`).
- Colores: edita los `fill`/`stroke` dentro del SVG, o inserta el SVG inline y usa variables CSS.
- Si cambias el fondo `#1B3A33`, actualiza también `20-borde-organico.svg` (`fill="#1B3A33"`).
- `20-borde-organico.svg` usa `preserveAspectRatio="none"` para estirarse a la altura del panel; la curva sigue la del mockup actual.

## Responsive

- En móvil oculta `.auth-edge`, `04-cerros` y `13-orbitas-claras` (`display:none`) y deja contornos + ondas.
- Los fondos usan `slice`, así que cubren cualquier proporción sin deformarse (excepto el borde, que es adrede).

## Rendimiento y accesibilidad

- Peso total ≈ 125 KB sin comprimir (bastante menos con gzip/brotli). Los contornos son lo más pesado; si quieres bajar más, pásalos por SVGO.
- Todos llevan `aria-hidden="true"`; úsalos con `alt=""` y `pointer-events:none`.
- `30-grano.svg` usa `feTurbulence`; es un mosaico pequeño, pero evítalo en dispositivos muy limitados.
- Contraste: ninguna capa supera ~9 % de opacidad detrás del texto, así que el contraste de títulos y labels no cambia.
- Si usas `prefers-reduced-transparency` o quieres modo alto contraste, simplemente oculta las capas.

## Animación opcional (muy sutil)

```css
@keyframes drift { to { transform: translate3d(0,-8px,0) } }
.auth-layer.waves { animation: drift 9s ease-in-out infinite alternate; }
@media (prefers-reduced-motion: reduce){ .auth-layer{ animation:none } }
```
