import { Component, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { Entities } from '@nuclia/core';
import { Entity } from '../model';
import { EntitiesService } from '../entities.service';
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
  selector: 'app-entity-dialog',
  templateUrl: './entity-dialog.component.html',
  styleUrls: ['./entity-dialog.component.scss'],
})
export class EntityDialogComponent implements OnDestroy {
  entityForm?: UntypedFormGroup;
  validationMessages = {
    name: {
      required: 'validation.required',
    },
  };
  mode?: EntityDialogMode;
  group?: string;
  groups$: Observable<Entities>;
  unsubscribeAll = new Subject<void>();

  constructor(
    public modal: ModalRef,
    private formBuilder: UntypedFormBuilder,
    private entitiesService: EntitiesService,
  ) {
    if (modal.config.data) {
      this.mode = modal.config.data['mode'];
      this.group = modal.config.data['group'];
      this.entityForm = this.formBuilder.group({
        name: [modal.config.data['entity']?.value || '', [Validators.required]],
        shortDescription: [''],
        description: [''],
      });
    }

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
    this.modal.close();
  }

  edit() {
    this.mode = 'edit';
  }

  save() {
    if (this.entityForm?.valid && this.group) {
      const response: EntityDialogResponse = {
        name: this.entityForm.value['name'],
        shortDescription: this.entityForm.value['shortDescription'],
        description: this.entityForm.value['description'],
        group: this.group,
      };
      this.modal.close(response);
    }
  }
}
