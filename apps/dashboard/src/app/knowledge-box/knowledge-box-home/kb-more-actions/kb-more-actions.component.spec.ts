import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaButtonModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
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
      ],
      providers: [
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

  it('should show only developer integrations and test page options without a settings link', () => {
    const options: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('pa-option');
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toContain(EN['home.developer-integrate.title']);
    expect(options[1].textContent).toContain(EN['dashboard-home.kb-details.test-page']);
    expect(fixture.nativeElement.querySelector('[routerLink], a')).toBeNull();
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
