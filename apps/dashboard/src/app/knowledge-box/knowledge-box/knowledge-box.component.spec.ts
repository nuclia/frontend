import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { KnowledgeBoxComponent } from './knowledge-box.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MockModule } from 'ng-mocks';
import { AppService, UploadService } from '@flaps/common';
import { PaModalModule } from '@guillotinaweb/pastanaga-angular';

describe('KnowledgeBoxComponent', () => {
  let component: KnowledgeBoxComponent;
  let fixture: ComponentFixture<KnowledgeBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaModalModule), RouterTestingModule],
      declarations: [KnowledgeBoxComponent],
      providers: [
        {
          provide: UploadService,
          useValue: {
            progress: new BehaviorSubject({ completed: true }).asObservable(),
            barDisabled: new BehaviorSubject(false).asObservable(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
          },
        },
        {
          provide: AppService,
          useValue: {
            isKbStillEmptyAfterFirstDay: () => of(false),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
