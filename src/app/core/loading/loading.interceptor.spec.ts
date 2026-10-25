import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from './loading.service';

describe('loadingInterceptor', () => {
  it('flags the app as loading while an HTTP request is pending', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const loading = TestBed.inject(LoadingService);
    const http = TestBed.inject(HttpClient);
    const backend = TestBed.inject(HttpTestingController);

    http.delete('/api/heroes/1').subscribe();
    expect(loading.isLoading()).toBe(true);

    backend.expectOne('/api/heroes/1').flush(null);
    expect(loading.isLoading()).toBe(false);
    backend.verify();
  });
});
