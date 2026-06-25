import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { KVSchema } from '@nuclia/core';

@Component({
  selector: 'app-schema-edit-modal',
  standalone: false,
  templateUrl: './schema-edit-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaEditModalComponent {
  modal = inject(ModalRef<{ schema: KVSchema }>);

  get schema(): KVSchema {
    const data = this.modal.config.data as { schema: KVSchema };
    return data.schema;
  }

  close() {
    this.modal.close();
  }
}
