import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersComponent } from './users.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { AccountDetailsStore } from '../account-details.store';
import { AccountService } from '../../account.service';
import { SisToastService } from '@nuclia/sistema';
import { UserService } from '../../../manage-users/user.service';
import { of } from 'rxjs';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { ManagerStore } from '../../../manager.store';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { Router, RouterModule } from '@angular/router';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaButtonModule),
        MockModule(PaDropdownModule),
        MockModule(PaIconModule),
        MockModule(PaPopupModule),
        MockModule(PaTableModule),
        MockModule(PaTextFieldModule),
        MockModule(ReactiveFormsModule),
        MockModule(PaTableModule),
        MockModule(RouterModule),
      ],
      declarations: [UsersComponent],
      providers: [
        MockProvider(AccountDetailsStore, {
          accountDetails: of(null),
        }),
        MockProvider(AccountService),
        MockProvider(UserService),
        MockProvider(SisToastService),
        MockProvider(ManagerStore, {
          canEdit: of(true),
          accountDetails: of(ACCOUNT_DETAILS),
          accountUsers: of([
            {
              id: '34f005d3-3cc1-41e4-8392-0dfd70e122df',
              email: 'catwoman+new@nuclia.com',
              name: 'catwoman',
            },
          ]),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
