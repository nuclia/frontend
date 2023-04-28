import { from, map, Observable, of, switchMap } from 'rxjs';
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
    return from(
      fetch(this.getFullUrl(path), {
        method,
        headers: this.getHeaders(method, path, extraHeaders, synchronous),
        body: specialContentType ? body : JSON.stringify(body),
      }).then((res) => {
        if (!res.ok) {
          throw new Error(`${res.status}`);
        }
        return doNotParse ? res : res.json();
      }),
    );
  }

  getFullUrl(path: string): string {
    const isGlobal =
      path.startsWith('/account') ||
      path.startsWith('/user') ||
      path.startsWith('/auth') ||
      path.startsWith('/zones') ||
      path.startsWith('/billing') ||
      path.startsWith('/configuration') ||
      path.startsWith('/manage') ||
      path.includes('/activity');
    const backend = isGlobal || this.nuclia.options.standalone ? this.nuclia.backend : this.nuclia.regionalBackend;
    const version =
      path.startsWith('/auth') ||
      path.startsWith('/export') ||
      path.startsWith('/billing') ||
      path.startsWith('/configuration')||
      path.startsWith('/manage')
        ? ''
        : '/v1';
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

  getStream(path: string, body: any): Observable<{ data: Uint8Array; incomplete: boolean; headers: Headers }> {
    path = this.getFullUrl(path);
    return new Observable<{ data: Uint8Array; incomplete: boolean; headers: Headers }>((observer) => {
      fetch(path, { method: 'POST', headers: this.getHeaders('POST', path), body: JSON.stringify(body) }).then(
        (res) => {
          const reader = res.body?.getReader();
          const headers = res.headers;
          if (!reader) {
            observer.next({ data: new Uint8Array(), incomplete: false, headers });
            observer.complete();
          } else {
            let data = new Uint8Array();
            const readMore = () => {
              reader.read().then(({ done, value }) => {
                if (done) {
                  observer.next({ data, incomplete: false, headers });
                  observer.complete();
                }
                if (value) {
                  data = this.concat(data, value);
                  observer.next({ data, incomplete: true, headers });
                  readMore();
                }
              });
            };
            readMore();
          }
        },
      );
    });
  }

  private concat(arr1: Uint8Array, arr2: Uint8Array) {
    const result = new Uint8Array(arr1.length + arr2.length);
    result.set(arr1);
    result.set(arr2, arr1.length);
    return result;
  }
}
