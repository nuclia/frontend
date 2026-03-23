import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SDKService, UserService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { CostTokenUsagePageComponent } from './cost-token-usage-page.component';
import { CompactNumberPipe } from '../../pipes/compact-number.pipe';

describe('CostTokenUsagePageComponent', () => {
  let component: CostTokenUsagePageComponent;
  let fixture: ComponentFixture<CostTokenUsagePageComponent>;

  beforeEach(async () => {
    const mockKb = {
      activityMonitor: {
        queryActivityLogs: jest.fn().mockReturnValue(of([])),
        getMonthsWithActivity: jest.fn().mockReturnValue(of({ downloads: [] })),
      },
    };

    await TestBed.configureTestingModule({
      declarations: [CostTokenUsagePageComponent, MockPipe(CompactNumberPipe)],
      imports: [MockModule(TranslateModule)],
      providers: [
        MockProvider(SDKService, {
          currentKb: of(mockKb as any),
          currentAccount: of({ id: 'acc-1' } as any),
          nuclia: { db: { getUsage: jest.fn().mockReturnValue(of([])) } } as any,
        }),
        MockProvider(UserService),
        MockProvider(SisToastService),
        MockProvider(TranslateService, { instant: (key: string) => key }),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CostTokenUsagePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
