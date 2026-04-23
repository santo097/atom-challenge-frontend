# ATOM Challenge — Frontend

[![CI](https://github.com/santo097/atom-challenge-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/santo097/atom-challenge-frontend/actions/workflows/ci.yml)

Frontend del challenge técnico de ATOM — aplicación de lista de tareas
construida con **Angular 20**, **Angular Material 20** y **standalone components**.

> 🎯 Consume el backend desplegado en Firebase Cloud Functions
> (repositorio separado: [atom-challenge-backend](https://github.com/santo097/atom-challenge-backend)).

---

## 📑 Tabla de contenidos

1. [Stack técnico](#-stack-técnico)
2. [Arquitectura](#-arquitectura)
3. [Requisitos previos](#-requisitos-previos)
4. [Quick start](#-quick-start)
5. [Scripts disponibles](#-scripts-disponibles)
6. [Estructura del proyecto](#-estructura-del-proyecto)
7. [Decisiones técnicas](#-decisiones-técnicas)
8. [Deploy](#-deploy)

---

## 🛠️ Stack técnico

- **Angular 20** en modo **zoneless** (sin Zone.js)
- **Standalone components** (sin NgModules)
- **Angular Material 20** para componentes UI con Material Design 3
- **Angular Signals** para estado reactivo
- **Reactive Forms** con tipado estricto
- **RxJS** para streams HTTP
- **TypeScript 5** en modo estricto
- **Karma + Jasmine** para tests unitarios
- **SCSS** con variables globales y tema Material custom
- **Firebase Hosting** para deploy

---

## 🏛️ Arquitectura

Estructura **feature-based** con separación clara entre:

- **core/** — servicios singleton, interceptores y guards. Se carga una vez al arrancar.
- **shared/** — componentes, directivas y pipes reutilizables entre features.
- **features/** — páginas funcionales con sus componentes específicos.

**Flujo de una acción típica (ej. crear tarea):**

```
Componente
  → (emite evento con datos validados)
Servicio (TaskService)
  → (llamada HTTP tipada)
AuthInterceptor
  → (inyecta Bearer token del signal del AuthService)
Backend
  → (responde JSON)
ErrorInterceptor
  → (captura 401, limpia sesión, redirige a login)
Componente
  → (actualiza signals locales, optimistic update)
```

---

## 📋 Requisitos previos

- **Node.js ≥ 20** — `node --version`
- **npm ≥ 10** — `npm --version`
- **Backend corriendo** en `http://localhost:3000` (para desarrollo local) o
  usar la URL de producción modificando `src/environments/environment.ts`

---

## 🚀 Quick start

```bash
# 1. Clonar e instalar
git clone https://github.com/santo097/atom-challenge-frontend.git
cd atom-challenge-frontend
npm install

# 2. (Opcional) Configurar backend local
# Por defecto public/config.json apunta al backend en producción.
# Para desarrollo local con backend en localhost:3000, edita ese archivo
# o crea public/config.local.json (que se ignora en git) con:
# {
#   "apiUrl": "http://localhost:3000/api/v1",
#   "environment": "development",
#   "version": "dev",
#   "httpTimeoutMs": 30000
# }

# 3. Arrancar el dev server (abre http://localhost:4200 automáticamente)
npm start

# 4. Abrir en el navegador
# → http://localhost:4200
```

La configuración se carga en **runtime** desde `public/config.json`, no
en compile-time. Esto significa que puedes cambiar la URL del API en
producción **sin recompilar** — solo sustituyes el archivo en el bucket
de Firebase Hosting.

Para más detalles ver la sección [Decisiones técnicas](#-decisiones-técnicas).

---

## 📜 Scripts disponibles

| Script | Qué hace |
|---|---|
| `npm start` | Dev server con hot reload en `:4200` |
| `npm run build` | Build de desarrollo |
| `npm run build:prod` | Build optimizado para producción |
| `npm test` | Tests unitarios (headless, una sola corrida) |
| `npm run test:watch` | Tests en modo watch con UI |
| `npm run test:coverage` | Tests con reporte de coverage |
| `npm run format` | Formatea el código con Prettier |
| `npm run format:check` | Verifica formato sin modificar |

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── core/                          # Infraestructura (singleton)
│   │   ├── models/                    # Interfaces: User, Task, DTOs
│   │   ├── services/
│   │   │   ├── auth.service.ts        # Auth con Signals + localStorage
│   │   │   ├── task.service.ts        # CRUD de tareas
│   │   │   └── storage.service.ts     # Wrapper tipado de localStorage
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts    # Inyecta Bearer JWT
│   │   │   └── error.interceptor.ts   # Maneja 401 → logout
│   │   └── guards/
│   │       └── auth.guard.ts          # Protege rutas privadas
│   ├── shared/
│   │   └── components/
│   │       └── confirm-dialog.component.ts  # Dialog reutilizable
│   ├── features/
│   │   ├── login/
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   └── login.component.scss
│   │   └── tasks/
│   │       ├── tasks.component.ts     # Página principal
│   │       ├── tasks.component.html
│   │       ├── tasks.component.scss
│   │       └── components/
│   │           ├── task-form.component.ts   # Crear/editar
│   │           ├── task-list.component.ts   # Lista con filtros
│   │           └── task-item.component.ts   # Tarjeta individual
│   ├── app.component.ts               # Shell (<router-outlet/>)
│   ├── app.config.ts                  # Providers raíz
│   └── app.routes.ts                  # Rutas con lazy loading
├── environments/
│   ├── environment.ts                 # Dev → localhost:3000
│   └── environment.prod.ts            # Prod → Cloud Function URL
├── styles.scss                        # Tema Material + variables CSS
├── index.html
└── main.ts
```

---

## 🎯 Decisiones técnicas

### Por qué Angular 20

Se usa Angular 20 por estas razones:

- Es **LTS** hasta noviembre 2026
- Trae **zoneless por defecto** — menor overhead, mejor rendimiento
- Tiene control flow nativo (`@if`, `@for`, `@switch`) en vez de directivas
- `input.required()`, `output()` y signals son la API moderna recomendada
- Ecosistema estable y bien documentado (Angular 21 salió hace días y todavía no tiene documentación completa)

### Por qué standalone components

- Sin boilerplate de NgModules
- Lazy loading más simple (`loadComponent` en la ruta)
- Imports explícitos en cada componente — más claro qué depende de qué
- Es el patrón recomendado oficialmente desde Angular 17

- `AuthService.user()` y `AuthService.token()` son signals reactivos
- El interceptor los lee sin subscribirse
- Los componentes los usan directo en templates sin async pipe
- Sin fugas de memoria ni suscripciones manuales

### Por qué filtro client-side (no server-side)

El backend soporta `?completed=true|false`, pero:

- La lista típica son < 50 tareas → cambiar de filtro es instantáneo sin HTTP
- Menos carga para Cloud Functions (solo un GET inicial)
- Mejor UX: el filtro no dispara spinners

Si en el futuro la lista creciera a miles, migrar a server-side sería trivial
(el TaskService ya acepta el parámetro).

### Por qué optimistic updates

Al togglear una tarea, actualizamos el UI **antes** de confirmar el HTTP:

- Sensación de app instantánea
- Si el HTTP falla, rollback + snackbar con mensaje
- El backend sigue siendo la fuente de verdad

Esto se nota especialmente en la red lenta.

### Configuración runtime (no compile-time)

Tradicionalmente Angular usa `environment.ts` + `environment.prod.ts`,
archivos que se compilan dentro del bundle. Eso obliga a:

- Mantener un archivo por ambiente
- Rebuildear para cambiar una URL
- Tener múltiples artefactos de build (uno por ambiente)

En cambio aquí cargamos **`public/config.json`** en runtime vía
`provideAppInitializer(loadAppConfig)`:

```
public/
├── config.json            ← versionado, apunta a producción por defecto
└── config.example.json    ← template para dev
```

**Flujo al arrancar:**
1. Angular espera a que `loadAppConfig()` resuelva
2. `fetch('/config.json')` → se parsea y valida
3. `AppConfigService.bootstrap(config)` guarda los valores
4. Todos los servicios leen de `AppConfigService.apiUrl`

**Ventajas concretas:**
- Un mismo bundle para todos los ambientes (CI/CD más simple)
- Cambiar el backend URL en prod **sin rebuild** → solo subes un
  `config.json` nuevo al bucket de Firebase Hosting
- Fallback seguro: si el JSON falla al cargar, arranca con defaults
  en vez de pantalla blanca

### Validación de email estricta

`Validators.email` de Angular es permisivo — acepta `a@b` o
`user@localhost`. Usamos un `strictEmailValidator` custom con regex
que requiere TLD real (`.com`, `.io`...) y sin caracteres raros.

### Normalización antes de enviar

Todos los emails se pasan por `normalizeEmail()` antes de cualquier
request: trim + lowercase. Esto previene crear `Foo@Bar.com` y
`foo@bar.com` como usuarios distintos.

### Mensajes de error contextualizados

En vez de mostrar "Error" genérico, el helper `extractErrorMessage`
traduce cada tipo de fallo:

- **Red caída** (status 0) → "No pudimos conectar con el servidor"
- **401** → "Tu sesión expiró"
- **403** → "No tienes permiso para esta acción"
- **404** → "Recurso no encontrado"
- **429** → "Demasiados intentos, espera un momento"
- **5xx** → "El servidor está teniendo problemas"
- **Mensaje del backend** → se usa directo si viene con `error.message`

### Throttling implícito del botón

Mientras el signal `status` no es `'idle'`, el botón submit está
deshabilitado. Esto previene:
- Spam de clicks (doble registro accidental)
- Peticiones duplicadas por red lenta
- Race conditions entre login y register

### Seguridad del JWT

- Se guarda en `localStorage` (no en cookies porque el backend
  no soporta cookies — la API está en dominio distinto al frontend)
- El **AuthInterceptor** lo inyecta automáticamente en cada request
- El **ErrorInterceptor** detecta 401 → logout → redirige a login
- Al hacer logout, se limpia el signal Y el storage

---

## 🚀 Deploy

### Manual a Firebase Hosting

```bash
# Primera vez solamente
npm install -g firebase-tools
firebase login
firebase use atom-challenge-88068

# Cada deploy
npm run build:prod
firebase deploy --only hosting
```

### Automático con GitHub Actions

Cada push a `main` dispara el workflow `deploy.yml` que:

1. Instala dependencies
2. Hace typecheck
3. Corre tests unitarios
4. Build de producción
5. Deploy a Firebase Hosting

**Configurar secrets en GitHub** (una sola vez):

- Crear environment `production` con estos valores:
  - **Secret** `FIREBASE_TOKEN` — generado con `firebase login:ci`
  - **Variable** `FIREBASE_PROJECT_ID` — `atom-challenge-xxxxx`

---

## 🔗 Enlaces
- **Repo del backend**: https://github.com/santo097/atom-challenge-backend
