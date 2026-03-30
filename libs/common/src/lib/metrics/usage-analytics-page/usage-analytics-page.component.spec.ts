import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SDKService } from '@flaps/core';
import { UsageAnalyticsPageComponent } from './usage-analytics-page.component';
import { CompactNumberPipe } from '../../pipes/compact-number.pipe';

describe('UsageAnalyticsPageComponent', () => {
  let component: UsageAnalyticsPageComponent;
  let fixture: ComponentFixture<UsageAnalyticsPageComponent>;

  beforeEach(async () => {
    const mockKb = {
      activityMonitor: {
        queryRemiScores: jest.fn().mockReturnValue(of({ data: [], has_more: false })),
        getMonthsWithActivity: jest.fn().mockReturnValue(of({ downloads: [] })),
        getRemiScores: jest.fn().mockReturnValue(of([])),
      },
    };

    await TestBed.configureTestingModule({
      declarations: [UsageAnalyticsPageComponent, MockPipe(CompactNumberPipe)],
      imports: [MockModule(TranslateModule)],
      providers: [
        MockProvider(SDKService, { currentKb: of(mockKb as any) }),
        MockProvider(TranslateService, { instant: (key: string) => key }),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UsageAnalyticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
