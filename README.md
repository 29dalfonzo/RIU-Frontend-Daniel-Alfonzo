# RIU Frontend – Super Heroes

Single-page application to maintain a catalogue of super heroes, built for the Mindata frontend technical test.

## Stack

| Tool | Version |
| --- | --- |
| Angular (core, router, forms) | 21.2.25 (latest LTS line, v21) |
| Angular CLI / build | 21.2.28 |
| Angular Material / CDK | 21.2.14 |
| RxJS | 7.8 |
| TypeScript | 5.9 |
| Vitest (+ coverage-v8) | 4.1 |
| Playwright | 1.64 |
| angular-eslint / Prettier | 21.4 / 3.8 |
| Node.js | 24 LTS |

Standalone components, zoneless change detection, signals, `OnPush` and the new control flow (`@if`, `@for`) are used throughout.

## Getting started

### Locally

```bash
npm ci
npm start            # http://localhost:4200
```

### With Docker

```bash
docker compose up --build    # http://localhost:8080
```

Or without Compose:

```bash
docker build -t riu-frontend .
docker run --rm -p 8080:80 riu-frontend
```

Tests and lint can also run inside Docker, with no local Node.js needed:

```bash
docker build --target test .
```

## Scripts

| Script | Description |
| --- | --- |
| `npm start` | Dev server with live reload |
| `npm run build` | Production build into `dist/` |
| `npm test` | Unit tests in watch mode |
| `npm run test:ci` | Unit tests once |
| `npm run test:coverage` | Unit tests once with coverage; **fails below 80%** (statements, branches, functions, lines) |
| `npm run e2e` | Playwright end-to-end tests (desktop + mobile Chrome), starts its own dev server |
| `npm run lint` | angular-eslint (TypeScript + template accessibility rules) |
| `npm run format` | Prettier |

## Requirements coverage

| Requirement | Where |
| --- | --- |
| Register, list, get by id, search by name, update and delete heroes | `HeroService` (`features/heroes/data-access`) |
| Search by name: `man` → `SPIDERMAN`, `SUPERMAN`, `MANOLITO EL FUERTE`… | `HeroService.searchByName` (case-insensitive, trimmed) |
| Data kept inside the service, no backend | Signal-based in-memory store seeded with sample heroes |
| Paginated list with add, edit and delete buttons | `HeroListPageComponent` + `HeroTableComponent` (Material table and paginator) |
| Filter input above the list | `HeroSearchComponent` (debounced) |
| Empty form with validations, back to the list after saving | `HeroFormComponent` + `HeroFormPageComponent` on `/heroes/new` |
| Pre-filled edit form, back to the list after saving | Same components on `/heroes/:id/edit` |
| Confirmation before deleting | `ConfirmDialogService` (Material dialog) |
| Unit tests for the service and components | `*.spec.ts` next to every unit |
| *Optional:* Angular Material | Material 3 theme, table, paginator, form fields, dialog, snackbar, progress bar |
| *Optional:* Routes and navigation | Lazy-loaded `heroes` feature with router input binding |
| *Optional:* Loading interceptor | `loadingInterceptor` + `LoadingService` (see decisions below) |
| *Optional:* Upper-case directive for the name | `UppercaseDirective` (`appUppercase`) |
| *Optional:* Event-driven component communication | Presentational components only talk through `input()` / `output()` / `model()` |

## Project structure

```text
src/app
├── core/                    # App-wide singletons
│   ├── loading/             # LoadingService + HTTP loading interceptor
│   └── theme/               # ThemeService (light/dark)
├── shared/                  # Reusable, feature-agnostic building blocks
│   ├── directives/          # UppercaseDirective
│   └── ui/                  # Confirm dialog, notifications (snackbar)
└── features/
    └── heroes/              # Feature folder, lazy loaded
        ├── models/          # Hero, HeroDraft, Publisher, sorting, domain errors
        ├── data-access/     # HeroService (in-memory store), seed data, list query memory
        ├── components/      # Presentational: table, search, form, preview, avatar, badge
        ├── pages/           # Containers: list page, form page (+ unsaved-changes guard)
        ├── testing/         # Shared fixtures for specs
        └── heroes.routes.ts
```

Each folder describes *what* it holds, so the feature is readable without opening files. Containers (`pages/`) own state and side effects. Presentational components (`components/`) only receive inputs and emit events.

## UI and UX

The interface uses a **comic theme built on Angular Material 3**: the Material theme is generated with a red primary, yellow tertiary and the *Bangers* display font, and a small set of CSS tokens (`--app-ink`, `--app-outline`, `--app-shadow`…) adds ink outlines, offset shadows and a halftone background. Components keep using Material; only tokens and a few layout classes are custom.

| Area | What it does |
| --- | --- |
| Theme | Light and dark themes (`theme-type: color-scheme`), toggle in the header; follows the OS by default and remembers the choice |
| URL state | Filter, page, page size and sort live in the query string (`?q=man&page=2&sort=name:asc`): reload, shared links and back/forward restore the same view, and forms return to it |
| List | Sortable columns, initials avatars, publisher badges (white text ≥ 4.98:1 contrast), first-load skeleton, empty state with *Clear filter* / *Add hero*, `aria-live` result count, `/` focuses the search |
| Saving | The created or edited hero is highlighted and the list jumps to its page |
| Delete | Confirmation dialog with the hero name and a danger action (focus starts on *Cancel*), then *Undo* in the snackbar |
| Form | Breadcrumb, hints and name counter, live trading-card preview, focus on the first invalid field, *Save* disabled until an edit changes something, and a guard that asks before discarding unsaved changes |
| Mobile | Mobile-first layouts: the table keeps only name (with publisher) and actions, the preview becomes a compact card |
| Motion | Highlight, skeleton and card animations are disabled with `prefers-reduced-motion` |

## Design decisions

### Data model

```ts
interface Hero {
  readonly id: HeroId;          // number, generated by the store
  readonly name: string;        // unique, stored in upper case
  readonly realName: string;
  readonly publisher: Publisher; // 'Marvel' | 'DC' | 'Other', derived from a const tuple
  readonly firstAppearance: number;
}
type HeroDraft = Omit<Hero, 'id'>; // what callers send to register a hero
```

- **Readonly and immutable.** The store freezes every hero and list it hands out, so no consumer can mutate state behind the service's back.
- **The store owns identity.** `create` receives a `HeroDraft`, so a caller cannot invent or collide ids.
- **Domain errors.** `HeroNotFoundError` and `DuplicateHeroNameError` are typed errors instead of `null` returns or magic strings.
- **Normalization lives in the service.** Names are trimmed and upper-cased, so `superman` and `SUPERMAN` are the same hero and uniqueness can't be bypassed from the UI.

### Reactive service with simulated latency

Every `HeroService` method returns a **cold `Observable`**: nothing happens until someone subscribes, and the operation runs after a configurable delay (`HERO_LATENCY_MS`, 400 ms by default; 0 in tests). This keeps the same contract as a real `HttpClient`-based API, so replacing the in-memory store with a backend wouldn't change any component.

The list page combines the debounced search term and a reload trigger with `combineLatest` + `switchMap`, which cancels stale searches. The result is exposed to the template as a signal through `toSignal`.

### Loading indicator and the interceptor

An Angular `HttpInterceptor` only sees `HttpClient` requests. The test asks for the data to live inside the service with no backend, so there are no HTTP calls for an interceptor to intercept. Faking an HTTP backend would have moved the data out of the service, which contradicts that requirement.

The solution has two pieces that share a single source of truth:

- `LoadingService` counts in-flight operations and exposes an `isLoading` signal. Its `track()` operator increments the counter on subscribe and decrements it on complete, error or unsubscribe.
- `loadingInterceptor` (a functional `HttpInterceptorFn`, registered with `withInterceptors`) applies `track()` to every HTTP request.
- `HeroService` applies the same `track()` to its simulated operations, because it doesn't go through `HttpClient`.

The header shows a Material progress bar while `isLoading()` is true. If a real API is added, `HeroService` would switch to `HttpClient`, drop its own `track()` call, and the interceptor would cover it with no UI changes.

### Upper-case directive

`appUppercase` transforms the **actual value** on each `input` event: it keeps the caret position and syncs the bound form control. A `text-transform: uppercase` style would only change how the text looks, so the model would still hold lower-case text.

### Validations

| Field | Rules |
| --- | --- |
| Name | required, 2–40 characters, unique (checked by the service) |
| Real name | required, max 60 characters |
| Publisher | required, one of `Marvel`, `DC`, `Other` |
| First appearance | required, between 1900 and the current year |

Errors appear once a field is touched or the form is submitted. The form is fully typed (`NonNullableFormBuilder`).

## Testing

- **Vitest** through the Angular `unit-test` builder, with jsdom.
- Tests go through the public surface: the DOM, Angular Material **component harnesses** (paginator, select, dialog, button) and `RouterTestingHarness` for routing.
- Material animations are disabled globally in tests (`src/test-providers.ts`), so dialogs close synchronously.
- `npm run test:coverage` enforces a minimum of **80%** coverage; the current suite is at ~99% statements and ~97% branches.

### End-to-end

`npm run e2e` runs [Playwright](https://playwright.dev) against a real dev server, on desktop and mobile (Pixel 7) Chrome. The suite covers pagination, filtering and clearing the filter, restoring state from a shared link, creating with validations and upper case (with the new hero highlighted), rejecting a duplicate name, editing, confirming, cancelling and undoing a deletion, the unsaved-changes guard, the theme toggle, the loading bar, and redirecting an unknown hero id. The first run needs the browser: `npx playwright install chromium`.

## Commit convention

The history follows [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `chore`, `build`, `docs`…), with one commit per work unit.
