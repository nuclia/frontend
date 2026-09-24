import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisToastService } from '@nuclia/sistema';
import { MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UserService } from '../../../manage-users/user.service';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { AccountDetailsStore } from '../account-details.store';
import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UsersComponent,
        RouterModule.forRoot([]),
        MockModule(PaButtonModule),
        MockModule(PaDropdownModule),
        MockModule(PaIconModule),
        MockModule(PaPopupModule),
        MockModule(PaTableModule),
        MockModule(PaTextFieldModule),
        MockModule(ReactiveFormsModule),
      ],
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
