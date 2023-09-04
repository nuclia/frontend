import { Component } from '@angular/core';
import { SDKService } from '@flaps/core';
import { BehaviorSubject, concatMap, filter, map, Observable, scan, take, tap } from 'rxjs';
import { TrainingExecutionStatus, TrainingExecutionWithDuration } from '@nuclia/core';
import { formatDuration, intervalToDuration } from 'date-fns';

@Component({
  selector: 'app-training-history',
  templateUrl: './training-history.component.html',
  styleUrls: ['./training-history.component.scss'],
})
export class TrainingHistoryComponent {
  status = TrainingExecutionStatus;
  isLastPage = false;
  currentPage = new BehaviorSubject<number>(0);
  executions$: Observable<TrainingExecutionWithDuration[]> = this.currentPage.pipe(
    concatMap(() =>
      this.sdk.currentKb.pipe(
        filter((kb) => !!kb),
        take(1),
      ),
    ),
    concatMap((kb) => kb.training.getExecutions(this.currentPage.getValue())),
    tap((data) => (this.isLastPage = data.pagination.last)),
    map((data) =>
      data.items.map((item) => ({
        ...item,
        duration: this.getDuration(new Date(item.start), new Date(item.end)),
      })),
    ),
    scan((acc, current) => acc.concat(current), [] as TrainingExecutionWithDuration[]),
  );

  constructor(private sdk: SDKService) {}

  getDuration(start: Date, end: Date) {
    const duration = intervalToDuration({ start, end });
    return formatDuration(duration, {
      format: ['hours', 'minutes', 'seconds'],
      zero: true,
      delimiter: ':',
      locale: { formatDistance: (token, count) => count.toString().padStart(2, '0') },
    });
  }

  fetchNextPage() {
    if (!this.isLastPage) {
      this.currentPage.next(this.currentPage.getValue() + 1);
    }
  }
}
