import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { PaButtonModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Account, WritableKnowledgeBox } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
// eslint-disable-next-line @nx/enforce-module-boundaries
import * as EN from '../../../../../../../libs/common/src/assets/i18n/en.json';

import { DeveloperIntegrationsModalComponent } from '../developer-integrations-modal/developer-integrations-modal.component';
import { TestPageModalComponent } from '../test-page-modal/test-page-modal.component';
import { KbMoreActionsComponent } from './kb-more-actions.component';

function createTranslateLoader() {
  return { getTranslation: () => of(EN) };
}

describe('KbMoreActionsComponent', () => {
  let component: KbMoreActionsComponent;
  let fixture: ComponentFixture<KbMoreActionsComponent>;
  let modalService: SisModalService;

  const kb = {
    id: 'kb-id',
    slug: 'kb-slug',
  } as unknown as WritableKnowledgeBox;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KbMoreActionsComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useFactory: createTranslateLoader },
          useDefaultLang: true,
          defaultLanguage: 'en',
        }),
        MockModule(PaButtonModule),
        MockModule(PaDropdownModule),
        MockModule(PaPopupModule),
        MockModule(RouterModule),
      ],
      providers: [
        MockProvider(SDKService, {
          currentKb: of(kb),
          currentAccount: of({ id: 'account-id', slug: 'account-slug' } as unknown as Account),
          nuclia: {} as unknown as SDKService['nuclia'],
        }),
        MockProvider(NavigationService, {
          getKbUrl: (accountSlug: string, kbSlug: string) => `/at/${accountSlug}/${kbSlug}`,
        }),
        MockProvider(SisModalService, {
          openModal: jest.fn(),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KbMoreActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    modalService = TestBed.inject(SisModalService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should derive kbUrl from the current account and KB', () => {
    expect(component.kbUrl()).toBe('/at/account-slug/kb-slug');
  });

  it('should show the more actions trigger button', () => {
    const trigger = fixture.nativeElement.querySelector('.more-actions-button');
    expect(trigger).toBeTruthy();
  });

  it('should open the developer integrations modal', () => {
    component.openDeveloperIntegrations();
    expect(modalService.openModal).toHaveBeenCalledWith(DeveloperIntegrationsModalComponent);
  });

  it('should open the test page modal', () => {
    component.openTestPage();
    expect(modalService.openModal).toHaveBeenCalledWith(TestPageModalComponent);
  });
});
