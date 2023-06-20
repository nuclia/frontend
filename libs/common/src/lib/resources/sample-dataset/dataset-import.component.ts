import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { SDKService } from '@flaps/core';

@Component({
  templateUrl: './dataset-import.component.html',
  styleUrls: ['./dataset-import.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetImportComponent {
  @ViewChild('uploadLinksContainer') uploadLinksContainer?: ElementRef;

  isMonoLingual = this.sdk.currentKb.pipe(
    switchMap((kb) => kb.getConfiguration()),
    map((config) => config['semantic_model'] === 'en'),
  );

  constructor(private router: Router, private route: ActivatedRoute, private sdk: SDKService) {}

  onDatasetImported(success: boolean) {
    if (success) {
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }

  onUpload() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
