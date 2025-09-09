import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BackendConfigurationService, FeaturesService } from '@flaps/core';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ZoneService } from '../../manage-zones/zone.service';
import { AccountService } from '../account.service';
import { AccountDetailsComponent } from './account-details.component';
import { AccountDetailsStore } from './account-details.store';

describe('AccountDetailsComponent', () => {
  let component: AccountDetailsComponent;
  let fixture: ComponentFixture<AccountDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([]), MockModule(PaButtonModule), MockModule(PaIconModule)],
      declarations: [AccountDetailsComponent],
      providers: [
        MockProvider(AccountService),
        MockProvider(ZoneService, {
          loadZones: jest.fn(() => of([])),
        }),
        MockProvider(AccountDetailsStore),
        MockProvider(FeaturesService, {
          isTrial: of(false),
        }),
        MockProvider(BackendConfigurationService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
