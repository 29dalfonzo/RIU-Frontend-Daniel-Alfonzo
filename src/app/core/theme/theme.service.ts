import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'hero-registry.theme';

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

/**
 * Light/dark theme switch. The Material theme is generated with `theme-type: color-scheme`,
 * so switching only needs to set the root `color-scheme`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<Theme>(this.readStoredTheme() ?? this.systemTheme());
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.document.documentElement.style.colorScheme = theme;
      this.storeTheme(theme);
    });
  }

  toggle(): void {
    this.theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  private systemTheme(): Theme {
    const prefersDark = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    return prefersDark?.matches ? 'dark' : 'light';
  }

  // Storage can throw (private mode, blocked site data): the theme is only a convenience.
  private readStoredTheme(): Theme | null {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
      return isTheme(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  private storeTheme(theme: Theme): void {
    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignored on purpose, see readStoredTheme.
    }
  }
}
