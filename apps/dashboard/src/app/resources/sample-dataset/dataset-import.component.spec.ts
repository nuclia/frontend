import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';

import { DatasetImportComponent } from './dataset-import.component';
import { MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { UploadService } from '../upload.service';
import { SDKService } from '@flaps/core';
import {
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaTextFieldModule,
  PaTranslateModule,
  TranslatePipe,
} from '@guillotinaweb/pastanaga-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { SampleDatasetService } from './sample-dataset.service';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { LoadingModalComponent } from './loading-modal/loading-modal.component';

describe('DatasetImportComponent', () => {
  let component: DatasetImportComponent;
  let fixture: ComponentFixture<DatasetImportComponent>;

  let uploadService: UploadService;
  const loadingModal: ModalRef = {
    close: jest.fn(),
  } as any as ModalRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaButtonModule), MockModule(PaTextFieldModule), MockModule(PaTranslateModule)],
      declarations: [
        DatasetImportComponent,
        MockPipe(TranslatePipe, (key) => {
          return key === 'onboarding.dataset.upload-links'
            ? `You can also upload your own <a href="#files">files</a>, <a href="#folder">folders</a>, <a href="#link">links</a> or <a href="#csv">add resources from a CSV</a>.`
            : `translate--${key}`;
        }),
      ],
      providers: [
        MockProvider(UploadService, {
          upload: jest.fn(() => ({ afterClosed: () => of(null) } as any)),
        }),
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
    uploadService = TestBed.inject(UploadService);

    fixture.detectChanges();
  });

  it('should open upload files dialog when clicking on files link', waitForAsync(() => {
    fixture.debugElement.nativeElement.querySelector('a[href="#files"]').click();
    expect(uploadService.upload).toHaveBeenCalledWith('files');
  }));

  it('should open upload files dialog when clicking on folder link', waitForAsync(() => {
    fixture.debugElement.nativeElement.querySelector('a[href="#folder"]').click();
    expect(uploadService.upload).toHaveBeenCalledWith('folder');
  }));

  it('should open upload files dialog when clicking on link link', waitForAsync(() => {
    fixture.debugElement.nativeElement.querySelector('a[href="#link"]').click();
    expect(uploadService.upload).toHaveBeenCalledWith('link');
  }));

  it('should open upload files dialog when clicking on csv link', waitForAsync(() => {
    fixture.debugElement.nativeElement.querySelector('a[href="#csv"]').click();
    expect(uploadService.upload).toHaveBeenCalledWith('csv');
  }));

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
