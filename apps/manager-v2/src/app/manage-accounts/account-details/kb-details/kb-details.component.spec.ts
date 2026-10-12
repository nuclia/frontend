import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { SisToastService } from '@nuclia/sistema';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UserService } from '../../../manage-users/user.service';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { AccountDetailsStore } from '../account-details.store';
import { KbDetailsComponent } from './kb-details.component';

describe('KbDetailsComponent', () => {
  let component: KbDetailsComponent;
  let fixture: ComponentFixture<KbDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KbDetailsComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(AccountService),
        MockProvider(UserService),
        MockProvider(AccountDetailsStore),
        MockProvider(SisToastService),
        MockProvider(ManagerStore, {
          canEdit: of(true),
          canSeeUsers: of(true),
          accountDetails: of(ACCOUNT_DETAILS),
        }),
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
