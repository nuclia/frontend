import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { ZoneModels } from '../../regional-account.models';
import { RegionalAccountService } from '../../regional-account.service';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { ModelsComponent } from './models.component';

describe('ModelsComponent', () => {
  let fixture: ComponentFixture<ModelsComponent>;

  const zoneModels = [
    {
      zone: { id: 'z1', slug: 'europe-1', title: 'Europe' },
      models: [{ model_id: 'm1', title: 'My model', location: 'openai:gpt', model_types: ['generator'] }],
    },
  ] as unknown as ZoneModels[];

  async function setup(canManageModels: boolean) {
    await TestBed.configureTestingModule({
      imports: [ModelsComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(ManagerStore, {
          accountDetails: signal(ACCOUNT_DETAILS),
          accountModels: signal(zoneModels),
          canManageModels: signal(canManageModels),
        }),
        MockProvider(AccountService, { loadAccountModels: vi.fn(() => of([] as ZoneModels[])) }),
        MockProvider(RegionalAccountService),
        MockProvider(UiConfirmService),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ModelsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should list the models by zone and offer the add button', async () => {
    await setup(true);
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Europe');
    expect(element.textContent).toContain('My model');
    expect(element.querySelector('a[hlmBtn]')).toBeTruthy();
  });

  it('should hide the actions when the user cannot manage models', async () => {
    await setup(false);
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('My model');
    expect(element.querySelector('a[hlmBtn]')).toBeFalsy();
    expect(element.querySelector('button[aria-label="Menu"]')).toBeFalsy();
  });
});
