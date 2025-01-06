import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-getting-started-intro',
  imports: [CommonModule, TranslateModule],
  templateUrl: './intro.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntroComponent {}
