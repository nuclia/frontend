import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SAMLService, GoogleService, BackendConfigurationService } from '@flaps/auth';
import { of } from 'rxjs';

import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [CallbackComponent],
        imports: [RouterTestingModule],
        providers: [
          { provide: SAMLService, useValue: { checgetTokenkDomain: () => of() } },
          { provide: GoogleService, useValue: { login: () => of() } },
          {
            provide: BackendConfigurationService,
            useValue: { getAllowdHostsRedirect: () => [], getAPIURL: () => '', staticConf: { client: 'dashboard' } },
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CallbackComponent);
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
