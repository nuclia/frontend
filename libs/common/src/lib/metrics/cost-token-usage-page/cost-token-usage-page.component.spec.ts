import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SDKService, UserService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { SisToastService } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { CompactNumberPipe } from '../../pipes/compact-number.pipe';
import { CostTokenUsagePageComponent } from './cost-token-usage-page.component';

describe('CostTokenUsagePageComponent', () => {
  let component: CostTokenUsagePageComponent;
  let fixture: ComponentFixture<CostTokenUsagePageComponent>;

  beforeEach(async () => {
    const mockKb = {
      activityMonitor: {
        queryActivityLogs: jest.fn().mockReturnValue(of([])),
      },
    };

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), CostTokenUsagePageComponent, MockPipe(CompactNumberPipe)],
      providers: [
        MockProvider(SDKService, {
          currentKb: of(mockKb as any),
          currentAccount: of({ id: 'acc-1' } as any),
          nuclia: { db: { getUsage: jest.fn().mockReturnValue(of([])) } } as any,
        }),
        MockProvider(UserService),
        MockProvider(SisToastService),
        {
          provide: SvgIconRegistryService,
          useValue: {
            loadSvg: () => {
              /* empty */
            },
          },
        },
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
