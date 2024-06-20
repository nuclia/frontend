import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef, PaButtonModule, PaModalModule, PaTableModule, PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SDKService } from '@flaps/core';
import { BadgeComponent, InfoCardComponent } from '@nuclia/sistema';

const OMITTED_HEADERS = ['Authorization', 'x-ndb-client'];

@Component({
  standalone: true,
  imports: [
    BadgeComponent,
    CommonModule,
    InfoCardComponent,
    PaButtonModule,
    PaModalModule,
    PaTableModule,
    PaTabsModule,
    TranslateModule,
  ],
  templateUrl: './search-request-modal.component.html',
  styleUrl: './search-request-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchRequestModalComponent {
  url = this.sdk.nuclia.rest.getFullUrl(this.modal.config?.data?.['endpoint'] || '');

  payload = Object.entries(this.modal.config?.data?.['params'] || {})
    .map(([key, value]) => {
      if (typeof value === 'object') {
        return [key, JSON.stringify(value)];
      } else {
        return [key, `${value}`];
      }
    })
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as any);

  headers = Object.entries(this.modal.config?.data?.['headers'] || {})
    .filter(([key]) => !OMITTED_HEADERS.includes(key))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as any);

  payloadJson = JSON.stringify(this.modal.config?.data?.['params'] || {}, undefined, 4);
  headersJson = JSON.stringify(this.headers, undefined, 4);

  payloadFormat: 'tabular' | 'json' = 'tabular';
  headersFormat: 'tabular' | 'json' = 'tabular';

  constructor(
    public modal: ModalRef<{ [key: string]: any }>,
    private sdk: SDKService,
  ) {}
}
