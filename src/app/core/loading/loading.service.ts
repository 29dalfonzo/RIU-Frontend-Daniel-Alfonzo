import { Injectable, computed, signal } from '@angular/core';
import { MonoTypeOperatorFunction, Observable, defer, finalize } from 'rxjs';

/** Global "something is in progress" state, shared by the HTTP interceptor and in-memory operations. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pending = signal(0);

  readonly isLoading = computed(() => this.pending() > 0);

  /** Marks the app as loading from subscription until the source completes, errors or is unsubscribed. */
  track<T>(): MonoTypeOperatorFunction<T> {
    return (source: Observable<T>) =>
      defer(() => {
        this.pending.update((count) => count + 1);
        return source.pipe(finalize(() => this.pending.update((count) => count - 1)));
      });
  }
}
