import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SDKService } from '@flaps/core';
import { UiToastService } from '@nuclia/ui/toast';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ZoneSummary } from '../../../../manage-zones/zone.models';
import { ZoneService } from '../../../../manage-zones/zone.service';
import { ManagerStore } from '../../../../manager.store';
import { RegionalAccountService } from '../../../regional-account.service';
import { ACCOUNT_DETAILS } from '../../../test-utils';
import { AddModelComponent } from './add-model.component';
import { UserKeysComponent } from './user-keys/user-keys.component';

describe('AddModelComponent', () => {
  let fixture: ComponentFixture<AddModelComponent>;
  let component: AddModelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddModelComponent, RouterModule.forRoot([]), MockComponent(UserKeysComponent)],
      providers: [
        MockProvider(ManagerStore, {
          accountDetails: of(ACCOUNT_DETAILS),
          getAccountId: vi.fn(() => ACCOUNT_DETAILS.id),
        }),
        MockProvider(RegionalAccountService),
        MockProvider(SDKService, {
          nuclia: { db: { getLearningSchema: vi.fn(() => of({})) } },
        } as unknown as SDKService),
        MockProvider(ZoneService, {
          getZoneDict: vi.fn(() => of({ z1: { id: 'z1', slug: 'europe-1', title: 'Europe' } as ZoneSummary })),
        }),
        MockProvider(UiToastService),
        { provide: ActivatedRoute, useValue: { params: of({}) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AddModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should preselect the first zone and keep the form invalid until filled', () => {
    expect(component.zoneControl.value).toBe('europe-1');
    expect(component.invalid).toBe(true);
    component.modelForm.patchValue({ description: 'Name', location: 'openai:gpt', model_types: [] });
    expect(component.invalid).toBe(true);
  });
});
