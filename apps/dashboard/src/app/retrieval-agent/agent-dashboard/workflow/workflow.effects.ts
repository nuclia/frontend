import { effect, Injectable } from '@angular/core';
import { workflow } from './workflow.state';

@Injectable({
  providedIn: 'root',
})
export class WorkflowEffectService {
  constructor() {
    effect(() => {
      console.log(`The current workflow is:`, workflow());
    });
  }
}
