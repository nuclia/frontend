import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { SisToastService } from '@nuclia/sistema';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sitemap-select',
  templateUrl: './sitemap-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, PaButtonModule, TranslateModule],
})
export class SitemapSelectComponent {
  @Output() select = new EventEmitter<string[]>();

  constructor(private toaster: SisToastService) {}

  readSitemap(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const links = this.parseSitemap(reader.result as string);
        if (links) {
          this.select.emit(links);
        } else {
          (event.target as HTMLInputElement).value = '';
          this.toaster.error('upload.invalid-sitemap');
        }
      };
      reader.onerror = () => {
        this.toaster.error('upload.invalid-sitemap');
      };
      reader.readAsText(file, 'UTF-8');
    }
  }

  parseSitemap(sitemapContent: string): string[] | null {
    const urls: string[] = [];
    const parser = new DOMParser();
    const document = parser.parseFromString(sitemapContent, 'application/xml');
    const error = document.querySelector('parsererror');
    if (error) {
      return null;
    }
    document.querySelectorAll('url').forEach((url) => {
      const loc = url.querySelector('loc')?.textContent?.trim();
      if (loc) {
        urls.push(loc);
      }
    });
    return urls;
  }
}
