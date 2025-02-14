import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LabelModule, ParametersTableComponent, SDKService } from '@flaps/core';
import { Classification } from '@nuclia/core';
import { InfoCardComponent, SisProgressModule } from '@nuclia/sistema';
import {
  ModalRef,
  PaButtonModule,
  PaExpanderModule,
  PaIconModule,
  PaModalModule,
  PaPopupModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../upload.service';
import { PENDING_RESOURCES_LIMIT } from '../upload.utils';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SitemapSelectComponent } from './sitemap-select/sitemap-select.component';
import { catchError, defer, from, map, of, switchMap } from 'rxjs';
import { ExtractionSelectComponent } from '../extraction-select/extraction-select.component';

@Component({
  selector: 'app-upload-sitemap',
  imports: [
    CommonModule,
    InfoCardComponent,
    LabelModule,
    ExtractionSelectComponent,
    PaButtonModule,
    PaExpanderModule,
    PaIconModule,
    PaModalModule,
    PaPopupModule,
    PaTextFieldModule,
    ParametersTableComponent,
    ReactiveFormsModule,
    SisProgressModule,
    SitemapSelectComponent,
    TranslateModule,
  ],
  templateUrl: './upload-sitemap.component.html',
  styleUrls: ['./upload-sitemap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadSitemapComponent {
  isUploading = false;
  pendingResourcesLimit = PENDING_RESOURCES_LIMIT;

  sitemapForm = new FormGroup({
    css_selector: new FormControl<string | null>(null),
    xpath: new FormControl<string | null>(null),
    sitemapFilter: new FormControl<string | null>(null),
  });
  sitemapLinks: string[] = [];
  filteredSitemapLinks: string[] = [];
  selectedLabels: Classification[] = [];
  headers: { key: string; value: string }[] = [];
  cookies: { key: string; value: string }[] = [];
  localstorage: { key: string; value: string }[] = [];
  configId?: string;

  constructor(
    public modal: ModalRef,
    private sdk: SDKService,
    private uploadService: UploadService,
    private cdr: ChangeDetectorRef,
  ) {}

  close(): void {
    this.modal.close({ cancel: true });
  }

  upload() {
    this.isUploading = true;
    this.cdr.markForCheck();
    const values = this.sitemapForm.getRawValue();
    this.uploadService
      .bulkUpload(
        this.filteredSitemapLinks.map((link) =>
          defer(() => from(fetch(link, { method: 'HEAD' }))).pipe(
            map((response) => (response.headers.get('content-type') || 'text/html').split(';')[0]),
            catchError(() => of('text/html')),
            switchMap((mime) =>
              mime.startsWith('text/html')
                ? this.uploadService.createLinkResource(
                    link,
                    this.selectedLabels,
                    values.css_selector,
                    values.xpath,
                    this.cleanParameters(this.headers),
                    this.cleanParameters(this.cookies),
                    this.cleanParameters(this.localstorage),
                  )
                : this.uploadService.createCloudFileResource(link, this.selectedLabels),
            ),
          ),
        ),
      )
      .subscribe((res) => {
        this.sdk.refreshCounter();
        if (res.errors === 0) {
          this.modal.close();
        } else {
          this.isUploading = false;
          this.cdr?.markForCheck();
        }
      });
  }

  setSitemapLinks(links: string[]) {
    this.sitemapLinks = links;
    this.filterSitemapLinks();
  }

  filterSitemapLinks() {
    this.filteredSitemapLinks = this.sitemapLinks.filter((link) =>
      link.startsWith(this.sitemapForm.value.sitemapFilter || ''),
    );
  }

  cleanParameters(parameters: { key: string; value: string }[]) {
    return parameters
      .filter((header) => header.key.trim() && header.value.trim())
      .reduce((acc, curr) => ({ ...acc, [curr.key.trim()]: curr.value.trim() }), {});
  }
}
