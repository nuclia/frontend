import { Pipe, PipeTransform } from '@angular/core';
import { LearningConfigurationOption } from '@nuclia/core';
import { TranslateService } from '@ngx-translate/core';

// TODO: renove
@Pipe({
  name: 'learningOption',
  standalone: true,
})
export class LearningOptionPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}
  transform(option: LearningConfigurationOption, confId?: string): string {
    let key = `kb.settings.learning-options.${option.value}`;
    if (confId === 'anonymization_model' && option.value === 'multilingual') {
      key = 'kb.settings.learning-options.enabled';
    } else if (confId === 'summary') {
      key = `kb.settings.learning-options.summary-${option.value}`;
    }
    const translation = this.translate.instant(key);
    return translation !== key ? translation : option.name.toLowerCase();
  }
}
