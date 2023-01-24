import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-dataset-import',
  templateUrl: './dataset-import.component.html',
  styleUrls: ['./dataset-import.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetImportComponent {
  @ViewChild('uploadLinksContainer') uploadLinksContainer?: ElementRef;

  constructor(private router: Router, private route: ActivatedRoute) {}

  onDatasetImported(success: boolean) {
    if (success) {
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }

  onUpload() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
