import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';

import { KnowledgeBoxComponent } from './knowledge-box.component';
import { MockProvider } from 'ng-mocks';
import { UploadService } from '@flaps/common';
import { SisModalService } from '@nuclia/sistema';
import { SDKService } from '@flaps/core';
import { RouterTestingModule } from '@angular/router/testing';

describe('KnowledgeBoxComponent', () => {
  let component: KnowledgeBoxComponent;
  let fixture: ComponentFixture<KnowledgeBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [KnowledgeBoxComponent],
      providers: [
        MockProvider(SDKService, { counters: of({ resources: 0 }) } as SDKService),
        MockProvider(UploadService, {
          progress: new BehaviorSubject({ completed: true }).asObservable(),
          barDisabled: new BehaviorSubject(false).asObservable(),
        } as UploadService),
        MockProvider(SisModalService),
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
