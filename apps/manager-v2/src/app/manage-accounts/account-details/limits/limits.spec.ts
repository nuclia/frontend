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
import { LimitsService } from './limits.service';
import { getBulkLimitsPayload, toLimitsFormValue, toLimitsPayload } from './limits.utils';

describe('Limits', () => {
  let fixture: ComponentFixture<LimitsComponent>;
  let accountService: AccountService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LimitsComponent, MockComponent(FormFooterComponent)],
      providers: [
        MockProvider(AccountService, {
          getDefaultLimits: vi.fn(() => of(DEFAULT_LIMITS)),
          updateAccountLimits: vi.fn(() => of(ACCOUNT_DETAILS)),
        }),
        MockProvider(UiToastService),
        MockProvider(ManagerStore, {
          canEdit: signal(true),
          accountDetails: signal(ACCOUNT_DETAILS),
          getAccountId: vi.fn(() => ACCOUNT_DETAILS.id),
        }),
      ],
    }).compileComponents();

    accountService = TestBed.inject(AccountService);
    fixture = TestBed.createComponent(LimitsComponent);
    fixture.detectChanges();
  });

  const getVm = () => fixture.debugElement.injector.get(LimitsService);
  const getLimitInputs = () => fixture.nativeElement.querySelectorAll('input[type=number]') as NodeListOf<HTMLElement>;

  it('should render a row per limit and show the value input only for limited ones', () => {
    expect(fixture.nativeElement.querySelectorAll('app-limit-row').length).toBe(12);
    // Only upload_limit_max_non_media_file_size is limited in the fixture
    expect(getLimitInputs().length).toBe(1);
  });

  it('should show the value input when switching a limit to "limit"', () => {
    getVm()
      .limitsForm.get('usage.storage_limit_max_bytes_per_kb')
      ?.get('storage_limit_max_bytes_per_kb-radio')
      ?.setValue('limit');
    fixture.detectChanges();
    expect(getLimitInputs().length).toBe(2);
  });

  it('should save unlimited limits as -1', () => {
    const vm = getVm();
    vm.limitsForm.get('upload.upload_limit_max_non_media_file_size.limit')?.setValue(500);
    vm.save();

    const payload = vi.mocked(accountService.updateAccountLimits).mock.calls[0][1];
    expect(payload.upload).toEqual({ upload_limit_max_media_file_size: -1, upload_limit_max_non_media_file_size: 500 });
    expect(payload.usage.storage_limit_max_bytes_per_kb).toBe(-1);
    expect(vm.limitsForm.pristine).toBe(true);
  });

  it('should reset a limit to the default of the account type', () => {
    const vm = getVm();
    vm.reset('upload', 'upload_limit_max_media_file_size');
    expect(vm.limitsForm.get('upload.upload_limit_max_media_file_size')?.value).toEqual({
      limit: 1000000,
      'upload_limit_max_media_file_size-radio': 'limit',
    });
  });

  it('should send null to reset all limits and -1 to remove them', () => {
    const vm = getVm();
    vm.resetAllToDefault();
    vm.removeLimits();

    const calls = vi.mocked(accountService.updateAccountLimits).mock.calls;
    expect(calls[0][1].upload.upload_limit_max_media_file_size).toBeNull();
    expect(calls[1][1].usage.monthly_limit_paragraphs_stored).toBe(-1);
  });

  describe('utils', () => {
    it('should convert limits to form value and back to payload', () => {
      const formValue = toLimitsFormValue({ upload: ACCOUNT_DETAILS.limits.upload } as typeof ACCOUNT_DETAILS.limits);
      expect(formValue['upload']['upload_limit_max_media_file_size']).toEqual({
        limit: -1,
        'upload_limit_max_media_file_size-radio': 'unlimited',
      });
      expect(toLimitsPayload(formValue)).toEqual({ upload: ACCOUNT_DETAILS.limits.upload });
    });

    it('should fill every limit with the given value', () => {
      const payload = getBulkLimitsPayload(null);
      expect(Object.values(payload.upload).every((value) => value === null)).toBe(true);
      expect(Object.keys(payload.usage).length).toBe(10);
    });
  });
});
