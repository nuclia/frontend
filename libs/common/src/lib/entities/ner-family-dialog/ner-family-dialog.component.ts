import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  ConfirmationData,
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { NerService } from '../ner.service';
import { NerFamily } from '../model';
import { CommonModule } from '@angular/common';
import { CsvSelectComponent } from '../../upload';
import { TranslateModule } from '@ngx-translate/core';

const colorPattern = new RegExp(`^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$`);

const CONFIRM_CSV: ConfirmationData = {
  title: 'Select a CSV file?',
  description:
    'By selecting a CSV file you will lose the entities you already entered manually. Are you sure you want to continue?',
  isDestructive: true,
};

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaModalModule,
    PaTextFieldModule,
    CsvSelectComponent,
    PaButtonModule,
    TranslateModule,
  ],
  standalone: true,
  templateUrl: './ner-family-dialog.component.html',
  styleUrls: ['./ner-family-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NerFamilyDialogComponent implements OnInit, OnDestroy {
  entityForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    color: new FormControl('', { nonNullable: true, validators: [Validators.pattern(colorPattern)] }),
    entities: new FormControl('', { nonNullable: true }),
  });

  mode: 'create' | 'update' = 'create';
  isSaving = false;
  savingError = '';
  confirmCsv?: ConfirmationData;
  entityListChange: Subject<string | null> = new Subject();
  unsubscribeAll: Subject<void> = new Subject();

  get entitiesControl() {
    return this.entityForm.controls.entities;
  }

  private entitiesBackup?: string;
  private familyId?: string;

  constructor(
    public modal: ModalRef<NerFamily>,
    private entitiesService: NerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (this.modal.config.data) {
      this.entitiesService.refreshFamily(this.modal.config.data.key).subscribe((family) => {
        const entities = Object.keys(family.entities).join(',');
        this.entityForm.patchValue({
          title: family.title || '',
          color: family.color || '',
          entities,
        });
        this.entitiesBackup = entities;
        this.familyId = this.modal.config.data?.key;
        this.mode = 'update';
      });
    }

    this.entityListChange.pipe(debounceTime(300), takeUntil(this.unsubscribeAll)).subscribe((value) => {
      if (value) {
        this.confirmCsv = CONFIRM_CSV;
      } else {
        this.confirmCsv = undefined;
      }
      this.savingError = '';
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    const formValue = this.entityForm.getRawValue();
    if (this.entityForm.valid && !!formValue.title?.trim()) {
      this.isSaving = true;
      this.entityForm.disable();
      const request =
        this.mode === 'create'
          ? this.entitiesService.createFamily(formValue)
          : this.entitiesService.updateFamily(this.familyId || '', formValue, this.entitiesBackup);
      request.subscribe({
        complete: () => this.modal.close(),
        error: (error) => {
          this.isSaving = false;
          this.entityForm.enable();
          this.savingError = error;
        },
      });
    }
  }

  onChangingEntitiesManually(value: string | null) {
    this.entityListChange.next(value);
  }

  uploadCsv(data: string[][]) {
    this.savingError = '';
    this.entitiesControl.patchValue(data.join(','));
  }
}
