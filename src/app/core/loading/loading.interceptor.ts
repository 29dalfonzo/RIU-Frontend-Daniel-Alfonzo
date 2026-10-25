import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { LoadingService } from './loading.service';

/** Shows the global loading indicator while any HttpClient request is in flight. */
export const loadingInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(inject(LoadingService).track());
