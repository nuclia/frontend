import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityGroupDialogComponent } from './entity-group-dialog.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { SDKService } from '@flaps/core';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTranslateModule,
} from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';

describe('EntityGroupDialogComponent', () => {
  let component: EntityGroupDialogComponent;
  let fixture: ComponentFixture<EntityGroupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaTranslateModule),
        MockModule(PaModalModule),
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
        MockModule(ReactiveFormsModule),
      ],
      declarations: [EntityGroupDialogComponent],
      providers: [
        {
          provide: ModalRef,
          useValue: new ModalRef({ id: 1 }),
        },
        MockProvider(SDKService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
