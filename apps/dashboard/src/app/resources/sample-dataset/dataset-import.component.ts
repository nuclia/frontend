import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { UploadService, UploadType } from '../upload.service';
import { OptionModel } from '@guillotinaweb/pastanaga-angular';
import { SDKService } from '@flaps/core';
import { switchMap, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-dataset-import',
  templateUrl: './dataset-import.component.html',
  styleUrls: ['./dataset-import.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetImportComponent implements AfterViewInit {
  @ViewChild('uploadLinksContainer') uploadLinksContainer?: ElementRef;

  sampleDatasets: OptionModel[] = [
    new OptionModel({
      id: 'nuclia-universe',
      value: 'nuclia-universe',
      label: 'Nuclia Universe',
    }),
    new OptionModel({
      id: 'nuclia-recipes',
      value: 'nuclia-recipes',
      label: 'Nuclia Recipes',
    }),
  ];

  selectDataset = '';

  constructor(
    private uploadService: UploadService,
    private sdk: SDKService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngAfterViewInit() {
    if (this.uploadLinksContainer) {
      const uploadLinks = this.uploadLinksContainer.nativeElement.querySelectorAll('a');
      uploadLinks.forEach((link: HTMLLinkElement) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();

          const uploadType = link.href.split('#')[1];
          if (['files', 'folder', 'link', 'csv'].includes(uploadType)) {
            this.uploadService
              .upload(uploadType as UploadType)
              .afterClosed()
              .subscribe(() => this.router.navigate(['..'], { relativeTo: this.route }));
          } else {
            console.error(`Unknown upload type ${uploadType}, check "onboarding.dataset.upload-links" translation`);
          }
        });
      });
    }
  }

  importDataset() {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.importDataset(this.selectDataset)),
      )
      .subscribe((result) => {
        console.log(result);
        this.router.navigate(['..'], { relativeTo: this.route });
      });
  }
}
