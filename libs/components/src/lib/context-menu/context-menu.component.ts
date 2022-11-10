import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

@Component({
  selector: 'stf-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss'],
})
export class ContextMenuComponent implements OnInit {
  @Input() minWidth: number | undefined;
  @ViewChild('menu') matMenu: MatMenu | undefined;

  constructor() {}

  ngOnInit(): void {}
}
