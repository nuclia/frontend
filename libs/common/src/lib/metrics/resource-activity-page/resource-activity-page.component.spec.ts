import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SDKService, UserService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { SisToastService } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { CompactNumberPipe } from '../../pipes/compact-number.pipe';
import { ResourceActivityPageComponent } from './resource-activity-page.component';

describe('ResourceActivityPageComponent', () => {
  let component: ResourceActivityPageComponent;
  let fixture: ComponentFixture<ResourceActivityPageComponent>;

  beforeEach(async () => {
    const mockKb = {
      activityMonitor: {
        queryActivityLogs: jest.fn().mockReturnValue(of([])),
        getMonthsWithActivity: jest.fn().mockReturnValue(of({ downloads: [] })),
      },
    };

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), ResourceActivityPageComponent, MockPipe(CompactNumberPipe)],
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

    fixture = TestBed.createComponent(ResourceActivityPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
