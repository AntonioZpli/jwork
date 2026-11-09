<div align="center">

<img src="frontend/public/images/brand/logo.svg" alt="Jinowork" width="260" />

<h3>Conectamos talento y oportunidades en un solo lugar.</h3>

Plataforma de búsqueda y gestión de empleo para el mercado laboral nicaragüense,<br/>
con raíces en <b>Jinotega</b>.

<br/>

<img src="docs/badges/vue.svg" alt="Vue 3" height="32" />
<img src="docs/badges/typescript.svg" alt="TypeScript" height="32" />
<img src="docs/badges/vite.svg" alt="Vite" height="32" />
<img src="docs/badges/pinia.svg" alt="Pinia" height="32" />
<img src="docs/badges/fastify.svg" alt="Fastify" height="32" />
<img src="docs/badges/prisma.svg" alt="Prisma 7" height="32" />
<img src="docs/badges/postgresql.svg" alt="PostgreSQL" height="32" />
<img src="docs/badges/vitest.svg" alt="Vitest" height="32" />

<a href="#características-principales">Características</a> · <a href="#cómo-funciona">Cómo funciona</a> · <a href="#arquitectura">Arquitectura</a> · <a href="#instalación-paso-a-paso">Instalación</a> · <a href="#sistema-de-diseño">Sistema de diseño</a> · <a href="#equipo">Equipo</a>

<br/>

<img src="https://i.pinimg.com/736x/1f/6e/82/1f6e82e7032af73f6f2e97166c010c6b.jpg" alt="Jinowork" width="720" />

</div>

---

## Tabla de contenidos

1. [¿Qué es Jinowork?](#qué-es-jinowork)
2. [Características principales](#características-principales)
3. [Cómo funciona](#cómo-funciona)
4. [Roles de usuario](#roles-de-usuario)
5. [Tecnologías utilizadas](#tecnologías-utilizadas)
6. [Arquitectura](#arquitectura)
7. [Estructura del repositorio](#estructura-del-repositorio)
8. [Modelo de datos](#modelo-de-datos)
9. [API del backend](#api-del-backend)
10. [Instalación paso a paso](#instalación-paso-a-paso)
11. [Variables de entorno](#variables-de-entorno)
12. [Comandos de desarrollo](#comandos-de-desarrollo)
13. [Scripts de utilidad](#scripts-de-utilidad)
14. [Sistema de diseño](#sistema-de-diseño)
15. [Pruebas y calidad de código](#pruebas-y-calidad-de-código)
16. [Convenciones del proyecto](#convenciones-del-proyecto)
17. [Preguntas frecuentes](#preguntas-frecuentes)
18. [Estado y hoja de ruta](#estado-y-hoja-de-ruta)
19. [Equipo](#equipo)

---

## ¿Qué es Jinowork?

**Jinowork** es una bolsa de trabajo digital pensada para Nicaragua, con especial atención a
Jinotega. Reúne en un mismo lugar a dos grupos que normalmente se buscan por canales distintos
(redes sociales, mensajes, carteles):

- **Candidatos**, que quieren encontrar empleo, mostrar su perfil profesional y postularse.
- **Empresas**, que quieren publicar vacantes, recibir postulaciones y organizar su proceso de
  contratación.

Además existe un tercer actor, la **administración**, que verifica empresas, modera contenido y
mantiene la plataforma sana.

> **En una frase:** el candidato completa su perfil una vez, la empresa publica una vacante, y
> Jinowork se encarga de conectarlos, registrar cada paso y mantener el historial.

<div align="center">
<img src="frontend/public/images/brand/isotipo.svg" alt="Isotipo de Jinowork" width="72" />
</div>

---

## Características principales

### Para candidatos

| Función | Qué te permite hacer |
|---|---|
| **Explorar ofertas** | Ver vacantes publicadas y vigentes, con requisitos, modalidad y salario. |
| **Perfil profesional** | Guardar datos personales, foto, CV, área profesional, especialización, departamento y municipio. |
| **Trayectoria** | Registrar experiencia laboral, formación académica e idiomas. |
| **Postulación validada** | Postularte a una vacante solo cuando tu perfil está completo. |
| **Ofertas guardadas** | Marcar vacantes como favoritas (`SavedJob`) para volver a ellas. |
| **Panel personal** | Ver postulaciones enviadas, ofertas guardadas y actividad reciente. |
| **Seguimiento** | Consultar el estado de cada postulación en cualquier momento. |

### Para empresas

| Función | Qué te permite hacer |
|---|---|
| **Perfil empresarial** | Gestionar los datos de la empresa y su estado de verificación. |
| **Publicar vacantes** | Crear, editar y archivar ofertas laborales. |
| **Gestionar postulantes** | Consultar y filtrar candidatos por oferta o de forma global. |
| **Ver perfiles** | Revisar el perfil profesional completo de cada candidato. |
| **Panel de métricas** | Total de ofertas, ofertas publicadas y postulaciones pendientes. |
| **Estadísticas** | Visualizaciones por oferta (`JobView`, `JobDailyStats`, `CompanyDailyStats`). |

### Para administradores

- Rol `SUPERADMIN` creado con un script de arranque seguro.
- **Invitaciones de administrador** mediante tokens (`AdminInvitation`).
- **Registro de auditoría** (`AuditLog`) y **acciones de moderación** (`ModerationAction`).
- **Reportes con evidencias** (`Report`, `ReportEvidence`).

### Interfaz y experiencia de usuario

- Interfaz **100 % en español** (`lang="es"`).
- **Modo claro y oscuro** con preferencia guardada en el navegador.
- Navegación y menús distintos según el rol (candidato o empresa).
- Diseño **adaptable** a móvil, tablet y escritorio.
- Accesibilidad: anillos de foco visibles, roles `aria-*` y respeto por `prefers-reduced-motion`.
- Autenticación completa: verificación de correo, recuperación de contraseña, alertas de
  seguridad de inicio de sesión y dispositivos de confianza.

---

## Cómo funciona

### El recorrido del candidato

```mermaid
flowchart LR
    A([Crear cuenta]) --> B[Verificar correo]
    B --> C[Completar perfil<br/>y onboarding]
    C --> D[Explorar ofertas]
    D --> E{¿Perfil<br/>completo?}
    E -- No --> C
    E -- Sí --> F[Postularse]
    F --> G([Seguir el estado])
```

### El recorrido de la empresa

```mermaid
flowchart LR
    A([Crear cuenta de empresa]) --> B[Completar perfil<br/>empresarial]
    B --> C[Publicar vacante]
    C --> D[Recibir postulaciones]
    D --> E[Revisar perfiles<br/>y filtrar]
    E --> F([Actualizar estado<br/>de cada postulante])
```

### Ciclo de vida de una postulación

Cada postulación pasa por estados definidos (`ApplicationStatus`). Cada cambio se guarda en
`ApplicationStatusHistory`, de modo que existe un historial inalterable de quién cambió qué y
cuándo.

```mermaid
stateDiagram-v2
    [*] --> RECEIVED: el candidato se postula
    RECEIVED --> IN_REVIEW
    IN_REVIEW --> SHORTLISTED
    SHORTLISTED --> INTERVIEW
    INTERVIEW --> SELECTED
    IN_REVIEW --> REJECTED
    SHORTLISTED --> REJECTED
    INTERVIEW --> REJECTED
    RECEIVED --> WITHDRAWN: el candidato retira
    IN_REVIEW --> WITHDRAWN
    SELECTED --> [*]
    REJECTED --> [*]
    WITHDRAWN --> [*]
```

| Estado | Significado |
|---|---|
| `RECEIVED` | La empresa aún no ha revisado la postulación. |
| `IN_REVIEW` | La empresa está evaluando el perfil. |
| `SHORTLISTED` | El candidato pasó a la lista corta. |
| `INTERVIEW` | Hay una entrevista programada o realizada. |
| `SELECTED` | El candidato fue seleccionado. |
| `REJECTED` | La postulación no continuó. |
| `WITHDRAWN` | El propio candidato retiró su postulación. |

> Las postulaciones se crean dentro de **transacciones serializables**, lo que evita duplicados
> y condiciones de carrera cuando dos solicitudes llegan al mismo tiempo.

---

## Roles de usuario

| Rol | Descripción | Espacio de trabajo |
|---|---|---|
| `CANDIDATE` | Busca empleo, postula y gestiona su perfil profesional. | Panel de candidato |
| `COMPANY` | Publica ofertas y gestiona postulantes. | Panel de empresa |
| `ADMIN` / `SUPERADMIN` | Moderación, verificación de empresas y administración. | Panel de administración |

El acceso a cada espacio se controla con el metadato **`workspaceRole`** en las rutas de
Vue Router: si el rol del usuario no coincide, la navegación se bloquea.

---

## Tecnologías utilizadas

### Frontend

| Tecnología | Para qué se usa |
|---|---|
| **Vue 3** (Composition API) | Construcción de la interfaz. |
| **TypeScript** | Tipado estático y código más mantenible. |
| **Vite** | Servidor de desarrollo y compilación de producción. |
| **Pinia** | Estado global de la aplicación. |
| **Vue Router 4** | Navegación (modo historial HTML5) y control de acceso por rol. |
| **Lucide** | Iconografía. |
| **Vitest + Vue Test Utils + JSDOM** | Pruebas unitarias de componentes. |
| **oxlint + ESLint** | Análisis estático del código. |

### Backend

| Tecnología | Para qué se usa |
|---|---|
| **Fastify** | Servidor HTTP de la API. |
| **Prisma ORM 7** | Modelado de datos, migraciones y cliente tipado. |
| **PostgreSQL** | Base de datos relacional. |
| **Vitest** | Pruebas de autenticación, ofertas, postulaciones y correo. |

### Tipografías

- **DM Sans** — texto general de la interfaz.
- **Manrope** — monograma y marca.

---

## Arquitectura

Jinowork es un **monorepo** con dos espacios de trabajo independientes: `frontend/` (aplicación
de una sola página) y `backend/` (API y capa de datos).

```mermaid
flowchart TB
    subgraph Cliente["frontend/ — SPA Vue 3"]
        direction TB
        V[Views<br/>Home · Auth · About · Workspaces]
        C[Components<br/>ui · layout · landing · auth · workspace]
        S[Stores Pinia]
        SV[Services<br/>cliente de la API]
        R[Router<br/>guards por workspaceRole]
        V --> C
        V --> S
        S --> SV
        R --> V
    end

    subgraph Servidor["backend/ — Fastify"]
        direction TB
        RT[Routes<br/>auth · jobs · profiles · workspace…]
        LIB[lib<br/>autenticación · correo · validación]
        PR[Prisma Client generado]
        RT --> LIB
        RT --> PR
    end

    DB[(PostgreSQL)]

    SV -- HTTP / JSON --> RT
    PR --> DB
```

### Cómo arranca el frontend

1. `index.html` carga las fuentes (DM Sans y Manrope) y define el nodo `#app`.
2. `main.ts` importa los estilos globales, crea la app, registra **Pinia** y el **router**, y
   monta `App.vue`.
3. `App.vue` es un contenedor mínimo (`.app-shell`) que muestra la vista activa con `RouterView`.
4. El router decide qué vista se muestra según la URL y el rol del usuario.

### Rutas públicas

| Ruta | Vista | Notas |
|---|---|---|
| `/` | `HomeView` | Página principal con hero, ofertas destacadas, cómo funciona, empresas y llamada a la acción. |
| `/auth` | `AuthView` | Inicio de sesión y registro, con diseño de pantalla dividida. |
| `/about` | `AboutView` | Página informativa, cargada de forma diferida (lazy loading). |

### Cómo arranca el backend

1. `prisma7.config.ts` define la ubicación del esquema y de las migraciones.
2. `src/config.ts` lee la configuración del entorno.
3. `src/app.ts` crea el servidor Fastify y registra los módulos de rutas.
4. El cliente de Prisma, generado en `src/generated/prisma`, da acceso tipado a la base de datos.

---

## Estructura del repositorio

```text
jwork/
├── frontend/
│   ├── public/
│   │   └── images/
│   │       ├── brand/            # logo.svg · isotipo.svg
│   │       └── landing/          # Fotografías WebP (hero, empresas, fondo de auth)
│   ├── src/
│   │   ├── assets/               # main.css (tokens) · base.css (reseteo)
│   │   ├── components/
│   │   │   ├── auth/             # Formularios y paneles de autenticación
│   │   │   ├── landing/          # Secciones de la página principal
│   │   │   ├── layout/           # SiteHeader · SiteFooter
│   │   │   ├── ui/               # AppButton · AppIconButton · AppInput · AppNotice · AppBrand
│   │   │   └── workspace/        # Marco y navegación del espacio de trabajo
│   │   ├── composables/          # useTheme · useEscapeKey · useAuthForm
│   │   ├── config/               # assets.ts (registro central de rutas de recursos)
│   │   ├── data/                 # Datos de referencia (p. ej. FEATURED_JOBS)
│   │   ├── router/               # Rutas y guards por rol
│   │   ├── services/             # Cliente de la API
│   │   ├── stores/               # Estado global con Pinia
│   │   ├── types/                # Tipos e interfaces (Job, Modality, ContractType…)
│   │   ├── views/                # Vistas principales
│   │   ├── App.vue               # Componente raíz
│   │   └── main.ts               # Punto de entrada
│   ├── index.html
│   ├── vite.config.ts            # Alias "@" → src
│   ├── vitest.config.ts
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/           # Historial de migraciones
│   │   ├── seed/                 # Datos semilla (ubicaciones de Nicaragua)
│   │   └── schema.prisma         # Esquema de datos
│   ├── scripts/
│   │   ├── bootstrap-superadmin.ts
│   │   └── seed-locations.ts
│   ├── src/
│   │   ├── generated/prisma/     # Cliente y modelos generados (no editar a mano)
│   │   ├── lib/                  # Autenticación, correo, validación, catálogos
│   │   ├── routes/               # Endpoints de la API
│   │   ├── admin.ts              # Lógica de administración
│   │   ├── app.ts                # Servidor Fastify
│   │   └── config.ts             # Configuración
│   ├── prisma7.config.ts
│   ├── skills-lock.json
│   └── package.json
│
├── README.md
└── auth-preview.png
```

> **Tip:** `backend/src/generated/` lo produce Prisma. Si cambias `schema.prisma`, vuelve a
> generar el cliente en lugar de editar esos archivos.

---

## Modelo de datos

El esquema (`backend/prisma/schema.prisma`) cubre cinco dominios.

```mermaid
erDiagram
    User ||--o{ Session : tiene
    User ||--o| CandidateProfile : "es candidato"
    User ||--o{ CompanyMember : "pertenece a"
    CompanyProfile ||--o{ CompanyMember : agrupa
    CompanyProfile ||--o{ Job : publica
    Job ||--o{ Application : recibe
    CandidateProfile ||--o{ Application : envía
    Application ||--o{ ApplicationStatusHistory : registra
    CandidateProfile ||--o{ SavedJob : guarda
    Job ||--o{ SavedJob : "es guardada"
    Job ||--o{ JobView : "es vista"
    Department ||--o{ Municipality : contiene
    Department ||--o{ Job : ubica
    ProfessionalArea ||--o{ Specialization : incluye
```

| Dominio | Modelos |
|---|---|
| **Usuarios y autenticación** | `User`, `Session`, `OAuthAccount`, `VerificationToken`, `AdminInvitation` |
| **Perfiles** | `CandidateProfile`, `CompanyProfile`, `CompanyMember`, `Experience`, `Education`, `CandidateLanguage`, `Language` |
| **Empleos** | `Job`, `Application`, `ApplicationStatusHistory`, `SavedJob`, `JobView`, `JobDailyStats`, `CompanyDailyStats` |
| **Catálogos** | `Department`, `Municipality`, `EconomicSector`, `ProfessionalArea`, `Specialization` |
| **Moderación** | `Report`, `ReportEvidence`, `ModerationAction`, `AuditLog`, `Notification` |

### Un vistazo al modelo `Job`

| Grupo | Campos |
|---|---|
| Identidad | `id`, `companyProfileId`, `createdByUserId` |
| Contenido | `title`, `description`, `requirements` |
| Ubicación y área | `departmentId`, `municipalityId`, `professionalAreaId`, `specializationId` |
| Modalidad | `workMode`, `remoteScope`, `contractType`, `workday`, `scheduleType`, `scheduleDescription` |
| Salario | `salaryMin`, `salaryMax`, `salaryCurrency`, `salaryPeriod`, `salaryNegotiable` |
| Ciclo de vida | `experienceYearsMin`, `isUrgent`, `vacancies`, `status`, `publishedAt`, `expiresAt`, `createdAt`, `updatedAt` |

### Detalles de diseño que conviene conocer

- **`SavedJob`** usa una clave única compuesta (`candidateProfileId` + `jobId`): un candidato no
  puede guardar la misma oferta dos veces.
- **`JobView`** registra visitas de candidatos y de visitantes anónimos; para estos últimos
  guarda un hash de IP (`ipHash`) y el `userAgent`, no la IP en claro.
- **`ApplicationStatusHistory`** guarda `previousStatus`, `newStatus`, `changedByUserId` y un
  `comment`: es una pista de auditoría de cada transición.

### Enumeraciones relevantes

| Enum | Valores |
|---|---|
| `WorkMode` | `ONSITE`, `HYBRID`, `REMOTE` (presencial, híbrido, remoto) |
| `ApplicationStatus` | `RECEIVED`, `IN_REVIEW`, `SHORTLISTED`, `INTERVIEW`, `SELECTED`, `REJECTED`, `WITHDRAWN` |
| `UserRole` | Roles de usuario: candidato, empresa, administrador y superadministrador (ver `schema.prisma` para los valores exactos). |
| `JobStatus` | Estados de publicación de una oferta (ver `schema.prisma`). |
| `TokenType` | Verificación de correo, recuperación de contraseña, `ADMIN_INVITATION`, etc. |

---

## API del backend

Grupos de rutas registrados en Fastify:

| Módulo | Responsabilidad |
|---|---|
| `routes/auth/*` | Registro, sesiones, verificación de correo, contraseñas, seguridad e invitaciones de administrador. |
| `routes/publicJobs.ts` | Listado público de ofertas. |
| `routes/jobs.ts` | Gestión de ofertas por parte de la empresa. |
| `routes/candidateJobs.ts` | Postulación a vacantes y ofertas guardadas del candidato. |
| `routes/companyApplications.ts` | Consulta de postulantes por parte de la empresa. |
| `routes/workspace.ts` | Paneles: `/api/candidate/dashboard` y `/api/company/dashboard`. |
| `routes/profiles.ts` | Gestión de perfiles de candidato y empresa. |
| `routes/onboarding.ts` | Flujo de incorporación inicial. |
| `routes/candidateFiles.ts` | Carga de archivos del candidato (CV y foto). |

---

## Instalación paso a paso

### Requisitos previos

| Herramienta | Versión |
|---|---|
| [Node.js](https://nodejs.org/) | `^22.18.0` o `>=24.12.0` |
| [pnpm](https://pnpm.io/) | Última estable |
| [PostgreSQL](https://www.postgresql.org/) | En ejecución y accesible |
| [Git](https://git-scm.com/) | Cualquier versión reciente |

### 1. Clonar el repositorio

```bash
git clone https://github.com/AntonioZpli/jwork.git
cd jwork
```

### 2. Levantar el frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Vite mostrará en la terminal la dirección local (normalmente `http://localhost:5173`).

### 3. Preparar el backend

```bash
cd backend
pnpm install
```

> Durante `install` se ejecuta un `postinstall` que sincroniza las skills de Prisma CLI; los
> hashes quedan registrados en `skills-lock.json`.

Después:

1. **Configura las variables de entorno** (ver la sección siguiente).
2. **Aplica las migraciones** con Prisma 7 para crear las tablas.
3. **Carga las ubicaciones de Nicaragua** (departamentos y municipios):

   ```bash
   pnpm tsx scripts/seed-locations.ts
   ```

4. **(Opcional) Crea el superadministrador:**

   ```bash
   pnpm tsx scripts/bootstrap-superadmin.ts
   ```

> **Nota:** revisa `backend/package.json` para ver los nombres exactos de los comandos de
> arranque y de pruebas; pueden variar según la configuración del proyecto.

### 4. Comprobar que todo funciona

- Abre la dirección que mostró Vite: debe verse la página principal.
- Entra a `/auth` para ver el registro e inicio de sesión.
- Cambia entre modo claro y oscuro: la preferencia se conserva al recargar.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. |
| Variables de correo | Credenciales del servicio de envío (verificación y alertas de seguridad). |
| Variables de sesión | Secreto y opciones de las cookies de sesión. |

Ejemplo ilustrativo de `DATABASE_URL`:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/jinowork"
```

La lista exacta está en `backend/src/config.ts` y `backend/prisma7.config.ts`.

> **Importante:** nunca subas tu archivo `.env` al repositorio. Contiene secretos.

---

## Comandos de desarrollo

### Frontend (`frontend/`)

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Inicia el servidor de desarrollo de Vite. |
| `pnpm build` | Revisa los tipos con `vue-tsc` y genera la compilación de producción. |
| `pnpm preview` | Previsualiza la compilación generada. |
| `pnpm test:unit` | Ejecuta las pruebas unitarias con Vitest. |
| `pnpm lint` | Ejecuta oxlint y ESLint. |

### Backend (`backend/`)

El backend incluye pruebas con Vitest (`*.test.ts`) para autenticación, validación de ofertas,
postulaciones y correo. Consulta `backend/package.json` para los comandos exactos.

---

## Scripts de utilidad

| Script | Propósito |
|---|---|
| `backend/scripts/seed-locations.ts` | Carga departamentos y municipios de Nicaragua desde `prisma/seed/nicaragua-locations.json`. |
| `backend/scripts/bootstrap-superadmin.ts` | Crea la cuenta inicial de superadministrador. |

---

## Sistema de diseño

La interfaz se construye sobre **tokens de diseño en CSS** definidos con el espacio de color
**`oklch()`**, que ofrece colores más uniformes y predecibles entre modo claro y oscuro.

### Identidad visual

| Recurso | Ruta | Uso |
|---|---|---|
| Logo completo | `frontend/public/images/brand/logo.svg` | Cabeceras amplias, README. |
| Isotipo | `frontend/public/images/brand/isotipo.svg` | Espacios reducidos, avatares. |
| Fotografías | `frontend/public/images/landing/*.webp` | Hero, empresas y fondo de autenticación. |

Todas las rutas de recursos se centralizan en `frontend/src/config/assets.ts`
(`HERO_IMAGE`, `COMPANIES_IMAGE`, `AUTH_BACKGROUND_IMAGE`, `ISOTIPO_SRC`, `LOGO_SRC`), así que
cambiar una imagen no exige tocar los componentes.

El componente `AppBrand` ofrece dos variantes: `mark` (monograma **J**) y `full` (la palabra
**Jinowork** con un punto final en el color primario).

### Tokens de color

Definidos en `frontend/src/assets/main.css`: `:root` para el modo claro y `html.dark` para el
oscuro.

| Grupo | Tokens |
|---|---|
| Superficies | `--background`, `--surface`, `--panel`, `--surface-strong`, `--surface-soft`, `--surface-elevated` |
| Texto | `--foreground`, `--text`, `--muted-foreground`, `--text-soft` |
| Acentos e interacción | `--primary`, `--secondary`, `--accent`, `--accent-soft`, `--accent-strong` |
| Utilidad | `--border`, `--shadow` |

### Componentes base (`components/ui/`)

| Componente | Props principales |
|---|---|
| `AppButton` | `variant` (`primary` · `secondary` · `ghost`), `size` (`sm` · `md` · `lg`), `disabled`, `type`, `submit` |
| `AppIconButton` | `label`, `ariaLabel`, `disabled` |
| `AppInput` | `id`, `label`, `modelValue`, `type`, `placeholder`, `autocomplete`, `error`, `required` |
| `AppNotice` | `variant` (`info` · `demo`), evento `dismiss` |
| `AppBrand` | `variant` (`mark` · `full`) |

Ejemplo de uso:

```vue
<AppInput
  id="email"
  v-model="email"
  label="Correo electrónico"
  type="email"
  autocomplete="email"
  :error="errors.email"
  required
/>

<AppButton variant="primary" size="lg" type="submit">
  Crear cuenta
</AppButton>
```

### Principios que siguen los componentes

- **Radio de borde de 6 px** en todos los componentes base.
- **Foco visible**: contorno de 2 px con `--primary`.
- **Movimiento reducido**: se desactivan las transiciones si el usuario lo pide.
- **Accesibilidad**: `AppInput` enlaza errores con `aria-describedby` y `aria-invalid`, y los
  anuncia con `role="alert"`; `AppNotice` usa `role="status"` y `aria-live="polite"`.

### Modo claro y oscuro

El composable `useTheme` resuelve el tema inicial en este orden:

1. El valor guardado en `localStorage` bajo la clave `jinowork-theme`.
2. Si no existe, la preferencia del sistema (`prefers-color-scheme: dark`).

Un `watchEffect` aplica o quita la clase `dark` en `<html>` y guarda la elección.

```ts
const { theme, toggleTheme } = useTheme()
```

Para accesibilidad, `useEscapeKey` registra un manejador de la tecla `Esc` (útil en modales y
paneles) y lo limpia al desmontar el componente.

### Diseño responsivo

| Vista | Ancho máximo | Comportamiento |
|---|---|---|
| `HomeView` | `min(1600px, 100%)` | Relleno lateral fluido; 20 px en pantallas de 560 px o menos. |
| `AuthView` | Pantalla dividida | Panel de historia + formulario; en 760 px o menos pasa a una columna con cabecera móvil. |

---

## Pruebas y calidad de código

| Herramienta | Función |
|---|---|
| **Vitest** | Ejecuta las pruebas. |
| **Vue Test Utils** | Monta componentes para probarlos. |
| **JSDOM** | Simula el navegador. |
| **vue-tsc** | Revisa tipos dentro de `pnpm build`. |
| **oxlint + ESLint** | Detectan errores y malas prácticas. |

### Cómo añadir una prueba

1. Crea el archivo junto al componente, en una carpeta `__tests__/` o con el sufijo
   `.spec.ts` / `.test.ts`.
2. Monta el componente con `mount` (o `shallowMount` para aislarlo).
3. Verifica con `expect` el HTML, los eventos emitidos o el estado.

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '@/components/ui/AppButton.vue'

describe('AppButton', () => {
  it('muestra el texto del slot', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Postularme' } })
    expect(wrapper.text()).toContain('Postularme')
  })
})
```

> El alias `@` apunta a `frontend/src`, por lo que puedes importar con `@/components/...`.

---

## Convenciones del proyecto

| Elemento | Regla | Ejemplo |
|---|---|---|
| Componentes Vue | `PascalCase` | `HomeView.vue`, `AppButton.vue` |
| Composables | Prefijo `use` en `camelCase` | `useAuthForm`, `useTheme` |
| Tipos e interfaces | `PascalCase` | `Job`, `Modality`, `JobCategory` |
| Estilos | CSS moderno con tokens `oklch()` | `var(--primary)` |
| Modo oscuro | Selector `html.dark` | — |
| Recursos estáticos | Registrados en `config/assets.ts` | `LOGO_SRC` |

---

## Preguntas frecuentes

<details>
<summary><strong>¿Por qué no puedo postularme a una vacante?</strong></summary>

La postulación exige un perfil completo. Revisa tus datos personales, CV, área profesional y
ubicación; al completarlos podrás postularte.
</details>

<details>
<summary><strong>¿Cómo creo la primera cuenta de administrador?</strong></summary>

Con el script `bootstrap-superadmin.ts`. Después, ese superadministrador puede invitar a otros
administradores mediante tokens de invitación.
</details>

<details>
<summary><strong>¿Por qué un departamento o municipio no aparece en los formularios?</strong></summary>

Probablemente falta cargar los datos semilla. Ejecuta `seed-locations.ts` para poblar los
departamentos y municipios de Nicaragua.
</details>

<details>
<summary><strong>Cambié <code>schema.prisma</code> y el código no ve los cambios.</strong></summary>

Genera de nuevo el cliente de Prisma y aplica la migración. Los archivos de
`backend/src/generated/` no deben editarse a mano.
</details>

<details>
<summary><strong>¿Cómo cambio las imágenes de la página principal?</strong></summary>

Reemplaza el archivo en `frontend/public/images/landing/` o actualiza la ruta
correspondiente en `frontend/src/config/assets.ts`.
</details>

<details>
<summary><strong>¿Puedo usar npm en lugar de pnpm?</strong></summary>

Los scripts son los mismos (`npm run dev`, `npm run build`…), pero el proyecto está pensado para
pnpm; usarlo evita diferencias en el árbol de dependencias.
</details>

---

## Estado y hoja de ruta

Jinowork está en **desarrollo activo**. Hoy el repositorio contiene la aplicación frontend, y un
backend con esquema de datos, migraciones, rutas de API, autenticación y lógica de
administración.

- [x] Landing page y diseño responsivo con modo claro/oscuro
- [x] Sistema de diseño con tokens `oklch()` y componentes base accesibles
- [x] Esquema de datos completo con migraciones
- [x] Autenticación (correo, contraseñas, seguridad, invitaciones)
- [x] Paneles de candidato y empresa
- [x] Postulaciones con historial de estados
- [x] Panel de moderación para administradores

**Ideas a futuro:**

- [ ] Notificaciones al usuario (`Notification`)
- [ ] Estadísticas avanzadas para empresas (`JobDailyStats`, `CompanyDailyStats`)

---

## Objetivo

Contribuir a una búsqueda de empleo más **accesible y organizada**: que los candidatos
encuentren oportunidades acordes con su perfil y que las empresas gestionen su contratación desde
una plataforma común.

---

## Equipo

Desarrollado por [**Antonio**](https://github.com/AntonioZpli), **Ethan** y **Diego**.

![equipo](https://i.pinimg.com/1200x/86/be/9a/86be9aef2ec6bb050c50f086dcbd55aa.jpg)

---

<div align="center">

<img src="frontend/public/images/brand/isotipo.svg" alt="Jinowork" width="40" />

<a href="https://github.com/AntonioZpli/jwork">github.com/AntonioZpli/jwork</a>

</div>
