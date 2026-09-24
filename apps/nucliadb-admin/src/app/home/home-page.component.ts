import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { StandaloneService } from '@flaps/common';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { HomeContainerComponent } from '@nuclia/sistema';

@Component({
  selector: 'nad-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HomeContainerComponent, PaIconModule, AsyncPipe, TranslatePipe],
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
