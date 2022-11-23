import { Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-widget-hint',
  templateUrl: './widget-hint.component.html',
  styleUrls: ['./widget-hint.component.scss'],
})
export class WidgetHintDialogComponent {
  constructor(public modal: ModalRef) {}
}
