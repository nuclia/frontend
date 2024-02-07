import { ChangeDetectionStrategy, Component } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { UploadModule, UploadService } from '@flaps/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nad-main-container',
  templateUrl: './main-container.component.html',
  styleUrls: ['./main-container.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, UploadModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainContainerComponent {
  showBar = combineLatest([this.uploadService.progress, this.uploadService.barDisabled]).pipe(
    map(([progress, disabled]) => !progress.completed && !disabled),
  );

  constructor(private uploadService: UploadService) {}
}
