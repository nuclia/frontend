import { Component, Input } from '@angular/core';
import { ActivityEvent } from './activity.service';

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss']
})
export class ActivityListComponent {
  @Input() items: ActivityEvent[] = [];

  constructor() { }
}
