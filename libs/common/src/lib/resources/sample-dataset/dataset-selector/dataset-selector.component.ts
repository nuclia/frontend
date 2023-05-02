import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ModalConfig, OptionModel } from '@guillotinaweb/pastanaga-angular';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { LoadingModalComponent } from '../loading-modal/loading-modal.component';
import { SampleDatasetService } from '../sample-dataset.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'stf-dataset-selector',
  templateUrl: './dataset-selector.component.html',
  styleUrls: ['./dataset-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetSelectorComponent {
  @Output() imported = new EventEmitter<boolean>();
  sampleDatasets: Observable<OptionModel[]> = this.datasetService.getDatasets().pipe(
    map((res) =>
      res.map(
        (dataset) =>
          new OptionModel({
            id: dataset.id,
            value: dataset.id,
            label: dataset.title,
          }),
      ),
    ),
  );

  selectDataset = '';
  importing = false;

  constructor(
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
        loadingModal.close();
        this.imported.emit(true);
      },
      error: (err) => {
        this.toaster.error('onboarding.dataset.import_failed');
        this.importing = false;
        loadingModal.close();
        this.imported.emit(false);
      },
    });
  }
}
