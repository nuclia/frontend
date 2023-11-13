import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StandaloneService } from '@flaps/common';

@Component({
  selector: 'nad-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  hasValidKey = this.standaloneService.hasValidKey;
  errorMessage = this.standaloneService.errorMessage;

  constructor(private standaloneService: StandaloneService) {}
}
