import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { RouterTestingModule } from '@angular/router/testing';
import { SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { UsersService } from '../services/users.service';

import { DashboardComponent } from './dashboard.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MockModule } from 'ng-mocks';
import { MatIconModule } from '@angular/material/icon';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [
        MatDialogModule,
        RouterTestingModule,
        MatBottomSheetModule,
        MatMenuModule,
        MockModule(MatToolbarModule),
        MockModule(MatIconModule),
      ],
      providers: [
        { provide: UsersService, useValue: { loggedout: () => of() } },
        {
          provide: SDKService,
          useValue: { nuclia: { auth: { getJWTUser: () => {}, hasLoggedOut: () => of(false) } } },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
