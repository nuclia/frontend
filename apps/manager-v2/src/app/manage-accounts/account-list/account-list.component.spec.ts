import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaScrollModule, PaTableModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../manager.store';
import { AccountService } from '../account.service';
import { AccountListComponent } from './account-list.component';

describe('AccountListComponent', () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AccountListComponent,
        RouterModule.forRoot([]),
        MockModule(PaScrollModule),
        MockModule(PaTableModule),
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
      ],
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
