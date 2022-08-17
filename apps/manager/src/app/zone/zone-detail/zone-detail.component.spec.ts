import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { ZoneService } from '../../services/zone.service';

import { ZoneDetailComponent } from './zone-detail.component';
import { MockModule } from 'ng-mocks';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { STFButtonsModule } from '@flaps/pastanaga';

describe('ZoneDetailComponent', () => {
  let component: ZoneDetailComponent;
  let fixture: ComponentFixture<ZoneDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ZoneDetailComponent],
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
        MockModule(MatCardModule),
        MockModule(MatFormFieldModule),
        MockModule(STFButtonsModule),
      ],
      providers: [
        { provide: ZoneService, useValue: { edit: () => of(), create: () => of() } },
        { provide: SDKService, useValue: { nuclia: { auth: { getJWTUser: () => {} } } } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoneDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
