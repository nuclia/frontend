import { Inject, Injectable } from '@angular/core';
import { JWT_OPTIONS } from './jwtoptions.token';

@Injectable()
export class JwtHelperService {
  tokenGetter: () => string;

  constructor(@Inject(JWT_OPTIONS) config: any = null) {
    this.tokenGetter =
      config?.tokenGetter ||
      function () {
        /* empty */
      };
  }

  public urlBase64Decode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0: {
        break;
      }
      case 2: {
        output += '==';
        break;
      }
      case 3: {
        output += '=';
        break;
      }
      default: {
        throw new Error('Illegal base64url string!');
      }
    }
    return this.b64DecodeUnicode(output);
  }

  // credits for decoder goes to https://github.com/atk
  private b64decode(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';

    str = String(str).replace(/=+$/, '');

    if (str.length % 4 === 1) {
      throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }

    let bc = 0, bs: any, buffer: any;
    let idx = 0;
    while ((buffer = str.charAt(idx++))) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
      // tslint:disable-next-line:no-bitwise
      if (~buffer) {
        // tslint:disable-next-line:no-bitwise
        bs = bc % 4 ? bs * 64 + buffer : buffer;
        // tslint:disable-next-line:no-bitwise
        if (bc++ % 4) {
          // tslint:disable-next-line:no-bitwise
          output += String.fromCodePoint(255 & (bs >> ((-2 * bc) & 6)));
        }
      }
    }
    return output;
  }

  private b64DecodeUnicode(str: any) {
    return decodeURIComponent(
      Array.prototype.map
        .call(this.b64decode(str), (c: any) => {
          return '%' + ('00' + c.codePointAt(0)!.toString(16)).slice(-2);
        })
        .join(''),
    );
  }

  public decodeToken(token: string = this.tokenGetter()): any {
    if (token === null) {
      return null;
    }

    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new Error(
        "The inspected token doesn't appear to be a JWT. Check to make sure it has three parts and see https://jwt.io for more.",
      );
    }

    const decoded = this.urlBase64Decode(parts[1]);
    if (!decoded) {
      throw new Error('Cannot decode the token.');
    }

    return JSON.parse(decoded);
  }

  public getTokenExpirationDate(token: string = this.tokenGetter()): Date | null {
    const decoded: any = this.decodeToken(token);

    if (!Object.prototype.hasOwnProperty.call(decoded, 'exp')) {
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decoded.exp);

    return date;
  }

  public isTokenExpired(token: string = this.tokenGetter(), offsetSeconds?: number): boolean {
    if (token === null || token === '') {
      return true;
    }
    const date = this.getTokenExpirationDate(token);
    offsetSeconds = offsetSeconds || 0;

    if (date === null) {
      return true;
    }

    return !(date.valueOf() > new Date().valueOf() + offsetSeconds * 1000);
  }
}
