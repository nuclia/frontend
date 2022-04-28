export interface JwtUser {
  client_id: string;
  exp: number;
  ext: {
    first_name: string;
    type: string;
  };
  iat: number;
  iss: string;
  jti: string;
  sub: string;
  nbf: number;
  scp: string[];
}

export class JwtHelper {
  token: string;

  constructor(token: string) {
    this.token = token;
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

    for (
      // initialize result and counters
      let bc = 0, bs: any, buffer: any, idx = 0;
      // get next character
      (buffer = str.charAt(idx++));
      // character found in table? initialize bit storage and add its ascii value;
      // tslint:disable-next-line:no-bitwise
      ~buffer &&
      ((bs = bc % 4 ? bs * 64 + buffer : buffer),
      // and if not first of each 4 characters,
      // convert the first 8 bits to one ascii character
      bc++ % 4)
        ? // tslint:disable-next-line:no-bitwise
          (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  }

  private b64DecodeUnicode(str: string) {
    return decodeURIComponent(
      Array.prototype.map
        .call(this.b64decode(str), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public decodeToken(token: string = this.token): any {
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

  public getJWTUser(token: string = this.token): JwtUser | null {
    let decoded: JwtUser;
    try {
      decoded = this.decodeToken(token) as JwtUser;
    } catch (e) {
      return null;
    }
    return decoded;
  }

  public getTokenExpirationDate(token: string = this.token): Date | null {
    const user = this.getJWTUser(token);
    if (!user) {
      return null;
    }
    const date = new Date(0);
    date.setUTCSeconds(user.exp);

    return date;
  }

  public isTokenExpired(token: string = this.token, offsetSeconds?: number): boolean {
    if (token === null || token === '') {
      return true;
    }
    const date = this.getTokenExpirationDate(token);
    offsetSeconds = offsetSeconds || 0;

    if (date === null) {
      return true;
    }

    return date.valueOf() <= new Date().valueOf() + offsetSeconds * 1000;
  }
}
