import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'featureName' })
export class FeatureNamePipe implements PipeTransform {
  transform(value: string): string {
    return value.replace('_', ' ');
  }
}
