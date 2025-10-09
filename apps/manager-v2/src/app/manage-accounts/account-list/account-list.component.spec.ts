import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountListComponent } from './account-list.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { PaButtonModule, PaScrollModule, PaTableModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { AccountService } from '../account.service';
import { of } from 'rxjs';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { ManagerStore } from '../../manager.store';

describe('AccountListComponent', () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaScrollModule),
        MockModule(PaTableModule),
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
      ],
      declarations: [AccountListComponent],
      providers: [
        MockProvider(AccountService, {
          getAccounts: jest.fn(() => of([])),
        }),
        MockProvider(SisModalService),
        MockProvider(SisToastService),
        MockProvider(ManagerStore, {
          canDelete: of(true),
          canCreateAccount: of(true),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
