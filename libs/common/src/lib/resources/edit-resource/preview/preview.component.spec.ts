import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  EditResourceService,
  FeaturesService,
  LabelsService,
  NavigationService,
  ResourceNavigationService,
  SDKService,
} from '@flaps/core';
import { FIELD_TYPE, FieldId } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { ParagraphService } from '../paragraph.service';
import { PreviewComponent } from './preview.component';
import { PreviewService } from './preview.service';

describe('PreviewComponent toolbar integration', () => {
  let fixture: ComponentFixture<PreviewComponent>;
  let component: PreviewComponent;
  let viewerResult: Subject<boolean>;
  let fields: BehaviorSubject<FieldId[]>;
  let params: BehaviorSubject<Params>;
  let previewService: {
    viewerWidget: ReturnType<typeof of>;
    viewerRequested: Subject<void>;
    openViewer: jest.Mock;
    setViewerState: jest.Mock;
  };
  let toaster: { error: jest.Mock };

  beforeEach(() => {
    viewerResult = new Subject<boolean>();
    fields = new BehaviorSubject<FieldId[]>([{ field_id: 'file1', field_type: FIELD_TYPE.file }]);
    params = new BehaviorSubject<Params>({});
    toaster = { error: jest.fn() };
    previewService = {
      viewerWidget: of(''),
      viewerRequested: new Subject<void>(),
      openViewer: jest.fn(() => viewerResult),
      setViewerState: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { params, data: of({}) } },
        { provide: Router, useValue: {} },
        { provide: LabelsService, useValue: { textBlockLabelSets: of({}) } },
        { provide: NavigationService, useValue: { kbUrl: of('') } },
        { provide: FeaturesService, useValue: { unstable: { agenticDAGeneration: of(false) } } },
        { provide: SDKService, useValue: { currentKb: of({}) } },
        { provide: SisModalService, useValue: {} },
        { provide: SisToastService, useValue: toaster },
        { provide: ResourceNavigationService, useValue: {} },
        { provide: PreviewService, useValue: previewService },
        {
          provide: EditResourceService,
          useValue: {
            resource: of({ id: 'resource1' }),
            fields,
            currentField: of('resource'),
            fieldExtractedData: of(null),
            loadingField: of(false),
            setCurrentView: jest.fn(),
            setCurrentField: jest.fn(),
          },
        },
        {
          provide: ParagraphService,
          useValue: {
            paragraphList: of([]),
            messages: of([]),
            conversationPage: of(1),
            hasMorePages: of(false),
            cleanup: jest.fn(),
          },
        },
      ],
    }).overrideComponent(PreviewComponent, { set: { template: '', imports: [] } });
    fixture = TestBed.createComponent(PreviewComponent);
    component = fixture.componentInstance;
    component.currentFieldId = fields.value[0];
  });

  it('waits for the viewer to open and prevents duplicate toolbar requests', () => {
    component.openViewer();
    viewerResult.next(false);
    component.openViewer();

    expect(component.loadingPreview).toBe(true);
    expect(previewService.openViewer).toHaveBeenCalledTimes(1);

    viewerResult.next(true);

    expect(component.loadingPreview).toBe(false);
    expect(previewService.setViewerState).toHaveBeenLastCalledWith({ available: true, loading: false });
  });

  it('restores the toolbar and surfaces viewer failures', () => {
    component.openViewer();
    viewerResult.error(new Error('Viewer failed'));

    expect(component.loadingPreview).toBe(false);
    expect(toaster.error).toHaveBeenCalledWith('generic.error.oops');
  });

  it('cleans up an in-flight viewer request when navigating away', () => {
    component.openViewer();
    fixture.destroy();

    expect(viewerResult.observed).toBe(false);
    expect(previewService.setViewerState).toHaveBeenLastCalledWith({ available: false, loading: false });
  });

  it('clears a stale viewer target when a resource no longer has a single field', () => {
    fixture.detectChanges();
    fields.next([
      { field_id: 'file1', field_type: FIELD_TYPE.file },
      { field_id: 'text1', field_type: FIELD_TYPE.text },
    ]);

    expect(component.currentFieldId).toBeUndefined();
    expect(previewService.setViewerState).toHaveBeenLastCalledWith({ available: false, loading: false });
  });
});
