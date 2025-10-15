import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FeaturesService, LabelModule, ParametersTableComponent, SDKService } from '@flaps/core';
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
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../upload.service';
import { PENDING_RESOURCES_LIMIT } from '../upload.utils';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SitemapSelectComponent } from './sitemap-select/sitemap-select.component';
import { catchError, defer, from, map, of, switchMap, take } from 'rxjs';
import { ExtractionSelectComponent } from '../extraction-select/extraction-select.component';
import { StandaloneService } from '../../services';

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
    PaTogglesModule,
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
  standalone = this.standaloneService.standalone;
  extractConfigEnabled = this.features.authorized.extractConfig;
  splitConfigEnabled = this.features.authorized.splitConfig;
  extractStrategy?: string;
  splitStrategy?: string;
  updateExisting = false;

  constructor(
    public modal: ModalRef,
    private sdk: SDKService,
    private uploadService: UploadService,
    private cdr: ChangeDetectorRef,
    private features: FeaturesService,
    private standaloneService: StandaloneService,
  ) {}

  close(): void {
    this.modal.close({ cancel: true });
  }

  upload() {
    this.isUploading = true;
    this.cdr.markForCheck();
    const values = this.sitemapForm.getRawValue();
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          this.uploadService.bulkUpload(
            this.filteredSitemapLinks.map((link) =>
              defer(() => from(fetch(link, { method: 'HEAD' }))).pipe(
                map((response) => (response.headers.get('content-type') || 'text/html').split(';')[0]),
                catchError(() => of('text/html')),
                switchMap((mime) => {
                  const linkField = {
                    css_selector: values.css_selector,
                    xpath: values.xpath,
                    headers: this.cleanParameters(this.headers),
                    cookies: this.cleanParameters(this.cookies),
                    localstorage: this.cleanParameters(this.localstorage),
                    extract_strategy: this.extractStrategy,
                    split_strategy: this.splitStrategy,
                  };
                  return mime.startsWith('text/html')
                    ? this.uploadService.createLinkResource(kb, link, this.selectedLabels, linkField).pipe(
                        catchError((error) => {
                          if (error?.status === 409 && this.updateExisting) {
                            return this.uploadService.updateLinkResource(kb, link, this.selectedLabels, linkField);
                          }
                          throw error;
                        }),
                      )
                    : this.uploadService
                        .createCloudFileResource(
                          kb,
                          link,
                          this.selectedLabels,
                          this.extractStrategy,
                          this.splitStrategy,
                        )
                        .pipe(
                          catchError((error) => {
                            if (error?.status === 409 && this.updateExisting) {
                              return this.uploadService.updateCloudFileResource(
                                kb,
                                link,
                                this.selectedLabels,
                                this.extractStrategy,
                                this.splitStrategy,
                              );
                            }
                            throw error;
                          }),
                        );
                }),
              ),
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
