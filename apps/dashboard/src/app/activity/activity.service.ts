import { inject, Injectable } from '@angular/core';
import { LOCAL_STORAGE } from '@ng-web-apis/common';

const ACTIVITY_KEY = 'NUCLIA_ACTIVITY';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface ActivityCache {
  [kbId: string]: {
    [event: string]: {
      timestamp: number;
      data: string;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private storage = inject(LOCAL_STORAGE);

  getStoredActivity() {
    let activity: ActivityCache;
    let modified = false;
    try {
      activity = JSON.parse(this.storage.getItem(ACTIVITY_KEY) || '');
    } catch {
      activity = {};
      modified = true;
    }
    const expirationDate = new Date().getTime() - CACHE_DURATION;
    Object.entries(activity).forEach(([kbId, events]) => {
      Object.entries(events).forEach(([event, value]) => {
        if (value.timestamp < expirationDate) {
          delete activity[kbId][event];
          modified = true;
        }
      });
    });
    if (modified) {
      this.storage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
    }
    return activity;
  }

  storeActivity(kbId: string, event: string, data: string) {
    const activity = this.getStoredActivity();
    if (!activity[kbId]) {
      activity[kbId] = {};
    }
    activity[kbId][event] = {
      timestamp: new Date().getTime(),
      data,
    };
    try {
      this.storage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
    } catch {
      // Local storage quota is exceeded
    }
  }
}
