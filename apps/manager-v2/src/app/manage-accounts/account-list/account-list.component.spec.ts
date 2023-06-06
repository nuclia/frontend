import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountListComponent } from './account-list.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { PaScrollModule, PaTableModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { AccountService } from '../account.service';
import { of } from 'rxjs';
import { SisModalService, SisToastService } from '@nuclia/sistema';

describe('AccountListComponent', () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaScrollModule), MockModule(PaTableModule), MockModule(PaTextFieldModule)],
      declarations: [AccountListComponent],
      providers: [
        MockProvider(AccountService, {
          getAccounts: jest.fn(() => of([])),
        }),
        MockProvider(SisModalService),
        MockProvider(SisToastService),
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
