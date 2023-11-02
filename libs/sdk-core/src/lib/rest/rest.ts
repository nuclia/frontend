import { from, map, Observable, of, switchMap } from 'rxjs';
import type { INuclia, IRest } from '../models';

/**
 * Handles the elementary REST requests to the Nuclia backend, setting the appropriate HTTP headers.
 *
 * Its main methods implement the corresponding HTTP verbs (`GET` is `get()`, POST is `post()`, etc.)
 * For each of them, `extraHeaders` is an optional parameter that can be used to add headers to the request.
 *
 * On POST, PUT, PATCH and DELETE, the `synchronous` parameter will make the call synchronous,
 * meaning the response will be returned only when the operation is fully completed. It is `false` by default.
 *
 *
 * The default headers set by `Nuclia.rest` are:
 *
 * - `'content-type': 'application/json'`
 * - `Authorization` or `X-NUCLIA-SERVICEACCOUNT` depending on the type of authentication.
 *
 * The default headers will be overridden by `extraHeaders` if they have the same entries.
 *
 * `doNotParse` is a boolean that can be used to disable the automatic JSON parsing of the response. */
export class Rest implements IRest {
  private nuclia: INuclia;
  private zones?: { [key: string]: string };

  public constructor(nuclia: INuclia) {
    this.nuclia = nuclia;
  }

  get<T>(
    path: string,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    zoneSlug?: string,
  ): Observable<T> {
    return this.fetch('GET', path, undefined, extraHeaders, doNotParse, undefined, zoneSlug);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post<T>(
    path: string,
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
    zoneSlug?: string,
  ): Observable<T> {
    return this.fetch('POST', path, body, extraHeaders, doNotParse, synchronous, zoneSlug);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put<T>(
    path: string,
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
    zoneSlug?: string,
  ): Observable<T> {
    return this.fetch('PUT', path, body, extraHeaders, doNotParse, synchronous, zoneSlug);
  }

  patch<T>(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
    zoneSlug?: string,
  ): Observable<T> {
    return this.fetch('PATCH', path, body, extraHeaders, doNotParse, synchronous, zoneSlug);
  }

  delete<T>(
    path: string,
    extraHeaders?: { [key: string]: string },
    synchronous?: boolean,
    zoneSlug?: string,
  ): Observable<T> {
    return this.fetch('DELETE', path, undefined, extraHeaders, true, synchronous, zoneSlug);
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
    zoneSlug: string | undefined = undefined,
  ): Observable<T> {
    const specialContentType = extraHeaders && extraHeaders['content-type'];
    return from(
      fetch(this.getFullUrl(path, zoneSlug), {
        method,
        headers: this.getHeaders(method, path, extraHeaders, synchronous),
        body: specialContentType ? body : JSON.stringify(body),
      }).then((res) => {
        if (!res.ok) {
          this.nuclia.events?.emit<{ status: number; path: string }>('api-error', {
            status: res.status,
            path: this.getFullUrl(path),
          });
          return res.json().then(
            (body) => {
              throw { status: res.status, body };
            },
            () => {
              throw { status: res.status };
            },
          );
        }
        return doNotParse
          ? res
          : res.json().then(
              (json) => json,
              () => {
                console.warn(`${path} did not return a valid JSON`);
                return undefined;
              },
            );
      }),
    );
  }

  /**
   *  Returns the full URL of the given path, using the regional or the global Nuclia backend according to the path or the provided zone slug (if any).
   */
  getFullUrl(path: string, zoneSlug?: string): string {
    const isGlobal =
      path.startsWith('/account') ||
      path.startsWith('/user') ||
      path.startsWith('/auth') ||
      path.startsWith('/zones') ||
      path.startsWith('/billing') ||
      path.startsWith('/configuration') ||
      path.startsWith('/manage') ||
      (path.includes('/activity') && !path.includes('/activity/download'));

    let backend: string;
    if (zoneSlug && !this.nuclia.options.standalone) {
      backend = `${this.nuclia.backend.replace('https://', `https://${zoneSlug}.`)}`;
    } else {
      backend = isGlobal || this.nuclia.options.standalone ? this.nuclia.backend : this.nuclia.regionalBackend;
    }
    const version =
      path.startsWith('/auth') ||
      path.startsWith('/export') ||
      path.startsWith('/billing') ||
      path.startsWith('/configuration') ||
      path.startsWith('/manage')
        ? ''
        : '/v1';
    return `${backend}${version}${path}`;
  }

  /** Returns a dictionary giving the geographical zones available slugs by unique ids. */
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

  /**
   * Downloads the file, converts it to a BLOB and returns its `blob:` URL.
   *
   * Use carefully with big files as it can impact the memory.
   */
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
      fetch(path, {
        method: 'POST',
        headers: this.getHeaders('POST', path, undefined),
        body: JSON.stringify(body),
      }).then((res) => {
        const reader = res.body?.getReader();
        const headers = res.headers;
        const status = res.status;
        if (!reader || !res.ok) {
          observer.error({ status });
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
      });
    });
  }

  private concat(arr1: Uint8Array, arr2: Uint8Array) {
    const result = new Uint8Array(arr1.length + arr2.length);
    result.set(arr1);
    result.set(arr2, arr1.length);
    return result;
  }
}
