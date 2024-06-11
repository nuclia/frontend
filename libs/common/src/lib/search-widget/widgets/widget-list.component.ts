import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { CreateWidgetDialogComponent } from './create-widget-dialog/create-widget-dialog.component';
import { filter } from 'rxjs';

@Component({
  selector: 'stf-widget-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, PaButtonModule, InfoCardComponent],
  templateUrl: './widget-list.component.html',
  styleUrl: './widget-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetListComponent {
  private modalService = inject(SisModalService);

  createWidget() {
    this.modalService
      .openModal(CreateWidgetDialogComponent)
      .onClose.pipe(filter((confirmed) => !!confirmed))
      .subscribe((widgetName) => console.log(widgetName));
  }
}
