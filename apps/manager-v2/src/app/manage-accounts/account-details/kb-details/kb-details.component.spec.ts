import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KbDetailsComponent } from './kb-details.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AccountService } from '../../account.service';
import { UserService } from '../../../manage-users/user.service';
import { AccountDetailsStore } from '../account-details.store';
import { SisToastService } from '@nuclia/sistema';
import { MockProvider } from 'ng-mocks';

describe('KbDetailsComponent', () => {
  let component: KbDetailsComponent;
  let fixture: ComponentFixture<KbDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [KbDetailsComponent],
      providers: [
        MockProvider(AccountService),
        MockProvider(UserService),
        MockProvider(AccountDetailsStore),
        MockProvider(SisToastService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KbDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
