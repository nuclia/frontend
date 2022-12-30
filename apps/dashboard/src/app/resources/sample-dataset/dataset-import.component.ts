import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { UploadService, UploadType } from '../upload.service';
import { ModalConfig, OptionModel } from '@guillotinaweb/pastanaga-angular';
import { SDKService } from '@flaps/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { LoadingModalComponent } from './loading-modal/loading-modal.component';
import { SampleDatasetService } from './sample-dataset.service';

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
  importing = false;

  constructor(
    private uploadService: UploadService,
    private sdk: SDKService,
    private router: Router,
    private route: ActivatedRoute,
    private toaster: SisToastService,
    private modal: SisModalService,
    private datasetService: SampleDatasetService,
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
              .subscribe((data) => {
                if (!data || !data.cancel) {
                  this.router.navigate(['..'], { relativeTo: this.route });
                }
              });
          } else {
            console.error(`Unknown upload type ${uploadType}, check "onboarding.dataset.upload-links" translation`);
          }
        });
      });
    }
  }

  importDataset() {
    this.importing = true;
    const loadingModal = this.modal.openModal(
      LoadingModalComponent,
      new ModalConfig({
        dismissable: false,
        data: {
          title: 'onboarding.dataset.importing_title',
          description: 'onboarding.dataset.importing_description',
        },
      }),
    );

    this.datasetService.importDataset(this.selectDataset).subscribe({
      next: () => {
        this.router.navigate(['..'], { relativeTo: this.route });
        loadingModal.close();
      },
      error: () => {
        this.toaster.error('onboarding.dataset.import_failed');
        this.importing = false;
        loadingModal.close();
      },
    });
  }
}
