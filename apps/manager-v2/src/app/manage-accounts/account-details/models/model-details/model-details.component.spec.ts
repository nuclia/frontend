import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/core';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../../manager.store';
import { KbSummary } from '../../../account-ui.models';
import { ACCOUNT_DETAILS } from '../../../test-utils';
import { ModelDetailsComponent } from './model-details.component';

describe('ModelDetailsComponent', () => {
  let fixture: ComponentFixture<ModelDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelDetailsComponent],
      providers: [
        MockProvider(ManagerStore, {
          accountDetails: of(ACCOUNT_DETAILS),
          kbList: of([
            { id: 'kb1', title: 'First KB', zone: { slug: 'europe-1' } },
            { id: 'kb2', title: 'Other zone KB', zone: { slug: 'aws-us' } },
          ] as unknown as KbSummary[]),
        }),
        MockProvider(SDKService, {
          nuclia: { db: { getModel: vi.fn(() => of({ location: 'openai:gpt', kbids: ['kb1'] })) } },
        } as unknown as SDKService),
        MockProvider(UiToastService),
        { provide: ActivatedRoute, useValue: { params: of({ modelId: 'm1', zoneSlug: 'europe-1' }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ModelDetailsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should list only the knowledge boxes of the model zone, with the assigned ones checked', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('First KB');
    expect(element.textContent).not.toContain('Other zone KB');
    expect(fixture.componentInstance.kbForm.controls['kb1'].value).toBe(true);
  });
});
