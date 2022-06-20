import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BackendConfigurationService } from './backend-config.service';
import { SDKService } from './sdk.service';

@Injectable({
  providedIn: 'root',
})
/**
 * @deprecated Use the SDKService instead
 */
export class APIService {
  constructor(private http: HttpClient, private config: BackendConfigurationService, private sdk: SDKService) {}

  createHeaders(auth = true): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');
    if (auth) {
      const auth_header = 'Bearer ' + this.sdk.nuclia.auth.getToken();
      headers = headers.set('Authorization', auth_header);
    }
    return headers;
  }

  get(url: string, auth?: boolean, responseType?: string, relative?: boolean): Observable<any> {
    // do a get request to site
    if (relative) {
      url = this.config.getAPIURL() + url;
    }
    const options: any = { headers: this.createHeaders(auth) };
    if (responseType) {
      options.responseType = responseType;
    }
    return this.http.get(url, options);
  }

  post(
    url: string,
    data: Object,
    auth?: boolean,
    responseType?: string,
    contentType?: string,
    relative?: boolean,
    customHeaders?: any[],
  ): Observable<any> {
    // do a post request to site
    let headers: HttpHeaders = this.createHeaders(auth);
    if (contentType) {
      headers = headers.set('Content-Type', contentType);
    }
    if (customHeaders) {
      for (const ch of customHeaders) {
        headers = headers.set(ch[0], ch[1]);
      }
    }

    if (relative) {
      url = this.config.getAPIURL() + url;
    }
    const options: any = { headers: headers };
    if (responseType) {
      options.responseType = responseType;
    }
    return this.http.post(url, data, options);
  }

  put(url: string, data: Object, auth?: boolean, relative?: boolean): Observable<any> {
    const headers = this.createHeaders(auth);
    if (relative) {
      url = this.config.getAPIURL() + url;
    }
    return this.http.put(url, data, {
      headers: headers,
    });
  }

  head(url: string, auth?: boolean, relative?: boolean): Observable<any> {
    const headers = this.createHeaders(auth);
    if (relative) {
      url = this.config.getAPIURL() + url;
    }
    return this.http.head(url, {
      headers: headers,
    });
  }

  delete(url: string, auth?: boolean, relative?: boolean): Observable<any> {
    const headers = this.createHeaders(auth);
    if (relative) {
      url = this.config.getAPIURL() + url;
    }
    return this.http.delete(url, {
      headers: headers,
    });
  }

  patch(
    url: string,
    data: Object,
    auth?: boolean,
    contentType?: string,
    relative?: boolean,
    customHeaders?: any[],
  ): Observable<any> {
    let headers = this.createHeaders(auth);
    if (contentType) {
      headers = headers.set('Content-Type', contentType);
    }
    if (customHeaders) {
      for (const ch of customHeaders) {
        headers = headers.set(ch[0], ch[1]);
      }
    }
    if (relative) {
      url = this.config.getAPIURL() + url;
    }
    return this.http.patch(url, data, {
      headers: headers,
    });
  }

  getBlob(url: string, auth?: boolean): Observable<Blob> {
    let headers = this.createHeaders(auth);
    headers = headers.set('Accept', '*/*');
    return this.http.get(url, {
      headers: headers,
      responseType: 'blob',
    });
  }

  getFile(url: string): Observable<any> {
    return new Observable((observer) => {
      let objectUrl: string | null = null;

      this.http
        .get(url, {
          headers: this.createHeaders(true),
          responseType: 'blob',
        })
        .pipe(
          catchError((error) => {
            if (error.status === 404) {
              return of('notfound');
            } else {
              return of('error');
            }
          }),
        )
        .subscribe((m) => {
          if (m === 'error') {
            objectUrl = '/assets/images/default_image.jpg';
          } else if (m === 'notfound') {
            objectUrl = '/assets/images/default_image.jpg';
          } else {
            objectUrl = URL.createObjectURL(m as Blob);
          }
          observer.next(objectUrl);
        });

      return () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
      };
    });
  }

  getFileText(url: string, auth?: boolean): Observable<string> {
    let headers = this.createHeaders(auth);
    headers = headers.set('Accept', '*/*');
    return this.http.get(url, {
      headers: headers,
      responseType: 'text',
    });
  }

  uploadFile(
    url: string,
    data: ArrayBuffer,
    filename: string,
    contentType: string,
    relative?: boolean,
  ): Observable<any> {
    const headers = [['X-UPLOAD-FILENAME', filename]];
    if (data.byteLength) {
      headers.push(['X-UPLOAD-SIZE', data.byteLength.toString()]);
    }
    if (filename.split('.').length > 1) {
      const extension = filename.split('.').splice(-1)[0];
      headers.push(['X-UPLOAD-EXTENSION', extension]);
    }
    return this.patch(url, data, true, contentType, relative, headers);
  }
}
