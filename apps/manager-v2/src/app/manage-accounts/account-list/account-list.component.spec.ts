import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountListComponent } from './account-list.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { PaTableModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { AccountService } from '../account.service';

describe('AccountListComponent', () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaTextFieldModule), MockModule(PaTableModule)],
      declarations: [AccountListComponent],
      providers: [MockProvider(AccountService)],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
