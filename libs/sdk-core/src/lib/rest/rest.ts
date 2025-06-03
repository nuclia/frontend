import { catchError, from, map, Observable, of, Subscriber, switchMap } from 'rxjs';
import { NucliaDBRole } from '../auth/auth.models';
import { KBRoles } from '../db/kb/kb.models';
import type { INuclia, IRest } from '../models';

export const ABORT_STREAMING_REASON = 'Stop listening to streaming';
const NS_BINDING_ABORTED_ERROR = 'TypeError: NetworkError when attempting to fetch resource.';

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
  private streamErrorAt?: number;
  private webSockets: { [path: string]: WebSocket } = {};

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

  post<T>(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
    zoneSlug?: string,
  ): Observable<T> {
    return this.fetch('POST', path, body, extraHeaders, doNotParse, synchronous, zoneSlug);
  }

  put<T>(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  getHeaders(
    method: string,
    path: string,
    extraHeaders?: { [key: string]: string },
    synchronous = false,
  ): { [key: string]: string } {
    const auth = extraHeaders && extraHeaders['x-nuclia-nuakey'] ? {} : this.nuclia.auth.getAuthHeaders(method, path);
    const defaultHeaders: { [key: string]: string } = {
      'content-type': 'application/json',
      'x-ndb-client': this.nuclia.options.client || 'web',
      ...auth,
    };
    if (synchronous) {
      defaultHeaders['x-synchronous'] = `${synchronous}`;
    }
    const headers = {
      ...defaultHeaders,
      ...extraHeaders,
    };
    if (this.nuclia.options.modifyHeaders) {
      return this.nuclia.options.modifyHeaders(headers);
    } else {
      return headers;
    }
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
    insertAuthorizer?: boolean,
  ): Observable<T> {
    const specialContentType = extraHeaders && extraHeaders['content-type'];
    const payload = specialContentType ? body : JSON.stringify(body);
    return from(
      fetch(this.getFullUrl(path, zoneSlug, insertAuthorizer), {
        method,
        headers: this.getHeaders(method, path, extraHeaders, synchronous),
        body: payload,
      }).then((res) => {
        if (!res.ok) {
          this.nuclia.events?.emit<{ status: number; path: string }>('api-error', {
            status: res.status,
            path: this.getFullUrl(path),
          });
          return res.json().then(
            (body) => {
              const logMessage = `${res.status} error on ${method} ${path}${payload ? '\nPayload: ' + payload : ''}`;
              try {
                console.error(`${logMessage}\n${JSON.stringify(body)}`);
              } catch (e) {
                console.error(logMessage);
              }
              throw { status: res.status, body };
            },
            () => {
              console.error(`${res.status} error on ${method} ${path}${payload ? '\nPayload: ' + payload : ''}`);
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
  getFullUrl(path: string, zoneSlug?: string, insertAuthorizer?: boolean): string {
    if (path.includes('/api/authorizer/authorize')) {
      return path;
    }
    if (path.startsWith('http')) {
      return path;
    }
    const isGlobal =
      (path.startsWith('/account') && !path.includes('/activity') && !path.endsWith('/ephemeral_tokens')) ||
      path.startsWith('/user') ||
      path.startsWith('/auth') ||
      path.startsWith('/zones') ||
      path.startsWith('/billing') ||
      path.startsWith('/configuration') ||
      path.startsWith('/manage') ||
      path.startsWith('/vectorsets') ||
      path.startsWith('/marketplace');

    let backend: string;
    if (zoneSlug && !this.nuclia.options.standalone && !this.nuclia.options.proxy) {
      backend = `${this.nuclia.backend.replace('https://', `https://${zoneSlug}.`)}`;
    } else {
      backend =
        isGlobal || this.nuclia.options.standalone || this.nuclia.options.proxy
          ? this.nuclia.backend
          : this.nuclia.regionalBackend;
    }
    const version =
      path.startsWith('/auth') ||
      path.startsWith('/export') ||
      path.startsWith('/billing') ||
      path.startsWith('/configuration') ||
      path.startsWith('/manage') ||
      path.startsWith('/marketplace')
        ? ''
        : '/v1';
    const authorizer = insertAuthorizer ? '/authorizer/authorize/api' : '';
    return `${backend}${authorizer}${version}${path}`;
  }

  /**
   * Check if the user has access to the given endpoint, and return the corresponding roles.
   * */
  checkAuthorization(endpoint: string): Observable<{ allowed: boolean; roles: (KBRoles | NucliaDBRole)[] }> {
    return this.fetch<Response>('GET', endpoint, undefined, undefined, true, false, undefined, true).pipe(
      map((res) => {
        const roles = res.headers.get('x-nucliadb-roles') || '';
        return { allowed: res.ok, roles: roles.split(';') as (KBRoles | NucliaDBRole)[] };
      }),
      catchError(() => of({ allowed: false, roles: [] })),
    );
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

  /**
   * Call an endpoint streaming its response by batch of data,
   * concatenate the data with the batch received previously until the response is marked as completed and then close the connection.
   * @param path
   * @param body body to be passed as parameter to the POST request made
   */
  getStreamedResponse(
    path: string,
    body: unknown,
    extraHeaders?: { [key: string]: string },
  ): Observable<{ data: Uint8Array; incomplete: boolean; headers: Headers }> {
    path = this.getFullUrl(path);
    return new Observable<{ data: Uint8Array; incomplete: boolean; headers: Headers }>((observer) => {
      fetch(path, {
        method: 'POST',
        headers: this.getHeaders('POST', path, extraHeaders),
        body: JSON.stringify(body),
      }).then(
        (res) => {
          const reader = res.body?.getReader();
          const headers = res.headers;
          const status = res.status;
          if (!reader || !res.ok) {
            console.error(`getStreamedResponse: error ${status} on POST ${path}`);
            observer.error({ status });
            observer.complete();
          } else {
            let data = new Uint8Array();
            const readMore = () => {
              reader.read().then(
                ({ done, value }) => {
                  if (done) {
                    observer.next({ data, incomplete: false, headers });
                    observer.complete();
                  }
                  if (value) {
                    data = this.concat(data, value);
                    observer.next({ data, incomplete: true, headers });
                    readMore();
                  }
                },
                (reason) => {
                  console.error(`getStreamedResponse: read error on POST ${path}`);
                  observer.error(reason);
                  observer.complete();
                },
              );
            };
            readMore();
          }
        },
        (reason) => {
          const logMessage = `getStreamedResponse: error on POST ${path}`;
          try {
            console.error(`${logMessage}\n${JSON.stringify(reason)}`);
          } catch (e) {
            console.error(logMessage);
          }
          observer.error(reason);
          observer.complete();
        },
      );
    });
  }

  /**
   * Call a long polling HTTP endpoint streaming its response until the connection times out.
   * This method is keeping the connection alive by calling the endpoint again when it times out until the provided controller receives an abort signal
   * (or if the endpoint returns an error unrelated to the timeout).
   *
   * @param path
   * @param controller
   */
  getStreamMessages(path: string, controller: AbortController): Observable<{ data: Uint8Array; headers: Headers }> {
    path = this.getFullUrl(path);
    return new Observable<{ data: Uint8Array; headers: Headers }>((observer) =>
      this.fetchStream(path, observer, controller),
    );
  }

  private fetchStream(
    path: string,
    observer: Subscriber<{
      data: Uint8Array;
      headers: Headers;
    }>,
    controller: AbortController,
  ) {
    fetch(path, { method: 'GET', headers: this.getHeaders('GET', path), signal: controller.signal }).then(
      (res) => {
        const reader = res.body?.getReader();
        const headers = res.headers;
        const status = res.status;
        if (!reader || !res.ok) {
          console.error(`getStreamedMessage: error ${status} on GET ${path}`);
          observer.error({ status });
          observer.complete();
        } else {
          const readMore = () => {
            reader.read().then(
              ({ value }) => {
                if (value) {
                  observer.next({ data: value, headers });
                  readMore();
                } else {
                  // we get an undefined value when the stream is timing out, so we reconnect
                  this.fetchStream(path, observer, controller);
                }
              },
              (reason) => {
                observer.error(reason);
                observer.complete();
              },
            );
          };
          readMore();
        }
      },
      (reason) => {
        // when aborting the fetch using the AbortController, we provide the ABORT_STREAMING_REASON
        // allowing us to know we should not raise an error in the observer
        if (reason === ABORT_STREAMING_REASON) {
          observer.complete();
        } else {
          // Error on fetch can be caused by the backend not closing gracefully the stream on time (causing errors like NS_ERROR_NET_PARTIAL_TRANSFER, or CORS error)
          // If there was no error before, or last error was more than 10s ago, we reconnect
          // except if the error reason is from NS_BINDING_ABORTED, which happens when reloading the page on firefox
          if (
            reason.toString() !== NS_BINDING_ABORTED_ERROR &&
            (!this.streamErrorAt || Date.now() - this.streamErrorAt > 10000)
          ) {
            console.warn(`Message stream lost: "${reason}". Reconnecting at ${new Date()}`);
            this.streamErrorAt = Date.now();
            this.fetchStream(path, observer, controller);
          } else {
            console.error(`getStreamedMessage: error on GET ${path} (stream lost): ${reason}`);
            observer.error(`Message stream lost: ${reason}`);
            observer.complete();
          }
        }
      },
    );
  }

  private concat(arr1: Uint8Array, arr2: Uint8Array) {
    const result = new Uint8Array(arr1.length + arr2.length);
    result.set(arr1);
    result.set(arr2, arr1.length);
    return result;
  }

  getWsUrl(path: string, ephemeralToken: string): string {
    return `${this.getFullUrl(path).replace('https', 'wss')}?eph-token=${ephemeralToken}`;
  }

  /**
   * Open a WebSocket for the given path
   * @param path
   * @param ephemeralToken Ephemeral token authorizing WebSocket connection
   * @returns Observable streaming the messages received on the WebSocket
   */
  openWebSocket<T>(path: string, ephemeralToken: string): Observable<T> {
    const wsUrl = this.getWsUrl(path, ephemeralToken);
    if (this.webSockets[wsUrl]) {
      throw new Error(`A websocket is already open on ${path}`);
    }
    this.webSockets[wsUrl] = new WebSocket(wsUrl);

    return new Observable((observer) => {
      const ws = this.webSockets[wsUrl];
      ws.onopen = function (event) {
        console.debug(`Open event`, event);
        observer.next('Opened' as T);
      };
      ws.onmessage = function (event) {
        console.debug(`Message`, event);
        observer.next(event.data);
      };
      ws.onclose = function (event) {
        console.debug(`Close event:`, event);
        observer.complete();
      };
      ws.onerror = function (event) {
        console.debug(`Error event:`, event);
        observer.error(event);
      };
    });
  }

  /**
   * Close the WebSocket opened on the given path
   * @param path
   * @param ephemeralToken Ephemeral token authorizing WebSocket connection
   */
  closeWebSocket(path: string, ephemeralToken: string) {
    const wsUrl = this.getWsUrl(path, ephemeralToken);
    if (!this.webSockets[wsUrl]) {
      console.error(`No web socket opened on ${path}.`);
    }
    this.webSockets[wsUrl].close();
    delete this.webSockets[wsUrl];
  }

  /**
   * Send data on the WebSocket previously opened on the given path.
   * @param path
   * @param ephemeralToken Ephemeral token authorizing WebSocket connection
   * @param data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send(path: string, ephemeralToken: string, data: any) {
    const wsUrl = this.getWsUrl(path, ephemeralToken);
    if (!this.webSockets[wsUrl]) {
      throw new Error(
        `No web socket opened on ${path}. You must open a web socket by calling openWebSocket() before sending data.`,
      );
    }
    const ws = this.webSockets[wsUrl];
    ws.send(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  }
}
