import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MockModule, MockProvider } from 'ng-mocks';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SDKService, UserService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { SearchActivityPageComponent } from './search-activity-page.component';

describe('SearchActivityPageComponent', () => {
  let component: SearchActivityPageComponent;
  let fixture: ComponentFixture<SearchActivityPageComponent>;

  beforeEach(async () => {
    const mockKb = {
      activityMonitor: {
        queryActivityLogs: jest.fn().mockReturnValue(of([])),
        getMonthsWithActivity: jest.fn().mockReturnValue(of({ downloads: [] })),
        getSearchMetrics: jest.fn().mockReturnValue(of([])),
      },
    };

    await TestBed.configureTestingModule({
      declarations: [SearchActivityPageComponent],
      imports: [MockModule(TranslateModule)],
      providers: [
        MockProvider(SDKService, { currentKb: of(mockKb as any) }),
        MockProvider(UserService),
        MockProvider(SisToastService),
        MockProvider(TranslateService, { instant: (key: string) => key }),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchActivityPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
