import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DesktopUploadService {
  private static _availableSources: string[] = ['gdrive', 'dropbox', 'onedrive', 'confluence', 'sharepoint', 'sitemap'];

  static getLogoForSource(source: string) {
    return `assets/connector-logos/${source}.svg`;
  }
  static getTitleForSource(source: string) {
    switch (source) {
      case 'gdrive':
        return 'Drive';
      case 'onedrive':
        return 'OneDrive';
      default:
        return source;
    }
  }

  static availableSources = DesktopUploadService._availableSources.map((source) => ({
    logo: DesktopUploadService.getLogoForSource(source),
    text: DesktopUploadService.getTitleForSource(source),
  }));
}
