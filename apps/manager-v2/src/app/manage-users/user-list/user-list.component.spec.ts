import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
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
          getUsers: vi.fn(() => of([])),
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
        MockProvider(UiToastService),
        MockProvider(ManagerStore, {
          canDelete: of(true),
          canCreateUser: of(true),
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
});
