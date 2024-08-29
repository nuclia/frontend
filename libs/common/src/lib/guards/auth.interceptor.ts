import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { SDKService } from '@flaps/core';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private sdk: SDKService,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error) => {
        // 440 on requests to external APIs (like connectors)
        // or to local NucliaDB should not redirect to login
        if (
          request.url.startsWith('https://nuclia.cloud') ||
          request.url.startsWith('https://stashify.cloud') ||
          request.url.startsWith('https://gcp-global-dev-1.nuclia.io')
        ) {
          this.handle400Error(error);
        }
        return throwError(error);
      }),
    );
  }

  private handle400Error(error: any) {
    const isInvalidToken = error.status === 400 || error.status === 401;
    if (isInvalidToken) {
      this.sdk.nuclia.auth.logout();
      this.router.navigate(['/user/login']);
    }
  }
}
