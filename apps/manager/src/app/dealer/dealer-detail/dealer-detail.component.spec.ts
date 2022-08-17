import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { DealerService } from '../../services/dealer.service';

import { DealerDetailComponent } from './dealer-detail.component';
import { MatCardModule } from '@angular/material/card';
import { STFButtonsModule } from '@flaps/pastanaga';
import { MockModule } from 'ng-mocks';

describe('DealerDetailComponent', () => {
  let component: DealerDetailComponent;
  let fixture: ComponentFixture<DealerDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DealerDetailComponent],
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
        MatInputModule,
        MatSelectModule,
        NoopAnimationsModule,
        MatCardModule,
        MockModule(STFButtonsModule),
      ],
      providers: [
        {
          provide: DealerService,
          useValue: {
            addUser: () => of({}),
            deleteuser: () => of({}),
            create: () => of({}),
            edit: () => of({}),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DealerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
