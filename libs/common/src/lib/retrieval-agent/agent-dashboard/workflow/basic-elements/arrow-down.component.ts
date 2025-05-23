import { Component } from '@angular/core';

@Component({
  selector: 'app-arrow-down',
  template: `
    <svg
      width="10"
      height="13"
      viewBox="0 0 10 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.75 1C5.75 0.585786 5.41421 0.25 5 0.25C4.58579 0.25 4.25 0.585786 4.25 1H5.75ZM5 13L9.33013 5.5H0.669873L5 13ZM4.25 1V6.25H5.75V1H4.25Z"
        fill="#707070" />
    </svg>
  `,
  styles: `:host {align-self: center}`,
})
export class ArrowDownComponent {}
