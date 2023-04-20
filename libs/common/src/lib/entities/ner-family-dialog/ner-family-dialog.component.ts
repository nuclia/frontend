import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationData, ModalRef } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { EntitiesService } from '../entities.service';
import { NerFamily } from '../model';

const colorPattern = new RegExp(`^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$`);

const CONFIRM_CSV: ConfirmationData = {
  title: 'Select a CSV file?',
  description:
    'By selecting a CSV file you will lose the entities you already entered manually. Are you sure you want to continue?',
  isDestructive: true,
};

@Component({
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
    private entitiesService: EntitiesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (this.modal.config.data) {
      const entities = Object.keys(this.modal.config.data.entities).join(',');
      this.entityForm.patchValue({
        title: this.modal.config.data.title,
        color: this.modal.config.data.color,
        entities,
      });
      this.entitiesBackup = entities;
      this.familyId = this.modal.config.data.key;
      this.mode = 'update';
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
