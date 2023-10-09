import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountDetailsComponent } from './account-details.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MockModule, MockProvider } from 'ng-mocks';
import { AccountService } from '../account.service';
import { AccountDetailsStore } from './account-details.store';
import { GlobalZoneService } from '../../manage-zones/global-zone.service';
import { of } from 'rxjs';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';

describe('AccountDetailsComponent', () => {
  let component: AccountDetailsComponent;
  let fixture: ComponentFixture<AccountDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, MockModule(PaButtonModule), MockModule(PaIconModule)],
      declarations: [AccountDetailsComponent],
      providers: [
        MockProvider(AccountService),
        MockProvider(GlobalZoneService, {
          getZones: jest.fn(() => of([])),
        }),
        MockProvider(AccountDetailsStore),
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
