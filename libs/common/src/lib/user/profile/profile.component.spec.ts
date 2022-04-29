import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectModule } from '@angular/material/select';
import { APIService, SDKService } from '@flaps/auth';
import { TranslatePipeMock } from '@flaps/core';
import { STFInputModule } from '@flaps/pastanaga';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ProfileComponent, TranslatePipeMock],
        imports: [ReactiveFormsModule, FormsModule, STFInputModule, MatSelectModule, NoopAnimationsModule],
        providers: [
          {
            provide: TranslateService,
            useValue: { get: () => of('') },
          },
          {
            provide: APIService,
            useValue: { get: () => of({}) },
          },
          {
            provide: SDKService,
            useValue: {
              nuclia: {
                auth: {
                  getJWTUser: () => {
                    sub: 'me';
                  },
                },
              },
            },
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    fixture.destroy();
  });
});
