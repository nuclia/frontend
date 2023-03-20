import { Component, Inject, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Entities } from '@nuclia/core';
import { Entity } from '../model';
import { EntitiesService } from '../entities.service';

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
  selector: 'app-entity-dialog',
  templateUrl: './entity-dialog.component.html',
  styleUrls: ['./entity-dialog.component.scss'],
})
export class EntityDialogComponent implements OnDestroy {
  entityForm: UntypedFormGroup;
  validationMessages = {
    name: {
      required: 'validation.required',
    },
  };
  mode: EntityDialogMode;
  group: string;
  groups$: Observable<Entities>;
  unsubscribeAll = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<EntityDialogComponent>,
    private formBuilder: UntypedFormBuilder,
    private entitiesService: EntitiesService,
    @Inject(MAT_DIALOG_DATA) public data: EntityDialogData,
  ) {
    this.mode = data.mode;
    this.group = data.group;
    this.entityForm = this.formBuilder.group({
      name: [data.entity?.value || '', [Validators.required]],
      shortDescription: [''],
      description: [''],
    });

    this.groups$ = this.entitiesService.getEntities().pipe(
      map((entities) => entities || {}),
      takeUntil(this.unsubscribeAll),
    );
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  close() {
    this.dialogRef.close();
  }

  edit() {
    this.mode = 'edit';
  }

  save() {
    if (this.entityForm.valid) {
      const response: EntityDialogResponse = {
        name: this.entityForm.value['name'],
        shortDescription: this.entityForm.value['shortDescription'],
        description: this.entityForm.value['description'],
        group: this.group,
      };
      this.dialogRef.close(response);
    }
  }
}
