import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import {
  PaButtonModule,
  PaIconModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { MockModule, MockProvider } from 'ng-mocks';
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
      imports: [
        RouterModule.forRoot([]),
        MockModule(PaButtonModule),
        MockModule(PaIconModule),
        MockModule(PaScrollModule),
        MockModule(PaTableModule),
        MockModule(PaTextFieldModule),
      ],
      declarations: [UserListComponent],
      providers: [
        MockProvider(UserService, {
          getUsers: jest.fn(() => of([])),
        }),
        MockProvider(SDKService, {
          nuclia: { auth: { logout: () => {} } },
        } as SDKService),
        MockProvider(SisModalService),
        MockProvider(SisToastService),
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
