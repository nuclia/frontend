import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
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
export class DatasetImportComponent {
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
    private sdk: SDKService,
    private router: Router,
    private route: ActivatedRoute,
    private toaster: SisToastService,
    private modal: SisModalService,
    private datasetService: SampleDatasetService,
  ) {}

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

  onUpload() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
