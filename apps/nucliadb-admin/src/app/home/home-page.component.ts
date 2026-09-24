import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { StandaloneService } from '@flaps/common';
import { HomeContainerComponent } from '../../../../../libs/sistema/src/lib/home-container/home-container.component';
import { PaIconModule } from '../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/icon/icon.module';
import { AsyncPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { PaTranslateModule } from '../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/translate/translate.module';

@Component({
    selector: 'nad-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        HomeContainerComponent,
        PaIconModule,
        AsyncPipe,
        TranslatePipe,
        PaTranslateModule,
    ],
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
