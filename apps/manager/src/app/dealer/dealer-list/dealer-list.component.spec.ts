import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DealerListComponent } from './dealer-list.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { DealerService } from '../../services/dealer.service';
import { of } from 'rxjs';
import { MatSortModule } from '@angular/material/sort';
import { TranslateService } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

describe('DealerListComponent', () => {
  let component: DealerListComponent;
  let fixture: ComponentFixture<DealerListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DealerListComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [RouterTestingModule, MatSortModule, PaButtonModule, MatTableModule, NoopAnimationsModule],
      providers: [
        {
          provide: DealerService,
          useValue: {
            getDealers: () => of({}),
            deleteDealer: () => of({}),
          },
        },
        {
          provide: TranslateService,
          useValue: { get: () => of('') },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DealerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
