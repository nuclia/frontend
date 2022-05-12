import { Injectable } from '@angular/core';
import { take, takeUntil } from 'rxjs/operators';
import { TourService, IStepOption } from 'ngx-ui-tour-md-menu';
import { AppService } from './app.service';
import { STFTrackingService } from '@flaps/auth';

const LOCAL_STORAGE_KEY = 'NUCLIA_TOUR_COMPLETED';

@Injectable({
  providedIn: 'root',
})
export class HelpBoxesService {
  constructor(private app: AppService, private tourService: TourService, private tracking: STFTrackingService) {}
  isTourDisabled = true;

  initializeTour() {
    this.tracking.getEnabledFeatures().subscribe((features) => {
      this.tourService.initialize(
        this.isTourDisabled
          ? []
          : TOUR_STEPS.filter(
            (step) =>
              !step.anchorId ||
              !STEPS_FEATURES_DEPENDENCIES[step.anchorId] ||
              STEPS_FEATURES_DEPENDENCIES[step.anchorId].some((feature) => features.includes(feature)),
            )
      );
      this.tracking.logEvent('tour_started');
    });
  }

  startTour(delay: number = 0) {
    if (this.isTourDisabled) return;

    // Once the tour ends, it's not showed any more (even if the user doesn't see all the steps)
    this.tourService.end$.pipe(take(1)).subscribe(() => {
      this.setTourCompleted();
    });

    // Hide help boxes while the menu is open
    this.tourService.start$.pipe(take(1)).subscribe(() => {
      this.app.menuOpen.pipe(takeUntil(this.tourService.end$)).subscribe((isOpen) => {
        isOpen ? this.tourService.pause() : this.tourService.resume();
      });
    });

    setTimeout(() => {
      this.tourService.start();
    }, delay);
  }

  isTourCompleted(): boolean {
    const value = localStorage.getItem(LOCAL_STORAGE_KEY);
    return value !== null;
  }

  setTourCompleted(): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
  }
}

// Guide tour steps
// Property "stepId" is reused to set custom options (offsetX, offsetY, arrow position)
const TOUR_STEPS: IStepOption[] = [
  {
    anchorId: 'step1',
    title: 'tour.step1.title',
    content: 'tour.step1.content',
    stepId: '60px,15px,top-left-edge',
  },
  {
    anchorId: 'step2',
    title: 'tour.step2.title',
    content: 'tour.step2.content',
    stepId: '0px,15px,top-left',
  },
  {
    anchorId: 'step3',
    title: 'tour.step3.title',
    content: 'tour.step3.content',
    stepId: '320px,-36px,right-top',
  },
  {
    anchorId: 'step4',
    title: 'tour.step4.title',
    content: 'tour.step4.content',
    stepId: '4px,15px,top-right',
  },
  {
    anchorId: 'step5',
    title: 'tour.step5.title',
    content: 'tour.step5.content',
    stepId: '84px,-80px,right-top',
  },
  {
    anchorId: 'step6',
    title: 'tour.step6.title',
    content: 'tour.step6.content',
    stepId: '84px,-64px,right-top',
  },
  // {
  //   anchorId: 'step7',
  //   title: 'tour.step7.title',
  //   content: 'tour.step7.content',
  //   stepId: '84px,-43px,right-top',
  // },
  {
    anchorId: 'step8',
    title: 'tour.step8.title',
    content: 'tour.step8.content',
    stepId: '84px,-43px,right-top',
  },
  // {
  //   anchorId: 'step9',
  //   title: 'tour.step9.title',
  //   content: 'tour.step9.content',
  //   stepId: '84px,-43px,right-top',
  // },
  {
    anchorId: 'step10',
    title: 'tour.step10.title',
    content: 'tour.step10.content',
    stepId: '84px,-43px,right-top',
  },
  // {
  //   anchorId: 'step11',
  //   title: 'tour.step11.title',
  //   content: 'tour.step11.content',
  //   placement: {
  //     xPosition: 'after',
  //     yPosition: 'above',
  //   },
  //   stepId: '68px,43px,right-bottom',
  // },
];
const STEPS_FEATURES_DEPENDENCIES: { [step: string]: string[] } = {
  step5: ['upload-link', 'upload-files', 'upload-folder'],
  step6: ['view-resources', 'manage-ontologies', 'manage-entities'],
  step8: ['manage-widgets'],
  step10: ['manage-api-keys'],
};
