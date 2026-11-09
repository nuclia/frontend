import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../manager.store';
import { AccountService } from '../account.service';
import { AccountListComponent } from './account-list.component';

describe('AccountListComponent', () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountListComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(AccountService, {
          getAccounts: vi.fn(() => of([])),
        }),
        MockProvider(UiConfirmService),
        MockProvider(UiToastService),
        MockProvider(ManagerStore, {
          canDeleteAccount: of(true),
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
