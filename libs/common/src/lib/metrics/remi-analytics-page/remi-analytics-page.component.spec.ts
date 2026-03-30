import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockModule, MockProvider } from 'ng-mocks';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SDKService, NavigationService } from '@flaps/core';
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
        MockProvider(SDKService, { currentKb: of(mockKb as any) }),
        MockProvider(TranslateService, { instant: (key: string) => key }),
        MockProvider(PreviewService, { viewerWidget: of('') }),
        MockProvider(NavigationService, { kbUrl: '' }),
      ],
    })
      .overrideComponent(RemiAnalyticsPageComponent, {
        set: {
          imports: [CommonModule, MockModule(TranslateModule)],
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
