import { Pipe, PipeTransform, Inject } from '@angular/core';
import { BackendConfigurationService } from '../backend-config.service';

@Pipe({
  name: 'assetUrl'
})
export class AssetUrlPipe implements PipeTransform {

  constructor(private config: BackendConfigurationService) {}

  transform(value: string): string {
    return (this.config.getBaseAssetUrl() || '') + value;
  }

}
