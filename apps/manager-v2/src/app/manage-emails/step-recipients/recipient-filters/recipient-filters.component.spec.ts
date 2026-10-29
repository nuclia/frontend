import { TestBed } from '@angular/core/testing';
import { SisToastService } from '@nuclia/sistema';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { RecipientFiltersComponent } from './recipient-filters.component';
import { RecipientsLoaderService } from '../recipients-loader.service';
import { RecipientsService } from '../recipients.service';

describe('RecipientFiltersComponent', () => {
  let component: RecipientFiltersComponent;
  let recipients: RecipientsService;
  let load: jest.Mock;

  beforeEach(() => {
    load = jest.fn().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [RecipientFiltersComponent],
      providers: [RecipientsService, MockProvider(RecipientsLoaderService, { load }), MockProvider(SisToastService)],
    });
    recipients = TestBed.inject(RecipientsService);
    component = TestBed.createComponent(RecipientFiltersComponent).componentInstance;
    load.mockClear();
  });

  it('should update the segments and ignore unchanged or unknown values', () => {
    component.onSegmentChange(['unknown']);
    component.onSegmentChange(undefined);
    expect(load).not.toHaveBeenCalled();

    component.onSegmentChange(['trials', 'progress']);
    expect(recipients.segmentFilter()).toEqual(['trials', 'progress']);
    expect(load).toHaveBeenCalledTimes(1);

    component.onSegmentChange(['progress', 'trials']);
    expect(load).toHaveBeenCalledTimes(1);

    component.onSegmentChange([]);
    expect(load).toHaveBeenLastCalledWith('AOWNER', []);
  });

  it('should update the role filter only when it changes', () => {
    component.onFilterChange('AOWNER');
    component.onFilterChange('nope');
    expect(load).not.toHaveBeenCalled();
    component.onFilterChange('ALL');
    expect(load).toHaveBeenLastCalledWith('ALL', []);
  });
});
