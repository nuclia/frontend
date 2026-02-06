import { inject, Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { BackendConfigurationService, SDKService } from '@flaps/core';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private backendConfig = inject(BackendConfigurationService);
  private sdk = inject(SDKService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error) => {
        // 400 on requests to external APIs
        // or to local NucliaDB should not redirect to login
        const apiOrigin = this.backendConfig.getAPIOrigin();
        if (
          (window.location.hostname !== 'localhost' && request.url.startsWith(window.location.origin)) ||
          (!!apiOrigin && request.url.startsWith(apiOrigin))
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
      this.sdk.nuclia.auth.redirectToOAuth();
    }
  }
}
