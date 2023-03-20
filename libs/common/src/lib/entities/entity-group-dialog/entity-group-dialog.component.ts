import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EntitiesGroup, Entity } from '@nuclia/core';
import { SDKService, STFUtils } from '@flaps/core';
import { switchMap, take } from 'rxjs';

const colorPattern = new RegExp(`^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$`);

@Component({
  selector: 'app-entity-group-dialog',
  templateUrl: './entity-group-dialog.component.html',
  styleUrls: ['./entity-group-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityGroupDialogComponent {
  entityForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    color: new FormControl('', [Validators.pattern(colorPattern)]),
    entities: new FormControl(''),
  });

  isSaving = false;
  savingError = '';

  constructor(public modal: ModalRef, private sdk: SDKService) {}

  save() {
    const formValue = this.entityForm.getRawValue();
    if (this.entityForm.valid && !!formValue.title?.trim()) {
      this.isSaving = true;
      const groupId = STFUtils.generateSlug(formValue.title);
      const group: EntitiesGroup = {
        title: formValue.title,
        color: formValue.color || '',
        entities: (formValue.entities || '').split(',').reduce((map, currentValue) => {
          const entityId = currentValue;
          map[entityId] = { value: currentValue };
          return map;
        }, {} as { [key: string]: Entity }),
        custom: true,
      };
      this.sdk.currentKb
        .pipe(
          take(1),
          switchMap((kb) => kb.setEntitiesGroup(groupId, group)),
        )
        .subscribe({
          complete: () => this.modal.close(),
          error: (error) => {
            this.isSaving = false;
            this.savingError = error;
          },
        });
    }
  }
}
