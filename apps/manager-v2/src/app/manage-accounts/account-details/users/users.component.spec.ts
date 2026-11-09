import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UserService } from '../../../manage-users/user.service';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(AccountService, {
          loadAccountUsers: vi.fn(() => of([])),
        }),
        MockProvider(UserService),
        MockProvider(UiToastService),
        MockProvider(ManagerStore, {
          canEdit: signal(true),
          accountDetails: signal(ACCOUNT_DETAILS),
          accountUsers: signal([
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
