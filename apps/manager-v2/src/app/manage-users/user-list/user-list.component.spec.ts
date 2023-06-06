import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { RouterTestingModule } from '@angular/router/testing';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { UserService } from '../user.service';
import { of } from 'rxjs';
import {
  PaButtonModule,
  PaIconModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
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
        MockProvider(SisModalService),
        MockProvider(SisToastService),
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
