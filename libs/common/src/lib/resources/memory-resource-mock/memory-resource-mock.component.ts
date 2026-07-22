import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { filter } from 'rxjs';
import { MemoryMockTab } from './memory-resource-mock.config';
import { MemoryResourceMockService } from './memory-resource-mock.service';

@Component({
  selector: 'stf-memory-resource-mock',
  templateUrl: './memory-resource-mock.component.html',
  styleUrl: './memory-resource-mock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [MemoryResourceMockService],
})
export class MemoryResourceMockComponent {
  private modal = inject(SisModalService);
  private toaster = inject(SisToastService);

  protected service = inject(MemoryResourceMockService);

  protected setTab(tab: MemoryMockTab) {
    this.service.setTab(tab);
  }

  protected deleteMemoryResource() {
    this.modal
      .openConfirm({
        title: 'resource.memory-mock.delete.title',
        description: 'resource.memory-mock.delete.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(filter((confirm) => !!confirm))
      .subscribe(() => this.toaster.success('resource.memory-mock.delete.success'));
  }
}
