import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'sdk-demo-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  anonymous = !!localStorage.getItem('anonymous');
  query = '';

  constructor() {}

  toggleMode() {
    this.anonymous = !this.anonymous;
    if (!this.anonymous) {
      localStorage.removeItem('anonymous');
    } else {
      localStorage.setItem('anonymous', 'true');
    }
  }
}
