import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { PreviewService } from '../../resources';
import { RemiAnalyticsPageComponent } from './remi-analytics-page.component';

describe('RemiAnalyticsPageComponent', () => {
  let component: RemiAnalyticsPageComponent;
  let fixture: ComponentFixture<RemiAnalyticsPageComponent>;

  beforeEach(async () => {
    const mockKb = {
      activityMonitor: {
        getRemiScores: jest.fn().mockReturnValue(of([])),
        queryRemiScores: jest.fn().mockReturnValue(of({ data: [], has_more: false })),
      },
    };

    await TestBed.configureTestingModule({
      imports: [RemiAnalyticsPageComponent],
      providers: [
        MockProvider(SDKService, {
          currentKb: of(mockKb as any),
          currentAccount: of({ creation_date: '2025-01-01' } as any),
        }),
        MockProvider(FeaturesService, { unstable: { automaticAdvice: of(false) } }),
        MockProvider(TranslateService, {
          instant: (key: string) => key,
          translate: (key) => signal(typeof key === 'function' ? key().toString() : key.toString()),
        }),
        MockProvider(PreviewService, { viewerWidget: of('') }),
        MockProvider(NavigationService, { kbUrl: '' }),
        MockProvider(Router, { navigate: jest.fn() }),
        MockProvider(ActivatedRoute, {}),
      ],
    })
      .overrideComponent(RemiAnalyticsPageComponent, {
        set: {
          imports: [CommonModule, TranslatePipe],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RemiAnalyticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
