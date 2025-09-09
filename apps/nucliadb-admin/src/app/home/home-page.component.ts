import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StandaloneService } from '@flaps/common';

@Component({
  selector: 'nad-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class HomePageComponent implements OnInit {
  hasValidKey = this.standaloneService.hasValidKey;
  errorMessage = this.standaloneService.errorMessage;
  version = this.standaloneService.version;

  constructor(private standaloneService: StandaloneService) {}

  ngOnInit() {
    this.standaloneService.checkVersions();
  }
}
