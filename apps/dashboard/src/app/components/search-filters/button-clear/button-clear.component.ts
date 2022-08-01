import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-button-clear',
  template: `
    <button class="button-clear">
      <svg-icon src="assets/icons/clear.svg"></svg-icon>
      <ng-content></ng-content>
    </button>
  `,
  styleUrls: ['./button-clear.component.scss'],
})
export class ButtonClearComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
