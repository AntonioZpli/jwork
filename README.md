# Jinowork

**Conectamos talento y oportunidades en un solo lugar.**

Jinowork es una plataforma de búsqueda y gestión de empleo enfocada en el mercado laboral nicaragüense, con especial atención a Jinotega. Su objetivo es facilitar la conexión entre candidatos y empresas mediante herramientas digitales para explorar oportunidades laborales, gestionar perfiles profesionales y organizar procesos de contratación.

![Jinowork](https://i.pinimg.com/736x/1f/6e/82/1f6e82e7032af73f6f2e97166c010c6b.jpg)

## Características principales

### Para candidatos
- Exploración de ofertas de empleo.
- Consulta de información y requisitos de cada vacante.
- Gestión de perfiles profesionales.
- Registro de experiencia laboral y formación académica.
- Seguimiento de postulaciones.

### Para empresas
- Gestión de perfiles empresariales.
- Publicación y administración de ofertas laborales.
- Consulta y gestión de candidatos.
- Organización de procesos de selección.

### Interfaz y experiencia de usuario
- Interfaz en español.
- Navegación mediante rutas de la aplicación.
- Componentes reutilizables y estilos centralizados.
- Diseño adaptable a diferentes tamaños de pantalla.
- Formularios de autenticación y navegación entre las principales secciones.

## Tecnologías utilizadas

| Tecnología | Propósito |
|---|---|
| Vue 3 | Construcción de la interfaz de usuario. |
| TypeScript | Tipado estático y mantenibilidad del código. |
| Vite | Servidor de desarrollo y compilación. |
| Pinia | Gestión del estado de la aplicación. |
| Vue Router | Navegación entre páginas. |
| Fastify | Infraestructura del backend. |
| Prisma ORM 7 | Modelado y acceso a los datos. |
| PostgreSQL | Base de datos relacional. |
| Vitest | Pruebas unitarias del frontend. |

## Arquitectura del proyecto

El repositorio está organizado como un monorepo que separa la aplicación frontend de la capa backend.

```text
jwork/
├── frontend/
│   ├── src/
│   │   ├── assets/       # Estilos globales y recursos
│   │   ├── components/   # Componentes reutilizables
│   │   ├── composables/  # Lógica reutilizable
│   │   ├── config/       # Configuración de la aplicación
│   │   ├── data/         # Datos de referencia
│   │   ├── router/       # Configuración de rutas
│   │   ├── stores/       # Estado global con Pinia
│   │   ├── types/        # Tipos e interfaces
│   │   ├── views/        # Vistas principales
│   │   ├── App.vue       # Componente raíz
│   │   └── main.ts       # Punto de entrada
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/   # Migraciones de la base de datos
│   │   └── schema.prisma # Esquema de datos
│   ├── src/
│   │   └── generated/    # Cliente y modelos generados
│   ├── package.json
│   └── prisma7.config.ts
│
├── README.md
└── auth-preview.png
```

## Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) compatible con el frontend: `^22.18.0` o `>=24.12.0`.
- [pnpm](https://pnpm.io/) para gestionar las dependencias del frontend.
- PostgreSQL para configurar la base de datos.
- Git para clonar el repositorio.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/AntonioZpli/jwork.git
cd jwork
```

### 2. Configurar el frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Vite iniciará el servidor de desarrollo y mostrará en la terminal la dirección local para acceder a la aplicación.

### 3. Configurar el backend

En otra terminal, desde la raíz del proyecto:

```bash
cd backend
pnpm install
```

Configura las variables de entorno necesarias para la conexión con PostgreSQL y Prisma. La configuración de Prisma se encuentra en `backend/prisma7.config.ts`, y el esquema de datos está en `backend/prisma/schema.prisma`.

Después de configurar la conexión, revisa las migraciones disponibles y aplica las que correspondan a tu entorno de desarrollo utilizando Prisma 7.

**Nota:** el repositorio incluye la capa de datos y la configuración de Prisma. Antes de ejecutar el backend como servicio, verifica los comandos disponibles y el estado de su implementación; el `package.json` actual del backend no define un script de inicio.

## Comandos de desarrollo

Ejecuta estos comandos desde el directorio `frontend/`.

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia el servidor de desarrollo. |
| `pnpm build` | Comprueba los tipos y genera la compilación de producción. |
| `pnpm preview` | Previsualiza la compilación generada. |
| `pnpm test:unit` | Ejecuta las pruebas unitarias con Vitest. |
| `pnpm lint` | Ejecuta las comprobaciones de linting configuradas. |

## Estado del proyecto

Jinowork se encuentra en desarrollo. El repositorio contiene la aplicación frontend y una estructura backend con el esquema de datos y las migraciones de Prisma.

Las funcionalidades disponibles y el grado de integración entre la interfaz, la API y la base de datos dependen del estado actual de implementación de cada módulo.

## Objetivo

Contribuir a una búsqueda de empleo más accesible y organizada, facilitando que los candidatos encuentren oportunidades acordes con su perfil y que las empresas puedan gestionar sus procesos de contratación desde una plataforma común.

## Equipo

Desarrollado por [Antonio](https://github.com/AntonioZpli), Ethan y Diego.

![equipo](https://i.pinimg.com/1200x/11/c8/12/11c812167a87e162a2b7e702b703eeaa.jpg)
## Repositorio

[github.com/AntonioZpli/jwork](https://github.com/AntonioZpli/jwork)

