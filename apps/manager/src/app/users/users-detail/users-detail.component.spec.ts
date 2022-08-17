import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { SDKService } from '@flaps/core';
import { UsersService } from '../../services/users.service';

import { UsersDetailComponent } from './users-detail.component';
import { MockModule } from 'ng-mocks';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { STFButtonsModule } from '@flaps/pastanaga';

describe('UsersDetailComponent', () => {
  let component: UsersDetailComponent;
  let fixture: ComponentFixture<UsersDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UsersDetailComponent],
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
        MockModule(MatCardModule),
        MockModule(MatFormFieldModule),
        MockModule(STFButtonsModule),
      ],
      providers: [
        { provide: UsersService, useValue: { reset: () => {} } },
        { provide: SDKService, useValue: { nuclia: { auth: { getJWTUser: () => {} } } } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
