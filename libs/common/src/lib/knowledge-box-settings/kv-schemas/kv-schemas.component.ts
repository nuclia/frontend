import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { filter, switchMap } from 'rxjs/operators';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { SisModalService } from '@nuclia/sistema';
import { KVSchema } from '@nuclia/core';
import { KvSchemasService } from './kv-schemas.service';
import { SchemaEditModalComponent } from './schema-edit-modal/schema-edit-modal.component';
import { TranslateService } from '@ngx-translate/core';
import { KV_SCHEMA_LIST_CONFIG } from './kv-schemas.config';

@Component({
  selector: 'app-kv-schemas',
  standalone: false,
  templateUrl: './kv-schemas.component.html',
  styleUrl: './kv-schemas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KvSchemasComponent {
  private kvService = inject(KvSchemasService);
  private modalService = inject(SisModalService);
  private translate = inject(TranslateService);

  schemas$ = this.kvService.schemas$;
  showCreateForm = signal(false);
  readonly config = KV_SCHEMA_LIST_CONFIG;

  showCreate() {
    this.showCreateForm.set(true);
  }

  hideCreate() {
    this.showCreateForm.set(false);
  }

  editSchema(schema: KVSchema) {
    this.modalService.openModal(SchemaEditModalComponent, new ModalConfig({ data: { schema } }));
  }

  deleteSchema(schema: KVSchema) {
    this.modalService
      .openConfirm({
        title: 'kb.kv-schemas.delete-confirm.title',
        description: this.translate.instant('kb.kv-schemas.delete-confirm.description', { name: schema.id }),
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.kvService.deleteSchema(schema.id)),
      )
      .subscribe();
  }
}
