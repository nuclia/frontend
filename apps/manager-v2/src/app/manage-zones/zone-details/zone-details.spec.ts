import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UserService } from '../../manage-users/user.service';
import { Zone } from '../zone.models';
import { ZoneService } from '../zone.service';
import { ZoneDetailsComponent } from './zone-details.component';
import { ZoneDetailsService } from './zone-details.service';

const ZONE = {
  id: 'zone-1',
  slug: 'europe-1',
  title: 'Europe',
  cloud_provider: 'GCP',
  private: false,
  origin: null,
} as unknown as Zone;

describe('ZoneDetails', () => {
  let fixture: ComponentFixture<ZoneDetailsComponent>;
  let zoneService: ZoneService;

  async function setup(zoneId: string) {
    await TestBed.configureTestingModule({
      imports: [ZoneDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({ zoneId }) } },
        MockProvider(Router),
        MockProvider(ZoneService, {
          getZone: vi.fn(() => of(ZONE)),
          updateZone: vi.fn(() => of(undefined)),
          getZoneAccounts: vi.fn(() => of([{ account_id: 'acc-1', zone_id: 'zone-1' }])),
          grantZoneToAccount: vi.fn(() => of(undefined)),
          revokeZoneFromAccount: vi.fn(() => of(undefined)),
        }),
        MockProvider(UserService),
        MockProvider(UiToastService),
      ],
    }).compileComponents();

    zoneService = TestBed.inject(ZoneService);
    fixture = TestBed.createComponent(ZoneDetailsComponent);
    fixture.detectChanges();
  }

  const getVm = () => fixture.debugElement.injector.get(ZoneDetailsService);
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('should load an existing zone with its granted accounts', async () => {
    await setup('zone-1');
    expect(getVm().zoneForm.getRawValue()).toEqual(expect.objectContaining({ slug: 'europe-1', title: 'Europe' }));
    expect(zoneService.getZoneAccounts).toHaveBeenCalledWith('zone-1');
    expect(text()).toContain('acc-1');
  });

  it('should update the zone and keep it as the new reset point', async () => {
    await setup('zone-1');
    const vm = getVm();
    vm.zoneForm.controls.title.setValue('Changed');
    vm.save();
    expect(zoneService.updateZone).toHaveBeenCalledWith(
      'zone-1',
      expect.objectContaining({ title: 'Changed', origin: null }),
    );
    expect(vm.zoneForm.pristine).toBe(true);
  });

  it('should grant and revoke account access', async () => {
    await setup('zone-1');
    const input = fixture.nativeElement.querySelector('#zone-account-id') as HTMLInputElement;
    input.value = ' acc-2 ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Grant access'))?.click();
    expect(zoneService.grantZoneToAccount).toHaveBeenCalledWith('zone-1', 'acc-2');

    (fixture.nativeElement.querySelector('[aria-label="Revoke access"]') as HTMLButtonElement).click();
    expect(zoneService.revokeZoneFromAccount).toHaveBeenCalledWith('zone-1', 'acc-1');
  });

  it('should show the add form without the whitelist for a new zone', async () => {
    await setup('add');
    expect(getVm().addZone()).toBe(true);
    expect(text()).toContain('Add zone');
    expect(text()).not.toContain('Account whitelist');
    expect(zoneService.getZone).not.toHaveBeenCalled();
  });
});
