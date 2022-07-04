import { Pipe, PipeTransform } from '@angular/core';
import { BackendConfigurationService } from '../config';

@Pipe({
  name: 'assetUrl',
})
export class AssetUrlPipe implements PipeTransform {
  constructor(private config: BackendConfigurationService) {}

  transform(value: string): string {
    return (this.config.getBaseAssetUrl() || '') + value;
  }
}
