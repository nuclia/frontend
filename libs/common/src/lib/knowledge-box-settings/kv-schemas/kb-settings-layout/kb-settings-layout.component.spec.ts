import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SDKService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { of } from 'rxjs';
import { StandaloneService } from '../../../services';
import { KnowledgeBoxSettingsComponent } from '../../knowledge-box-settings.component';
import { KbSettingsLayoutComponent } from './kb-settings-layout.component';

@Component({ template: '<h1>Schema content</h1>' })
class SchemaContentComponent {}

describe('Settings page layout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KbSettingsLayoutComponent, KnowledgeBoxSettingsComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([
          {
            path: 'manage',
            component: KbSettingsLayoutComponent,
            children: [
              { path: 'general', component: KnowledgeBoxSettingsComponent, data: { embedded: true } },
              { path: 'kv-schemas', component: SchemaContentComponent },
            ],
          },
          { path: 'standalone', component: KnowledgeBoxSettingsComponent },
        ]),
        {
          provide: SDKService,
          useValue: {
            currentKb: of({
              id: 'kb',
              slug: 'kb',
              title: 'Test KB',
              getProcessingHook: () => of(undefined),
            }),
            isArag: of(false),
            nuclia: { auth: { getAuthInfo: () => of({}) } },
          },
        },
        { provide: StandaloneService, useValue: { standalone: true } },
        { provide: SisToastService, useValue: {} },
        { provide: SisModalService, useValue: {} },
      ],
    })
      .overrideComponent(KnowledgeBoxSettingsComponent, {
        set: { imports: [TranslateModule], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('places one Settings heading above content-width tabs without nested page spacing', async () => {
    const harness = await RouterTestingHarness.create('/manage/general');
    const page = harness.routeNativeElement;
    expect(page?.querySelectorAll('h1')).toHaveLength(1);
    expect(page?.querySelector('header .page-title')?.textContent).toContain('stash.profile');
    const layout = page?.querySelector('.kb-settings-layout');
    expect(layout?.classList.contains('page-spacing')).toBe(true);
    expect(Array.from(layout?.children ?? []).map((element) => element.tagName)).toEqual(['HEADER', 'PA-TABS', 'DIV']);
    expect(page?.querySelector('.pa-full-width-tabs')).toBeNull();
    expect(page?.querySelector('.knowledge-box-settings')?.classList.contains('page-spacing')).toBe(false);
    expect(page?.querySelectorAll('.pa-tabs-link')[0].getAttribute('aria-selected')).toBe('true');
  });

  it('retains the shared header when switching tabs and supports direct schema links', async () => {
    const harness = await RouterTestingHarness.create('/manage/kv-schemas');
    expect(harness.routeNativeElement?.querySelector('header .page-title')?.textContent).toContain('stash.profile');
    expect(harness.routeNativeElement?.querySelectorAll('.pa-tabs-link')[1].getAttribute('aria-selected')).toBe('true');
    const layout = await harness.navigateByUrl('/manage/kv-schemas', KbSettingsLayoutComponent);
    layout.navigateTo('general');
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('.knowledge-box-settings')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelectorAll('h1')).toHaveLength(1);
  });

  it('preserves the header and page spacing when general settings is used outside the tab shell', async () => {
    const harness = await RouterTestingHarness.create('/standalone');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('stash.profile');
    expect(
      harness.routeNativeElement?.querySelector('.knowledge-box-settings')?.classList.contains('page-spacing'),
    ).toBe(true);
  });
});
