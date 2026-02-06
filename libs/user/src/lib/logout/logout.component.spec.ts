import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SDKService } from '@flaps/core';

import { RouterModule } from '@angular/router';
import { LogoutComponent } from './logout.component';

describe('LogoutComponent', () => {
  let component: LogoutComponent;
  let fixture: ComponentFixture<LogoutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LogoutComponent],
      imports: [RouterModule.forRoot([])],
      providers: [
        { provide: SDKService, useValue: { nuclia: { auth: { logout: () => {}, redirectToOAuth: () => {} } } } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutComponent);
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
