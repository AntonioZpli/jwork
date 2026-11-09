# Jinowork · Pack de texturas y formas SVG

Pack decorativo para quitar el aspecto plano de la landing sin competir con el contenido.
Abre `preview.html` en el navegador para ver todo el pack (las texturas muy tenues se ven mejor a tamaño real).

## Idea de diseño

Tres motivos, todos ligados a buscar trabajo y a conectar personas con empresas:

| Motivo | Dónde aparece | Qué comunica |
|---|---|---|
| **Curvas de nivel (topografía)** | Hero, empresas, footer | Jinotega y sus montañas; "encontrar tu camino" |
| **Red de nodos y rutas punteadas** | Oportunidades, hero, tarjetas de caminos | Conexión entre talento y empresas |
| **Rama de café** | Empresas, CTA, footer | Identidad local (Jinotega, capital del café) |

Reglas del pack: opacidad baja (4 % a 15 %), un solo acento (terracota) y nada de decoración encima del texto.

## Paleta

| Uso | Hex |
|---|---|
| Verde profundo (fondos oscuros) | `#14302A` |
| Verde tarjeta empresa | `#0F2A22` |
| Verde botón | `#2F5D50` |
| Terracota (acento) | `#C8553D` |
| Crema rosada (secciones) | `#F6EAE4` |
| Crema clara (secciones) | `#FCF8F5` |
| Crema para trazos sobre oscuro | `#F3E3DB` |

## Estructura

```
01-hero/             topografía, anillos, ruta de conexión
02-oportunidades/    red de nodos, mancha orgánica, arcos para tarjetas
03-dos-caminos/      órbitas, textura tarjeta candidatos, textura tarjeta empresas
04-empresas/         topografía, parche de puntos, esquinas
05-cta/              cordillera, anillos
06-footer/           topografía, ornamento divisor
shared/              grano, puntos, rayado, ondas divisorias, rama de café
spot-icons/          7 íconos de línea (green/ y cream/)
```

## Reglas generales de implementación

1. **Úsalos como `background-image` o `<img alt="" aria-hidden="true">`.** No los pegues inline: los ids internos de máscaras podrían chocar entre archivos.
2. **Siempre detrás del contenido.** Crea un contenedor `position:relative; isolation:isolate; overflow:hidden` y pon la decoración con `position:absolute; z-index:0; pointer-events:none`. El contenido va con `position:relative; z-index:1`.
3. **No se deforman:** usa `background-size: cover` (topografías), `contain` (formas sueltas) o tamaño fijo.
4. **En móvil** oculta las formas sueltas (`display:none` bajo 768 px) y deja solo las texturas de fondo.
5. **Peso:** todo el pack pesa ~340 KB sin comprimir. Pasa cada archivo por `svgo` antes de producción y sirve con gzip/brotli.
6. **Cambiar intensidad:** aplica `opacity` al elemento decorativo (por ejemplo `opacity:.7`) en lugar de editar el SVG.

Clase base sugerida:

```css
.deco { position:absolute; pointer-events:none; z-index:0; background-repeat:no-repeat; }
.has-deco { position:relative; isolation:isolate; overflow:hidden; }
.has-deco > .content { position:relative; z-index:1; }
```

---

## 01 · Hero (fondo verde oscuro)

Archivos: `hero-topo-dark.svg`, `hero-rings-accent.svg`, `hero-path-connection.svg`, `shared/dots-dark.svg`

Orden de capas: foto → degradado oscuro (el que ya tienes) → **topografía** → anillos → contenido.

```html
<section class="hero has-deco">
  <span class="deco hero-topo" aria-hidden="true"></span>
  <span class="deco hero-rings" aria-hidden="true"></span>
  <span class="deco hero-path" aria-hidden="true"></span>
  <div class="content">…</div>
</section>
```

```css
.hero-topo  { inset:0; background:url(assets/01-hero/hero-topo-dark.svg) left center/cover; }
.hero-rings { left:0; bottom:0; width:560px; height:560px; background:url(assets/01-hero/hero-rings-accent.svg) center/contain; }
.hero-path  { left:64px; bottom:48px; width:420px; height:180px; background:url(assets/01-hero/hero-path-connection.svg) center/contain; }
/* puntos solo en una esquina */
.hero::after { content:""; position:absolute; right:0; top:0; width:360px; height:260px; z-index:0; pointer-events:none;
  background:url(assets/shared/dots-dark.svg);
  -webkit-mask-image:linear-gradient(to bottom left,#000,transparent 70%);
          mask-image:linear-gradient(to bottom left,#000,transparent 70%); }
```

Notas:
- La topografía ya viene con degradado: es más visible a la izquierda (detrás del titular) y desaparece hacia la foto.
- `hero-path-connection` es opcional. Funciona mejor bajo los botones, en el espacio vacío antes de la curva inferior.
- Si la foto cubre toda la sección, pon la topografía con `mix-blend-mode: screen`.

## Transiciones entre secciones

Archivos: `shared/divider-wave-soft.svg`, `divider-wave-light.svg`, `divider-wave-dark.svg`

Cada onda lleva una línea fina terracota paralela. Se colocan en el borde superior de la sección siguiente:

```css
.section-next { position:relative; }
.section-next::before { content:""; position:absolute; left:0; right:0; top:-89px; height:90px;
  background:url(assets/shared/divider-wave-soft.svg) center/100% 100% no-repeat; pointer-events:none; }
```

Elige el color de relleno igual al fondo de la sección que viene debajo: `soft` = `#F6EAE4`, `light` = `#FCF8F5`, `dark` = `#14302A`.

## 02 · Oportunidades que inspiran (fondo `#F6EAE4`)

Archivos: `opp-network.svg`, `opp-blob-soft.svg`, `card-corner-arcs.svg`, `shared/grain-noise.svg`

```css
.opp { position:relative; isolation:isolate; overflow:hidden; background:#F6EAE4; }
.opp::before { content:""; position:absolute; inset:0; z-index:-1;
  background:url(assets/02-oportunidades/opp-network.svg) right top/cover no-repeat; }
.opp::after  { content:""; position:absolute; left:-160px; bottom:-200px; width:560px; height:560px; z-index:-1;
  background:url(assets/02-oportunidades/opp-blob-soft.svg) center/contain no-repeat; }

/* tarjetas de vacantes */
.job-card { position:relative; overflow:hidden; }
.job-card::before { content:""; position:absolute; top:0; right:0; width:120px; height:120px; pointer-events:none;
  background:url(assets/02-oportunidades/card-corner-arcs.svg) top right/contain no-repeat; }
.job-card > * { position:relative; }
```

Notas:
- La red está más visible arriba a la derecha, junto a "Ver todas las ofertas", y se apaga hacia las tarjetas.
- Los arcos de las tarjetas no deben tocar el logo de la empresa (esquina superior izquierda), por eso van a la derecha.
- Grano opcional para dar sensación de papel: `background-image:url(assets/shared/grain-noise.svg)` en un pseudo-elemento con `mix-blend-mode:multiply`.

## 03 · Dos caminos. Un lugar para conectar (fondo `#FCF8F5`)

Archivos: `caminos-orbits.svg`, `card-seeker-texture.svg`, `card-company-texture.svg`, `shared/motif-coffee-branch-green.svg`

**Fondo detrás del título (columna izquierda):**

```css
.caminos-intro { position:relative; }
.caminos-intro::before { content:""; position:absolute; left:-140px; top:-100px; width:760px; height:600px; z-index:-1;
  background:url(assets/03-dos-caminos/caminos-orbits.svg) center/contain no-repeat; }
```

**Tarjetas oscuras.** Aquí estaba el mayor vacío (el espacio entre la lista y el botón). Las texturas están pensadas para llenar justo esa zona:

```css
.card-seeker  { background:linear-gradient(135deg,#3A1B15,#7A3526); }
.card-company { background:#0F2A22; }
.card-seeker::before, .card-company::before { content:""; position:absolute; inset:0; pointer-events:none; }
.card-seeker::before  { background:url(assets/03-dos-caminos/card-seeker-texture.svg) center/cover no-repeat; }
.card-company::before { background:url(assets/03-dos-caminos/card-company-texture.svg) center bottom/cover no-repeat; }
.card-seeker > *, .card-company > * { position:relative; }
```

- **Candidatos:** ruta punteada con hitos que termina en un destino (pin), "tu camino hacia un empleo".
- **Empresas:** perfil de edificios con ventanas; algunas ventanas en terracota (puestos abiertos).

Sugerencia: alinea el texto de las tarjetas a la izquierda. El contenido centrado más las texturas deja el centro muy cargado.

## 04 · Para empresas (fondo `#F6EAE4`)

Archivos: `empresas-bg-topo.svg`, `empresas-dots-patch.svg`, `empresas-bracket.svg`, `shared/motif-coffee-branch-green.svg`

**Foto con marco desplazado** (le da profundidad a la imagen). El marco se hace con CSS para que no se deforme; el SVG aporta los detalles:

```html
<figure class="photo-frame">
  <img src="…" alt="…">
  <span class="deco dots" aria-hidden="true"></span>
  <span class="deco bracket bracket--tl" aria-hidden="true"></span>
  <span class="deco bracket bracket--br" aria-hidden="true"></span>
</figure>
```

```css
.photo-frame { position:relative; margin:0; }
.photo-frame::before { content:""; position:absolute; inset:0; transform:translate(18px,18px); z-index:0;
  border:1.5px solid rgba(200,85,61,.45); border-radius:6px; }
.photo-frame img { position:relative; z-index:1; display:block; width:100%; border-radius:6px; }
.photo-frame .dots { z-index:0; right:-44px; bottom:-44px; width:120px; height:120px; background:url(assets/04-empresas/empresas-dots-patch.svg) center/contain; }
.photo-frame .bracket { z-index:2; width:44px; height:44px; background:url(assets/04-empresas/empresas-bracket.svg) center/contain; }
.photo-frame .bracket--tl { left:-12px; top:-12px; }
.photo-frame .bracket--br { right:-12px; bottom:-12px; transform:rotate(180deg); }

/* fondo de la sección */
.empresas::before { content:""; position:absolute; inset:0; z-index:-1;
  background:url(assets/04-empresas/empresas-bg-topo.svg) right center/cover no-repeat; }
```

Opcional: la rama de café (`motif-coffee-branch-green.svg`) a la derecha del titular, a 180 px de alto, con `opacity:.8`.

## 05 · CTA final (sobre foto de Jinotega)

Archivos: `cta-ridges.svg`, `cta-rings.svg`, `shared/motif-coffee-branch-cream.svg`

Va sobre la foto con su overlay oscuro. Las crestas imitan las montañas de la propia foto y refuerzan la base de la sección.

```css
.cta { position:relative; isolation:isolate; overflow:hidden; }
.cta::before { content:""; position:absolute; left:0; right:0; bottom:0; height:260px; z-index:0; pointer-events:none;
  background:url(assets/05-cta/cta-ridges.svg) center bottom/cover no-repeat; }
.cta .rings { position:absolute; right:-60px; top:50%; width:520px; height:520px; transform:translateY(-50%); z-index:0;
  background:url(assets/05-cta/cta-rings.svg) center/contain no-repeat; pointer-events:none; }
```

Notas:
- Los anillos se centran detrás del botón "Comenzar ahora": atraen la mirada sin añadir otro elemento.
- Mantén visible el crédito de la foto (`CC BY-SA 4.0`) por encima de la decoración.

## 06 · Footer (fondo `#14302A`)

Archivos: `footer-topo.svg`, `footer-ornament.svg`, `shared/motif-coffee-branch-cream.svg`

```css
.footer { position:relative; isolation:isolate; overflow:hidden; }
.footer::before { content:""; position:absolute; inset:0; z-index:-1;
  background:url(assets/06-footer/footer-topo.svg) center top/cover no-repeat; }
.footer-ornament { display:block; width:min(600px,100%); height:24px; margin:0 auto 32px;
  background:url(assets/06-footer/footer-ornament.svg) center/contain no-repeat; }
```

Usa el ornamento como separador entre las columnas de enlaces y la línea de copyright. El contraste del texto pequeño del footer es bajo: súbelo a `rgba(243,227,219,.75)` como mínimo.

---

## Íconos de apoyo (`spot-icons/`)

Siete ilustraciones de línea (120×120): `buscar-talento`, `empleo-maletin`, `equipo`, `empresa`, `ruta-destino`, `match`, `perfil-cv`. Hay versión `green/` (fondos claros) y `cream/` (fondos oscuros).

Usos recomendados:
- **Marca de agua grande** (240–320 px, `opacity:.08`) en una esquina de una sección.
- **Pasos de "Cómo funciona"**: `perfil-cv` → `buscar-talento` → `match`.
- **Estados vacíos**: "Aún no hay vacantes", resultados sin coincidencias.

Para cambiar el color con CSS, pega el SVG inline y cambia `stroke` del `<g>`.

## Animaciones opcionales (muy sutiles)

Úsalas en un solo lugar para que no se vea recargado. Por ejemplo, la ruta del hero:

```css
@media (prefers-reduced-motion: no-preference) {
  .hero-topo { animation: drift 40s ease-in-out infinite alternate; }
  @keyframes drift { to { transform: translate3d(-24px,-12px,0) scale(1.03); } }
}
```

