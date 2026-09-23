import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalRef, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { KVSchema } from '@nuclia/core';
import { SchemaFormComponent } from '../schema-form/schema-form.component';

@Component({
  selector: 'app-schema-edit-modal',
  templateUrl: './schema-edit-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaModalModule, SchemaFormComponent, TranslatePipe, TranslateModule],
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
