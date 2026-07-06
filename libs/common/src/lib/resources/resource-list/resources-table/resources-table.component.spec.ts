import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterModule } from '@angular/router';
import { FeaturesService, SDKService } from '@flaps/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaScrollModule,
  PaTableModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Account, Nuclia, WritableKnowledgeBox } from '@nuclia/core';
import { DropdownButtonComponent, SisModalService, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UploadService } from '../../../upload';
import { TablePaginationComponent } from '../table-pagination/table-pagination.component';
import { ResourceListService } from './../resource-list.service';
import { ResourcesTableComponent } from './resources-table.component';
import { ResourceWithLabels } from '../resource-list.model';

describe('ResourceTableComponent', () => {
  let component: ResourcesTableComponent;
  let fixture: ComponentFixture<ResourcesTableComponent>;

  function getRow(keyValueFields: ResourceWithLabels['keyValueFields']): ResourceWithLabels {
    return {
      resource: { id: 'resource-1' } as any,
      labels: [],
      keyValueFields,
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResourcesTableComponent],
      imports: [
        RouterModule.forRoot([]),
        MockModule(TranslateModule),
        MockModule(PaScrollModule),
        MockModule(PaTableModule),
        MockModule(PaButtonModule),
        MockModule(PaTogglesModule),
        MockModule(PaTooltipModule),
        MockModule(PaDropdownModule),
        MockComponent(DropdownButtonComponent),
        MockComponent(StickyFooterComponent),
        MockComponent(TablePaginationComponent),
      ],
      providers: [
        MockProvider(SDKService, {
          currentAccount: of({ id: '123' } as Account),
          currentKb: of({
            admin: true,
            catalog: jest.fn(() => of()),
            search: jest.fn(() => of()),
          } as unknown as WritableKnowledgeBox),
          nuclia: {
            options: {},
          } as unknown as Nuclia,
        }),
        MockProvider(SisModalService),
        MockProvider(SisToastService),
        MockProvider(TranslateService),
        MockProvider(FeaturesService, {
          isKbAdminOrContrib: of(true),
          authorized: {},
        } as FeaturesService),
        MockProvider(UploadService, {
          statusCount: of({ processed: 0, pending: 0, error: 0 }),
        }),
        MockProvider(ResourceListService, {
          filters: of([]),
          loadResources: jest.fn(() => of()),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourcesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows key-value fields in a compact string', () => {
    const value = component.getKeyValueFieldsDisplay(
      getRow([
        {
          id: 'generic_schema_1.available',
          group: 'generic_schema_1',
          key: 'available',
          label: 'available',
          value: true,
        },
        {
          id: 'generic_schema_1.expires_at',
          group: 'generic_schema_1',
          key: 'expires_at',
          label: 'expires_at',
          value: 'Jul 03, 2026',
        },
      ]),
    );

    expect(value).toBe('available: true · expires_at: Jul 03, 2026');
  });

  it('formats key-value values without raw JSON', () => {
    const value = component.getKeyValueFieldsDisplay(
      getRow([
        {
          id: 'generic_schema_1.quantity',
          group: 'generic_schema_1',
          key: 'quantity',
          label: 'quantity',
          value: { lower: 1, upper: 5 },
        },
        {
          id: 'generic_schema_1.label_repeated',
          group: 'generic_schema_1',
          key: 'label_repeated',
          label: 'label_repeated',
          value: ['label_1', 'label_2'],
        },
        {
          id: 'generic_schema_1.available',
          group: 'generic_schema_1',
          key: 'available',
          label: 'available',
          value: true,
        },
        {
          id: 'generic_schema_1.price',
          group: 'generic_schema_1',
          key: 'price',
          label: 'price',
          value: 1.15,
        },
      ]),
    );

    expect(value).toContain('quantity: 1 – 5');
    expect(value).toContain('label_repeated: label_1, label_2');
    expect(value).toContain('available: true');
    expect(value).toContain('price: 1.15');
    expect(value).not.toContain('{"lower":1,"upper":5}');
    expect(value).not.toContain('["label_1","label_2"]');
  });

  it('never renders field status as key-value content', () => {
    const value = component.getKeyValueFieldsDisplay(
      getRow([
        {
          id: 'generic_schema_1.available',
          group: 'generic_schema_1',
          key: 'available',
          label: 'available',
          value: true,
        },
      ]),
    );

    expect(value).not.toContain('status: PROCESSED');
    expect(value).toContain('available: true');
  });

  it('shows an em dash when key-value data is missing', () => {
    expect(component.getKeyValueFieldsDisplay(getRow([]))).toBe('—');
  });

  it('starts with collapsed key-value field display', () => {
    expect(component.fullKeyValueFields).toBe(false);
  });

  it('can toggle key-value field expansion state', () => {
    component.fullKeyValueFields = true;

    expect(component.fullKeyValueFields).toBe(true);
  });

  it('keeps existing columns and adds optional key-value fields column', () => {
    const columns = component.initialColumns.map((column) => column.id);

    expect(columns).toContain('title');
    expect(columns).toContain('language');
    expect(columns).toContain('key-value-fields');
  });
});
