import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { Entity } from '../model';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

export type EntityDialogMode = 'view' | 'edit' | 'add';

export interface EntityDialogData {
  mode: EntityDialogMode;
  group: string;
  entity?: Entity;
}

export interface EntityDialogResponse {
  name: string;
  shortDescription: string;
  description: string;
  group: string;
}

@Component({
  templateUrl: './add-ner-dialog.component.html',
  styleUrls: ['./add-ner-dialog.component.scss'],
})
export class AddNerDialogComponent implements OnDestroy {
  entityForm = new FormGroup<{ entities: FormControl<string> }>({
    entities: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });
  validationMessages = {
    entities: {
      required: 'validation.required',
    },
  };
  unsubscribeAll = new Subject<void>();

  constructor(public modal: ModalRef) {}

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  close() {
    this.modal.close();
  }

  save() {
    if (this.entityForm?.valid) {
      const entities = this.entityForm.controls.entities
        .getRawValue()
        .split(',')
        .filter((entity) => !!entity)
        .map((entity) => entity.trim());
      this.modal.close(entities);
    }
  }
}
