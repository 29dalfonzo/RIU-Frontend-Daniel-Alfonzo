import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';

import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let loading: LoadingService;

  beforeEach(() => {
    loading = TestBed.inject(LoadingService);
  });

  it('is idle by default', () => {
    expect(loading.isLoading()).toBe(false);
  });

  it('is loading while a tracked operation is in flight', () => {
    const operation = new Subject<string>();

    operation.pipe(loading.track()).subscribe();
    expect(loading.isLoading()).toBe(true);

    operation.next('done');
    operation.complete();
    expect(loading.isLoading()).toBe(false);
  });

  it('stays loading until every concurrent operation finishes', () => {
    const first = new Subject<void>();
    const second = new Subject<void>();
    first.pipe(loading.track()).subscribe();
    second.pipe(loading.track()).subscribe();

    first.complete();
    expect(loading.isLoading()).toBe(true);

    second.complete();
    expect(loading.isLoading()).toBe(false);
  });

  it('stops loading when the operation fails', () => {
    throwError(() => new Error('boom'))
      .pipe(loading.track())
      .subscribe({ error: () => undefined });

    expect(loading.isLoading()).toBe(false);
  });

  it('stops loading when the subscriber unsubscribes', () => {
    const subscription = new Subject<void>().pipe(loading.track()).subscribe();

    subscription.unsubscribe();

    expect(loading.isLoading()).toBe(false);
  });

  it('only starts tracking on subscription', () => {
    new Subject<void>().pipe(loading.track());

    expect(loading.isLoading()).toBe(false);
  });
});
