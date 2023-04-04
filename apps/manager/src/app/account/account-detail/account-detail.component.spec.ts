import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { UsersService } from '../../services/users.service';
import { ZoneService } from '../../services/zone.service';

import { AccountDetailComponent } from './account-detail.component';
import { MockModule } from 'ng-mocks';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

describe('AccountDetailComponent', () => {
  let component: AccountDetailComponent;
  let fixture: ComponentFixture<AccountDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AccountDetailComponent],
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MockModule(PaButtonModule),
        MockModule(PaTextFieldModule),
      ],
      providers: [
        {
          provide: AccountService,
          useValue: {
            getAccount: () => of(),
            addAccountUser: () => of(),
            delAdminStashifyUser: () => of(),
            setAdminStashifyUser: () => of(),
            deleteUser: () => of(),
            edit: () => of(),
            create: () => of(),
            createStash: () => of(),
            startACCampaign: () => of(),
          },
        },
        { provide: UsersService, useValue: { searchUser: () => of([]) } },
        { provide: ZoneService, useValue: { getZones: () => of([]) } },
        { provide: SDKService, useValue: { nuclia: { auth: { getJWTUser: () => {} } } } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
