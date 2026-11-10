import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UserSummary } from '../user.models';
import { UserService } from '../user.service';
import { UserListComponent } from './user-list.component';
import { ManagerStore } from '../../manager.store';
import { SDKService } from '@flaps/core';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([]), UserListComponent],
      providers: [
        MockProvider(UserService, {
          getUsers: vi.fn(() =>
            of([
              { id: 'u2', name: 'Bob', email: 'bob@nuclia.com' },
              { id: 'u1', name: 'Alice', email: 'alice@nuclia.com' },
            ] as UserSummary[]),
          ),
        }),
        MockProvider(SDKService, {
          nuclia: {
            auth: {
              logout: () => {
                /* empty */
              },
            },
          },
        } as SDKService),
        MockProvider(UiConfirmService),
        MockProvider(ManagerStore, {
          canDelete: signal(true),
          canCreateUser: signal(true),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sort users by name and filter them by name, email or id', () => {
    expect(component.users().map((user) => user.id)).toEqual(['u1', 'u2']);
    component.filter.set('bob@');
    expect(component.users().map((user) => user.id)).toEqual(['u2']);
  });
});
