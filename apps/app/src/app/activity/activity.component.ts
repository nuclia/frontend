import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

// Temporary
export interface ActivityItem { 
  filename: string;
  error?: string;
  date: Date;
}

// Temporary
const activity: ActivityItem[] = [
  { filename: 'Pressupost assignat assaig 5010000000016A A105010000001.xls', date: new Date() },
  { filename: 'evolucio 3 setmanes blablablabla.jpg', date: new Date() },
  { filename: 'Pressupost assignat assaig clinic 1503001.xls', date: new Date(), error: 'Error description code like alksdjfalñksdjf/aksjdflñakjdsf/ñalkjdsflkajdf/ñlakjsdflñakjf/dsf/ñalkjdsflkajdf/ñlakjsdflñakjf/jjjj' },
  { filename: 'presentation sample.ppt', date: new Date() },
  { filename: 'Pressupost assignat assaig 5010000000016A A105010000001.xls', date: new Date() },
  { filename: 'evolucio 3 setmanes blablablabla.jpg', date: new Date() },
  { filename: 'Pressupost assignat assaig clinic 1503001.xls', date: new Date() },
  { filename: 'presentation sample.ppt', date: new Date(), error: 'An error occurs' },
];

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityComponent {

  tabs = [
    { key: 'processed', title: 'activity.processed' },
    { key: 'created', title: 'activity.created' },
    { key: 'deleted', title: 'activity.deleted' },
    { key: 'edited', title: 'activity.edited' },
    { key: 'displayed', title: 'activity.displayed' }
  ];
  currentTab$ = new BehaviorSubject<string>(this.tabs[0]?.key);

  activity = this.currentTab$.pipe(
    map((tab) => {
      // TODO: endpont call
      return activity;
    }
  ));

  constructor() { }

  selectTab(tab: string) {
    this.currentTab$.next(tab);
  }
}
