import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NerFamilyDialogComponent } from './ner-family-dialog.component';
import { MockModule, MockProvider } from 'ng-mocks';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTranslateModule,
} from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { EntitiesService } from '../entities.service';
import { UploadModule } from '@flaps/common';

describe('EntityGroupDialogComponent', () => {
  let component: NerFamilyDialogComponent;
  let fixture: ComponentFixture<NerFamilyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaTranslateModule),
        MockModule(PaModalModule),
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
        MockModule(ReactiveFormsModule),
        MockModule(UploadModule),
      ],
      declarations: [NerFamilyDialogComponent],
      providers: [
        {
          provide: ModalRef,
          useValue: new ModalRef({ id: 1 }),
        },
        MockProvider(EntitiesService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NerFamilyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
