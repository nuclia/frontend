import { from, map, Observable, of, switchMap, throwError } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import type { INuclia, IRest } from '../models';

export class Rest implements IRest {
  private nuclia: INuclia;
  private zones?: { [key: string]: string };

  public constructor(nuclia: INuclia) {
    this.nuclia = nuclia;
  }

  get<T>(path: string, extraHeaders?: { [key: string]: string }, doNotParse?: boolean): Observable<T> {
    return this.fetch('GET', path, undefined, extraHeaders, doNotParse);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post<T>(
    path: string,
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
  ): Observable<T> {
    return this.fetch('POST', path, body, extraHeaders, doNotParse, synchronous);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put<T>(
    path: string,
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
  ): Observable<T> {
    return this.fetch('PUT', path, body, extraHeaders, doNotParse, synchronous);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch<T>(
    path: string,
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
  ): Observable<T> {
    return this.fetch('PATCH', path, body, extraHeaders, doNotParse, synchronous);
  }

  delete<T>(path: string, extraHeaders?: { [key: string]: string }, synchronous?: boolean): Observable<T> {
    return this.fetch('DELETE', path, undefined, extraHeaders, true, synchronous);
  }

  head(path: string, extraHeaders?: { [key: string]: string }): Observable<Response> {
    return this.fetch('HEAD', path, undefined, extraHeaders, true);
  }

  private getHeaders(
    method: string,
    path: string,
    extraHeaders?: { [key: string]: string },
    synchronous = false,
  ): { [key: string]: string } {
    const auth = extraHeaders && extraHeaders['x-stf-nuakey'] ? {} : this.nuclia.auth.getAuthHeaders(method, path);
    const defaultHeaders: { [key: string]: string } = {
      'content-type': 'application/json',
      'x-ndb-client': this.nuclia.options.client || 'web',
      ...auth,
    };
    if (synchronous) {
      defaultHeaders['x-synchronous'] = `${synchronous}`;
    }
    return {
      ...defaultHeaders,
      ...extraHeaders,
    };
  }

  private fetch<T>(
    method: string,
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous = false,
  ): Observable<T> {
    const specialContentType = extraHeaders && extraHeaders['content-type'];
    return fromFetch(this.getFullUrl(path), {
      selector: (response) => Promise.resolve(response),
      headers: this.getHeaders(method, path, extraHeaders, synchronous),
      method,
      body: specialContentType ? body : JSON.stringify(body),
    }).pipe(
      switchMap((response) => {
        if (!response.ok) {
          return throwError(() => response);
        }
        return doNotParse
          ? of(response as unknown as T)
          : from(
              response
                .clone()
                .json()
                .catch(() => response.text()),
            );
      }),
    );
  }

  getFullUrl(path: string): string {
    const isGlobal =
      path.startsWith('/account') ||
      path.startsWith('/user') ||
      path.startsWith('/auth') ||
      path.startsWith('/zones') ||
      path.includes('/activity');
    const backend = isGlobal || this.nuclia.options.standalone ? this.nuclia.backend : this.nuclia.regionalBackend;
    const version = path.startsWith('/auth') || path.startsWith('/export') ? '' : '/v1';
    return `${backend}${version}${path}`;
  }

  getZones(): Observable<{ [key: string]: string }> {
    if (this.zones) {
      return of(this.zones);
    }
    return this.get<{ id: string; slug: string }[]>('/zones').pipe(
      map((zoneList) => {
        const zones = zoneList.reduce((all: { [key: string]: string }, zone) => {
          all[zone.id] = zone.slug;
          return all;
        }, {});
        this.zones = zones;
        return zones;
      }),
    );
  }

  getZoneSlug(zoneId: string): Observable<string> {
    return this.getZones().pipe(map((zones) => zones[zoneId]));
  }

  getObjectURL(path: string): Observable<string> {
    return this.get<Response>(path, undefined, true).pipe(
      switchMap((res) => from(res.blob())),
      map((blob) => {
        return URL.createObjectURL(blob);
      }),
    );
  }
}
