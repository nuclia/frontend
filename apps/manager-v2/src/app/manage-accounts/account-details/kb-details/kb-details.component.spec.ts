import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { SisToastService } from '@nuclia/sistema';
import { MockProvider } from 'ng-mocks';
import { UserService } from '../../../manage-users/user.service';
import { AccountService } from '../../account.service';
import { AccountDetailsStore } from '../account-details.store';
import { KbDetailsComponent } from './kb-details.component';

describe('KbDetailsComponent', () => {
  let component: KbDetailsComponent;
  let fixture: ComponentFixture<KbDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
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
