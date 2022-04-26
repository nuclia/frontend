import { Component, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'stf-context-menu-item',
  template: '<button (click)="clickButton.emit()"><ng-content></ng-content></button>',
  styleUrls: ['./context-menu-item.component.scss']
})
export class ContextMenuItemComponent implements OnInit {
  @Output() clickButton: EventEmitter<void> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }
}
