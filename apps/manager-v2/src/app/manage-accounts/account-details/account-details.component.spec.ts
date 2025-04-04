import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountDetailsComponent } from './account-details.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MockModule, MockProvider } from 'ng-mocks';
import { AccountService } from '../account.service';
import { AccountDetailsStore } from './account-details.store';
import { ZoneService } from '../../manage-zones/zone.service';
import { of } from 'rxjs';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { BackendConfigurationService } from '@flaps/core';

describe('AccountDetailsComponent', () => {
  let component: AccountDetailsComponent;
  let fixture: ComponentFixture<AccountDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, MockModule(PaButtonModule), MockModule(PaIconModule)],
      declarations: [AccountDetailsComponent],
      providers: [
        MockProvider(AccountService),
        MockProvider(ZoneService, {
          loadZones: jest.fn(() => of([])),
        }),
        MockProvider(AccountDetailsStore),
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
