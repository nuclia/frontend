import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DatasetImportComponent } from './dataset-import.component';
import { MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { UploadService } from '../upload.service';
import { SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule, PaTranslateModule, TranslatePipe } from '@guillotinaweb/pastanaga-angular';

describe('DatasetImportComponent', () => {
  let component: DatasetImportComponent;
  let fixture: ComponentFixture<DatasetImportComponent>;

  let uploadService: UploadService;

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
      providers: [MockProvider(UploadService, { upload: jest.fn() }), MockProvider(SDKService)],
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
});
