import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subject, BehaviorSubject, combineLatest, map, takeUntil } from 'rxjs';
import { EventType } from '@nuclia/core';
import { ActivityService, VISIBLE_TYPES } from './activity.service';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss'],
  providers: [ActivityService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityComponent implements OnDestroy {
  tabs = VISIBLE_TYPES.map((type) => ({ type, title: 'activity.' + type.toLowerCase() }));
  currentTab = new BehaviorSubject<EventType>(this.tabs[0]?.type);

  data = combineLatest([this.currentTab, this.activity.activity]).pipe(
    map(([currentTab, activity]) => activity[currentTab]!),
  );
  unsubscribeAll = new Subject<void>();

  constructor(private activity: ActivityService) {
    this.data.pipe(takeUntil(this.unsubscribeAll)).subscribe((data) => {
      if (!data.pagination) {
        this.loadMoreEvents();
      }
    });
  }

  selectTab(tab: EventType) {
    this.currentTab.next(tab);
  }

  loadMoreEvents() {
    this.activity.loadMoreEvents(this.currentTab.getValue());
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
