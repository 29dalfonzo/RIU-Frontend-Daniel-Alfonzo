import { TestBed } from '@angular/core/testing';

import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  const setSystemDark = (dark: boolean): void => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: dark } as MediaQueryList));
  };

  const create = async (): Promise<ThemeService> => {
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    return service;
  };

  beforeEach(() => {
    localStorage.clear();
    setSystemDark(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.style.colorScheme = '';
  });

  it('follows the operating system preference by default', async () => {
    setSystemDark(true);

    const service = await create();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('restores the theme the user chose before', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const service = await create();

    expect(service.theme()).toBe('dark');
  });

  it('toggles between light and dark and remembers the choice', async () => {
    const service = await create();

    service.toggle();
    TestBed.tick();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    service.toggle();
    TestBed.tick();

    expect(service.theme()).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('ignores an unknown stored value', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');

    const service = await create();

    expect(service.theme()).toBe('light');
  });

  it('keeps working when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const service = await create();
    service.toggle();
    TestBed.tick();

    expect(service.theme()).toBe('dark');
    vi.restoreAllMocks();
  });
});
