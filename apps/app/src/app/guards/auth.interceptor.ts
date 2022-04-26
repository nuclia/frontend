import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '@flaps/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router, private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(catchError(error => {
      this.handle400Error(error)
      return throwError(error);
    }));
  }

  private handle400Error(error: any) {
    const isInvalidToken = error.status === 400 || error.status === 401;
    if (isInvalidToken) {
      this.authService.clear();
      this.router.navigate(['/user/login']);
    }
  }
}