import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SDKService, UserService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { SisToastService } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ChatActivityPageComponent } from './chat-activity-page.component';

describe('ChatActivityPageComponent', () => {
  let component: ChatActivityPageComponent;
  let fixture: ComponentFixture<ChatActivityPageComponent>;

  beforeEach(async () => {
    const mockKb = {
      activityMonitor: {
        queryActivityLogs: jest.fn().mockReturnValue(of([])),
        getMonthsWithActivity: jest.fn().mockReturnValue(of({ downloads: [] })),
      },
    };
    const mockAccount = {
      creation_date: '2026-02-20T09:00:00.000000',
    };

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), ChatActivityPageComponent],
      providers: [
        MockProvider(SDKService, { currentKb: of(mockKb as any), currentAccount: of(mockAccount as any) }),
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

    fixture = TestBed.createComponent(ChatActivityPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
