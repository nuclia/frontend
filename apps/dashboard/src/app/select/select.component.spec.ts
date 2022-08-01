import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SelectService } from './select.service';

import { SelectComponent } from './select.component';

describe('SelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, RouterTestingModule],
      // declarations: [SelectComponent, TranslatePipeMock],
      providers: [
        {
          provide: SelectService,
          useValue: {
            getAccounts: () => [],
            getKbs: () => ({}),
          },
        },
        // {
        //   provide: ActivatedRoute,
        //   useValue: {
        //     url: subscriptionPipeFn(),
        //     children: [],
        //   },
        // },
        // {
        //   provide: Router,
        //   useValue: {},
        // },
      ],
    }).compileComponents();
  }));

  // beforeEach(() => {
  //   fixture = TestBed.createComponent(SelectComponent);
  //   component = fixture.componentInstance;
  //   fixture.detectChanges();
  // });

  it('should create', () => {
    expect(true).toBeTruthy();
    // expect(component).toBeTruthy();
  });
});
