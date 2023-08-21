import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';

import { DatasetSelectorComponent } from './dataset-selector.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { SDKService } from '@flaps/core';
import {
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaTextFieldModule,
  PaTranslateModule,
} from '@guillotinaweb/pastanaga-angular';
import { of } from 'rxjs';
import { SampleDatasetService } from '../sample-dataset.service';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { LoadingModalComponent } from '../loading-modal/loading-modal.component';

describe('DatasetSelectorComponent', () => {
  let component: DatasetSelectorComponent;
  let fixture: ComponentFixture<DatasetSelectorComponent>;

  const loadingModal: ModalRef = {
    close: jest.fn(),
  } as any as ModalRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaButtonModule), MockModule(PaTextFieldModule), MockModule(PaTranslateModule)],
      declarations: [DatasetSelectorComponent],
      providers: [
        MockProvider(SDKService),
        MockProvider(SampleDatasetService, {
          importDataset: jest.fn(() => of(null) as any),
          getDatasets: jest.fn(
            () => of([{ id: 'universe', title: 'Universe', description: 'A universe dataset' }]) as any,
          ),
        }),
        MockProvider(SisModalService, {
          openModal: jest.fn(() => loadingModal),
        }),
        MockProvider(SisToastService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DatasetSelectorComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  describe('Dataset selector', () => {
    let sampleService: SampleDatasetService;
    let modalService: SisModalService;

    beforeEach(() => {
      sampleService = TestBed.inject(SampleDatasetService);
      modalService = TestBed.inject(SisModalService);
      component.selectDataset = 'universe';
    });

    it('should open loading modal and call importDataset', () => {
      component.importDataset();
      expect(modalService.openModal).toHaveBeenCalledWith(
        LoadingModalComponent,
        new ModalConfig({
          dismissable: false,
          data: {
            title: 'dataset.importing_title',
            description: 'dataset.importing_description',
          },
        }),
      );
      expect(sampleService.importDataset).toHaveBeenCalledWith('universe');
    });

    it('should close loading modal on success', fakeAsync(() => {
      component.importDataset();
      expect(loadingModal.close).toHaveBeenCalled();
    }));
  });
});
