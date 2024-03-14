import { from, map, Observable, switchMap, timer } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

export const RELEASE_URL = 'https://github.com/nuclia/frontend/releases/latest';
const RELEASE_API_URL = 'https://api.github.com/repos/nuclia/frontend/releases/latest';

const APP_FILENAMES = {
  mac: /.*-universal\.dmg$/,
  win: /.*\.exe$/,
  linux: /.*\.snap$/,
};

export function getDesktopPlatform(): 'win' | 'mac' | 'linux' | null {
  const platform = window.navigator.platform.toLowerCase();
  if (platform.includes('win')) {
    return 'win';
  } else if (platform.includes('mac')) {
    return 'mac';
  } else if (platform.includes('linux')) {
    return 'linux';
  }
  return null;
}

export function getDesktopAppUrl(platform: 'mac' | 'win' | 'linux'): Observable<string | null> {
  return fromFetch(RELEASE_API_URL).pipe(
    switchMap((response) => {
      if (response.ok) {
        return from(response.json());
      } else {
        throw new Error();
      }
    }),
    map((data) => {
      const asset = (data['assets'] as any[]).find((asset) => APP_FILENAMES[platform].test(asset.name));
      return asset?.browser_download_url || null;
    }),
  );
}

function downloadDesktop() {
  const platform = getDesktopPlatform();
  if (platform) {
    getDesktopAppUrl(platform).subscribe((url) => {
      window.open(url || RELEASE_URL);
    });
  } else {
    window.open(RELEASE_URL);
  }
}
