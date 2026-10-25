# RIU Frontend – Super Heroes

[English](README.md) | **Español**

Aplicación SPA para el mantenimiento de un catálogo de súper héroes, desarrollada para la prueba técnica de frontend de Mindata.

## Stack

| Herramienta                   | Versión                         |
| ----------------------------- | ------------------------------- |
| Angular (core, router, forms) | 21.2.25 (última línea LTS, v21) |
| Angular CLI / build           | 21.2.28                         |
| Angular Material / CDK        | 21.2.14                         |
| RxJS                          | 7.8                             |
| TypeScript                    | 5.9                             |
| Vitest (+ coverage-v8)        | 4.1                             |
| Playwright                    | 1.64                            |
| angular-eslint / Prettier     | 21.4 / 3.8                      |
| Node.js                       | 24 LTS                          |

Se utilizan componentes standalone, detección de cambios zoneless, signals, `OnPush` y el nuevo control flow (`@if`, `@for`) en todo el proyecto.

### Por qué Angular 21

La prueba pide _"la última versión LTS de Angular y de cualquier librería que se use en el proyecto"_. Angular 21 es la línea más reciente con soporte a largo plazo (tag de npm `v21-lts`, 21.2.25), mientras que Angular 22 es la versión activa actual y todavía no es LTS, por lo que el proyecto utiliza la 21.

El resto de las dependencias está en su versión más reciente compatible con Angular 21. Las únicas versiones mayores más nuevas disponibles (Vitest 5, TypeScript 7) quedan fuera de los rangos que soporta el tooling de Angular 21 (`@angular/build` requiere `vitest ^4` y TypeScript `>=5.9 <6.0`). Migrar a Angular 22 más adelante es un `ng update` estándar.

## Cómo ejecutarlo

### En local

```bash
npm ci
npm start            # http://localhost:4200
```

### Con Docker

```bash
docker compose up --build    # http://localhost:8080
```

O sin Compose:

```bash
docker build -t riu-frontend .
docker run --rm -p 8080:80 riu-frontend
```

Los tests y el lint también pueden ejecutarse dentro de Docker, sin necesidad de Node.js en el equipo:

```bash
docker build --target test .
```

## Scripts

| Script                  | Descripción                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `npm start`             | Servidor de desarrollo con recarga en vivo                                                           |
| `npm run build`         | Build de producción en `dist/`                                                                       |
| `npm test`              | Tests unitarios en modo watch                                                                        |
| `npm run test:ci`       | Tests unitarios, una sola ejecución                                                                  |
| `npm run test:coverage` | Tests unitarios con cobertura; **falla por debajo del 80%** (statements, branches, functions, lines) |
| `npm run e2e`           | Tests end-to-end con Playwright (Chrome de escritorio y móvil); levanta su propio servidor           |
| `npm run lint`          | angular-eslint (reglas de TypeScript y de accesibilidad en templates)                                |
| `npm run format`        | Prettier                                                                                             |

## Cobertura de los requisitos

| Requisito                                                                           | Dónde                                                                                          |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Registrar, listar, consultar por id, buscar por nombre, modificar y eliminar héroes | `HeroService` (`features/heroes/data-access`)                                                  |
| Búsqueda por nombre: `man` → `SPIDERMAN`, `SUPERMAN`, `MANOLITO EL FUERTE`…         | `HeroService.searchByName` (sin distinguir mayúsculas, ignora espacios)                        |
| Datos guardados dentro del servicio, sin backend                                    | Store en memoria basado en signals, con héroes de ejemplo                                      |
| Lista paginada con botones de añadir, editar y borrar                               | `HeroListPageComponent` + `HeroTableComponent` (tabla y paginador de Material)                 |
| Input de filtro encima de la lista                                                  | `HeroSearchComponent` (con debounce)                                                           |
| Formulario vacío con validaciones; vuelve a la lista al guardar                     | `HeroFormComponent` + `HeroFormPageComponent` en `/heroes/new`                                 |
| Formulario de edición con los datos del héroe; vuelve a la lista al guardar         | Los mismos componentes en `/heroes/:id/edit`                                                   |
| Confirmación antes de borrar                                                        | `ConfirmDialogService` (diálogo de Material)                                                   |
| Tests unitarios del servicio y de los componentes                                   | `*.spec.ts` junto a cada unidad                                                                |
| _Opcional:_ Angular Material                                                        | Tema Material 3, tabla, paginador, campos de formulario, diálogo, snackbar, barra de progreso  |
| _Opcional:_ Rutas y navegación                                                      | Feature `heroes` con carga diferida y binding de inputs desde el router                        |
| _Opcional:_ Interceptor de loading                                                  | `loadingInterceptor` + `LoadingService` (ver decisiones más abajo)                             |
| _Opcional:_ Directiva de mayúsculas para el nombre                                  | `UppercaseDirective` (`appUppercase`)                                                          |
| _Opcional:_ Comunicación entre componentes orientada a eventos                      | Los componentes presentacionales solo se comunican mediante `input()` / `output()` / `model()` |

## Estructura del proyecto

```text
src/app
├── core/                    # Singletons de toda la aplicación
│   ├── loading/             # LoadingService + interceptor HTTP de loading
│   └── theme/               # ThemeService (claro/oscuro)
├── shared/                  # Piezas reutilizables, independientes del dominio
│   ├── directives/          # UppercaseDirective
│   └── ui/                  # Diálogo de confirmación, notificaciones (snackbar)
└── features/
    └── heroes/              # Feature del dominio, con carga diferida
        ├── models/          # Hero, HeroDraft, Publisher, ordenamiento, errores de dominio
        ├── data-access/     # HeroService (store en memoria), datos semilla, memoria de la consulta de la lista
        ├── components/      # Presentacionales: tabla, búsqueda, formulario, preview, avatar, badge
        ├── pages/           # Contenedores: página de lista, página de formulario (+ guard de cambios sin guardar)
        ├── testing/         # Fixtures compartidos por los specs
        └── heroes.routes.ts
```

Cada carpeta describe _qué_ contiene, de modo que la feature se entiende sin abrir los archivos. Los contenedores (`pages/`) manejan el estado y los efectos secundarios; los componentes presentacionales (`components/`) solo reciben inputs y emiten eventos.

## UI y UX

La interfaz usa un **tema de cómic construido sobre Angular Material 3**: el tema de Material se genera con un primario rojo, un terciario amarillo y la tipografía _Bangers_ para los títulos, y un conjunto reducido de tokens CSS (`--app-ink`, `--app-outline`, `--app-shadow`…) agrega contornos de tinta, sombras desplazadas y un fondo de puntos halftone. Los componentes siguen siendo de Material; solo los tokens y algunas clases de layout son propios.

| Área             | Qué hace                                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tema             | Temas claro y oscuro (`theme-type: color-scheme`) con selector en el header; sigue la preferencia del sistema y recuerda la elección                                                                                                                   |
| Estado en la URL | El filtro, la página, el tamaño de página y el orden viven en el query string (`?q=man&page=2&sort=name:asc`): recargar, compartir el link o usar atrás/adelante restauran la misma vista, y los formularios vuelven a ella                            |
| Lista            | Columnas ordenables, avatares con iniciales, badges por editorial (contraste del texto ≥ 4,98:1), skeleton en la primera carga, estado vacío con _Clear filter_ / _Add hero_, cantidad de resultados anunciada con `aria-live`, `/` enfoca la búsqueda |
| Al guardar       | De vuelta en la lista, el héroe guardado se resalta si está en pantalla; si no, el usuario se queda donde estaba y el snackbar ofrece _View_, que salta a su página (limpiando un filtro que lo oculte)                                                |
| Borrado          | Diálogo de confirmación con el nombre del héroe y una acción de peligro (el foco inicial queda en _Cancel_), y luego _Undo_ en el snackbar                                                                                                             |
| Notificaciones   | Snackbar propio con estilo cómic (`NotificationComponent`) en tres variantes: éxito (amarillo), informativa con acción como _Undo_ o _View_ (tinta) y error (rojo), cada una con ícono y botón para cerrar                                             |
| Paginación       | Botones de primera, anterior, siguiente y última página; tamaños 5/10/25                                                                                                                                                                               |
| Formulario       | Breadcrumb, ayudas y contador del nombre, preview en vivo tipo figurita, foco en el primer campo inválido, _Save_ deshabilitado hasta que una edición cambie algo, y un guard que pregunta antes de descartar cambios sin guardar                      |
| Móvil            | Layouts mobile-first: la tabla conserva solo el nombre (con la editorial) y las acciones, y el preview pasa a ser una tarjeta compacta                                                                                                                 |
| Animaciones      | El resaltado, el skeleton y las animaciones de la tarjeta se desactivan con `prefers-reduced-motion`                                                                                                                                                   |

## Decisiones de diseño

### Modelo de datos

```ts
interface Hero {
  readonly id: HeroId; // number, generado por el store
  readonly name: string; // único, guardado en mayúsculas
  readonly realName: string;
  readonly publisher: Publisher; // 'Marvel' | 'DC' | 'Other', derivado de una tupla constante
  readonly firstAppearance: number;
}
type HeroDraft = Omit<Hero, 'id'>; // lo que se envía para registrar un héroe
```

- **Readonly e inmutable.** El store congela cada héroe y cada lista que entrega, así ningún consumidor puede modificar el estado a espaldas del servicio.
- **El store es dueño de la identidad.** `create` recibe un `HeroDraft`, de modo que quien llama no puede inventar ids ni generar colisiones.
- **Errores de dominio.** `HeroNotFoundError` y `DuplicateHeroNameError` son errores tipados, en lugar de devolver `null` o usar strings mágicos.
- **La normalización vive en el servicio.** Los nombres se recortan y pasan a mayúsculas, así `superman` y `SUPERMAN` son el mismo héroe y la unicidad no puede eludirse desde la UI.

### Servicio reactivo con latencia simulada

Cada método de `HeroService` devuelve un **`Observable` frío**: no ocurre nada hasta que alguien se suscribe, y la operación se ejecuta después de un retardo configurable (`HERO_LATENCY_MS`, 400 ms por defecto; 0 en los tests). Así se mantiene el mismo contrato que tendría una API real basada en `HttpClient`, y reemplazar el store en memoria por un backend no cambiaría ningún componente.

La página de lista combina el término de búsqueda (con debounce) y un disparador de recarga con `combineLatest` + `switchMap`, que cancela las búsquedas obsoletas. El resultado llega al template como signal mediante `toSignal`.

### Indicador de loading y el interceptor

Un `HttpInterceptor` de Angular solo ve las peticiones de `HttpClient`. La prueba pide que los datos vivan dentro del servicio, sin backend, por lo que no hay llamadas HTTP que interceptar. Simular un backend HTTP habría sacado los datos del servicio, lo que contradice ese requisito.

La solución tiene dos piezas que comparten una única fuente de verdad:

- `LoadingService` cuenta las operaciones en curso y expone un signal `isLoading`. Su operador `track()` incrementa el contador al suscribirse y lo decrementa al completar, al fallar o al desuscribirse.
- `loadingInterceptor` (un `HttpInterceptorFn` funcional, registrado con `withInterceptors`) aplica `track()` a cada petición HTTP.
- `HeroService` aplica el mismo `track()` a sus operaciones simuladas, porque no pasa por `HttpClient`.

El header muestra una barra de progreso de Material mientras `isLoading()` es verdadero. Si se agrega una API real, `HeroService` pasaría a usar `HttpClient`, quitaría su propia llamada a `track()` y el interceptor lo cubriría sin cambios en la UI.

### Directiva de mayúsculas

`appUppercase` transforma el **valor real** en cada evento `input`: conserva la posición del cursor y sincroniza el form control asociado. Un estilo `text-transform: uppercase` solo cambiaría cómo se ve el texto, y el modelo seguiría guardándolo en minúsculas.

### Validaciones

| Campo             | Reglas                                                           |
| ----------------- | ---------------------------------------------------------------- |
| Nombre            | obligatorio, de 2 a 40 caracteres, único (lo valida el servicio) |
| Nombre real       | obligatorio, máximo 60 caracteres                                |
| Editorial         | obligatoria, una de `Marvel`, `DC`, `Other`                      |
| Primera aparición | obligatoria, entre 1900 y el año actual                          |

Los errores se muestran cuando el campo fue tocado o al enviar el formulario. El formulario está completamente tipado (`NonNullableFormBuilder`).

## Testing

- **Vitest** a través del builder `unit-test` de Angular, con jsdom.
- Los tests trabajan sobre la superficie pública: el DOM, los **component harnesses** de Angular Material (paginador, select, diálogo, botón) y `RouterTestingHarness` para el routing.
- Las animaciones de Material se desactivan globalmente en los tests (`src/test-providers.ts`), así los diálogos se cierran de forma sincrónica.
- `npm run test:coverage` exige una cobertura mínima del **80%**; la suite actual está en ~99% de statements y ~97% de branches.

### End-to-end

`npm run e2e` ejecuta [Playwright](https://playwright.dev) contra un servidor de desarrollo real, en Chrome de escritorio y móvil (Pixel 7). La suite cubre la paginación, el filtrado y su limpieza, la restauración del estado desde un link compartido, el alta con validaciones y mayúsculas (y luego _View_ para ir al héroe nuevo), el rechazo de un nombre duplicado, la edición, la confirmación, cancelación y deshacer de un borrado, el guard de cambios sin guardar, el cambio de tema, la barra de loading y la redirección ante un id inexistente. La primera ejecución necesita el navegador: `npx playwright install chromium`.

## Convención de commits

El historial sigue [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `chore`, `build`, `docs`…), con un commit por unidad de trabajo.
