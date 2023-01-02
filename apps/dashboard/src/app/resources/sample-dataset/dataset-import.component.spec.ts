import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';

import { DatasetImportComponent } from './dataset-import.component';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { SDKService } from '@flaps/core';
import {
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaTextFieldModule,
  PaTranslateModule,
} from '@guillotinaweb/pastanaga-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { SampleDatasetService } from './sample-dataset.service';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { LoadingModalComponent } from './loading-modal/loading-modal.component';
import { UploadButtonComponent } from '../upload-button/upload-button.component';

describe('DatasetImportComponent', () => {
  let component: DatasetImportComponent;
  let fixture: ComponentFixture<DatasetImportComponent>;

  const loadingModal: ModalRef = {
    close: jest.fn(),
  } as any as ModalRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaButtonModule), MockModule(PaTextFieldModule), MockModule(PaTranslateModule)],
      declarations: [DatasetImportComponent, MockComponent(UploadButtonComponent)],
      providers: [
        MockProvider(SDKService),
        MockProvider(ActivatedRoute),
        MockProvider(SampleDatasetService, {
          importDataset: jest.fn(() => of(null) as any),
        }),
        MockProvider(SisModalService, {
          openModal: jest.fn(() => loadingModal),
        }),
        MockProvider(SisToastService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DatasetImportComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  describe('importDataset', () => {
    let sampleService: SampleDatasetService;
    let modalService: SisModalService;
    let router: Router;

    beforeEach(() => {
      sampleService = TestBed.inject(SampleDatasetService);
      modalService = TestBed.inject(SisModalService);
      router = TestBed.inject(Router);
      router.navigate = jest.fn();

      component.selectDataset = 'universe';
    });

    it('should open loading modal and call importDataset', () => {
      component.importDataset();
      expect(modalService.openModal).toHaveBeenCalledWith(
        LoadingModalComponent,
        new ModalConfig({
          dismissable: false,
          data: {
            title: 'onboarding.dataset.importing_title',
            description: 'onboarding.dataset.importing_description',
          },
        }),
      );
      expect(sampleService.importDataset).toHaveBeenCalledWith('universe');
    });

    it('should navigate to resource list and close loading modal on success', fakeAsync(() => {
      const route = TestBed.inject(ActivatedRoute);
      component.importDataset();
      expect(router.navigate).toHaveBeenCalledWith(['..'], { relativeTo: route });
      expect(loadingModal.close).toHaveBeenCalled();
    }));
  });
});
