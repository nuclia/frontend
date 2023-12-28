import { animate, group, query, style, transition, trigger } from '@angular/animations';

const duration = '350ms ease-in-out';

export const selectAnimations = [
  trigger('slideInOut', [
    transition('false => true', [
      query(':enter', [style({ transform: 'translateX(100%)', opacity: 0 })], { optional: true }),
      group([
        query(':leave', [animate(duration, style({ transform: 'translateX(-100%)', opacity: 0 }))], {
          optional: true,
        }),
        query(':enter', [animate(duration, style({ transform: 'translateX(0)', opacity: 1 }))], {
          optional: true,
        }),
      ]),
    ]),
    transition('true => false', [
      query(':enter', [style({ transform: 'translateX(-100%)', opacity: 0 })]),
      group([
        query(':leave', [animate(duration, style({ transform: 'translateX(100%)', opacity: 0 }))]),
        query(':enter', [animate(duration, style({ transform: 'translateX(0)', opacity: 1 }))]),
      ]),
    ]),
  ]),
];
