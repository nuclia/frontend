import { ComponentFixture, TestBed } from '@angular/core/testing';
import { toast } from '@spartan-ng/brain/sonner';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { BillingFormula, ManagerAccountSubscription } from '../../global-account.models';
import { GlobalAccountService } from '../../global-account.service';
import { SubscriptionsComponent } from './subscriptions.component';
import { SubscriptionsService } from './subscriptions.service';
import { buildBasePayload, getProductLineOptions, getProductOptions } from './subscriptions.utils';

describe('Subscriptions', () => {
  let fixture: ComponentFixture<SubscriptionsComponent>;
  let globalService: GlobalAccountService;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function setup(subscription: ManagerAccountSubscription | null) {
    vi.spyOn(toast, 'success').mockImplementation(() => '');
    vi.spyOn(toast, 'error').mockImplementation(() => '');
    await TestBed.configureTestingModule({
      imports: [SubscriptionsComponent],
      providers: [
        MockProvider(ManagerStore, { getAccountId: vi.fn(() => 'account-id') }),
        MockProvider(GlobalAccountService, {
          getBillingFormulas: vi.fn(() =>
            of([{ id: 'formula-1', title: 'Formula', description: 'Help' } as BillingFormula]),
          ),
          getProductCatalog: vi.fn(() => of({})),
          getAccountSubscription: vi.fn(() =>
            subscription ? of(subscription) : throwError(() => new Error('not found')),
          ),
          patchManualSubscription: vi.fn(() => of(undefined)),
          deleteManualSubscription: vi.fn(() => of(undefined)),
        }),
      ],
    }).compileComponents();

    globalService = TestBed.inject(GlobalAccountService);
    fixture = TestBed.createComponent(SubscriptionsComponent);
    fixture.detectChanges();
  }

  const getVm = () => fixture.debugElement.injector.get(SubscriptionsService);
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('should show both creation forms when the account has no subscription', async () => {
    await setup(null);
    const headings = Array.from(fixture.nativeElement.querySelectorAll('h3')).map(
      (h) => (h as HTMLElement).textContent,
    );
    expect(headings).toEqual(['Cloud Zero Subscription', 'Manual Subscription']);
  });

  it('should tell when another provider manages the subscription', async () => {
    await setup({ provider: 'STRIPE', subscription: {} });
    expect(text()).toContain('managed by another provider (STRIPE)');
  });

  it('should show the budget action only with a positive budget, defaulting to warn', async () => {
    await setup(null);
    const vm = getVm();

    vm.manualForm.controls.on_demand_budget.setValue(100);
    expect(vm.manualShowAction()).toBe(true);
    expect(vm.manualForm.controls.action_on_budget_exhausted.value).toBe('WARN_ACCOUNT_OWNER');

    vm.manualForm.controls.on_demand_budget.setValue(0);
    expect(vm.manualShowAction()).toBe(false);
    expect(vm.manualForm.controls.action_on_budget_exhausted.value).toBeNull();
  });

  it('should update a manual subscription with a clean payload', async () => {
    await setup({ provider: 'MANUAL', subscription: { nuclia_tokens_price: 5, billing_formula_id: 'f1' } });
    const vm = getVm();
    vm.manualForm.controls.free_tokens_per_billing_cycle.setValue(10);

    vm.updateManualSubscription();

    expect(globalService.patchManualSubscription).toHaveBeenCalledWith('account-id', {
      nuclia_tokens_price: 5,
      billing_formula_id: 'f1',
      free_tokens_per_billing_cycle: 10,
    });
    expect(toast.success).toHaveBeenCalledWith('Manual subscription updated successfully');
    expect(vm.manualForm.pristine).toBe(true);
  });

  it('should delete a subscription only after confirmation and reload', async () => {
    await setup({ provider: 'MANUAL', subscription: { nuclia_tokens_price: 5 } });
    const click = (label: string) =>
      Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find((button) => button.textContent?.trim() === label)
        ?.click();

    click('Delete');
    fixture.detectChanges();
    expect(globalService.deleteManualSubscription).not.toHaveBeenCalled();

    click('Confirm delete');
    expect(globalService.deleteManualSubscription).toHaveBeenCalledWith('account-id');
    expect(globalService.getAccountSubscription).toHaveBeenCalledTimes(2);
  });

  describe('utils', () => {
    it('should skip empty optional numbers in the payload', () => {
      expect(
        buildBasePayload({
          nuclia_tokens_price: null,
          billing_formula_id: '',
          free_tokens_per_billing_cycle: null,
          free_storage_nuclia_tokens: null,
          on_demand_budget: null,
          action_on_budget_exhausted: null,
        }),
      ).toEqual({ nuclia_tokens_price: 0 });
    });

    it('should resolve catalog options by selected business unit and product line', () => {
      const catalog = { bu: { name: 'BU', product_lines: { pl: { products: { p: { name: 'Product' } } } } } };
      expect(getProductLineOptions(catalog, '')).toEqual([]);
      expect(getProductLineOptions(catalog, 'bu')).toEqual([{ value: 'pl', label: 'pl' }]);
      expect(getProductOptions(catalog, 'bu', 'pl')).toEqual([{ value: 'p', label: 'Product' }]);
    });
  });
});
