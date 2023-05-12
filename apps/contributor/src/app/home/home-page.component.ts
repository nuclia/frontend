import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StandaloneService } from '@flaps/common';

@Component({
  selector: 'nco-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  hasValidKey = this.standaloneService.hasValidKey;

  constructor(private standaloneService: StandaloneService) {}
}
