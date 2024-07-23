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
  codeType: 'api' | 'python' = 'api';
  pythonCode = this.getPythonCode(this.url, this.modal.config?.data?.['params'] || {});

  constructor(
    public modal: ModalRef<{ [key: string]: any }>,
    private sdk: SDKService,
  ) {}

  private getPythonCode(endpoint: string, params: { [key: string]: any }): string {
    const method = endpoint.endsWith('/ask') ? 'ask' : endpoint.endsWith('/find') ? 'find' : '';
    if (!method) {
      return 'Unknown method';
    }
    const { query, filters, ...others } = params;
    const otherParams = Object.entries(others).reduce((acc, [key, value]) => {
      let str = '';
      if (typeof value === 'boolean') {
        str = value ? 'True' : 'False';
      } else {
        str = JSON.stringify(value);
      }
      return `${acc}\n  ${key}=${str},`;
    }, '');
    if (endpoint.includes('/slug/')) {
      const slug = endpoint.split('/slug/')[1].split('/')[0];
      return `import sdk from nuclia
resource = sdk.NucliaResource()
resource.get(slug='${slug}')
resource.${method}(
  query="${query || ''}",${otherParams}
)`;
    } else {
      return `import sdk from nuclia
search = sdk.NucliaSearch()
search.${method}(
  query="${query || ''}",${otherParams}
)`;
    }
  }
}
