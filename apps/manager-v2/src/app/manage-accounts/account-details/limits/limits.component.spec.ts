import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiToastService } from '@nuclia/ui/toast';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { ACCOUNT_DETAILS, DEFAULT_LIMITS } from '../../test-utils';
import { LimitsComponent } from './limits.component';

describe('LimitsComponent', () => {
  let component: LimitsComponent;
  let fixture: ComponentFixture<LimitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LimitsComponent, MockComponent(FormFooterComponent)],
      providers: [
        MockProvider(AccountService, {
          getDefaultLimits: vi.fn(() => of(DEFAULT_LIMITS)),
        }),
        MockProvider(UiToastService),
        MockProvider(ManagerStore, {
          canEdit: signal(true),
          accountDetails: signal(ACCOUNT_DETAILS),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LimitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
