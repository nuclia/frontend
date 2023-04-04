import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { ZoneService } from '../../services/zone.service';

import { ZoneDetailComponent } from './zone-detail.component';
import { MockModule } from 'ng-mocks';
import { PaButtonModule, PaCardModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

describe('ZoneDetailComponent', () => {
  let component: ZoneDetailComponent;
  let fixture: ComponentFixture<ZoneDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ZoneDetailComponent],
      imports: [
        RouterTestingModule,
        MockModule(PaCardModule),
        MockModule(ReactiveFormsModule),
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
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
