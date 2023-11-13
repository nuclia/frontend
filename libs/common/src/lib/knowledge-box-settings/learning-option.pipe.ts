import { Pipe, PipeTransform } from '@angular/core';
import { LearningConfigurationOption } from '@nuclia/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'learningOption',
})
export class LearningOptionPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}
  transform(option: LearningConfigurationOption, confId?: string): string {
    let key = 'stash.config.option.' + option.value;
    if (confId === 'anonymization_model' && option.value === 'multilingual') {
      key = 'stash.config.option.enabled';
    }
    const translation = this.translate.instant(key);
    return translation !== key ? translation : option.name.toLowerCase();
  }
}
