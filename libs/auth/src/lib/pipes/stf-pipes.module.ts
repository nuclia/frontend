
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FloorPipe } from './floor.pipe';
import { BoldPipe } from './bold.pipe';
import { GetByIdPipe } from './get-by-id.pipe';
import { SafePipe } from './safe.pipe';
import { SizePipe } from './size.pipe';
import { KeysPipe } from './keys.pipe';
import { TimeAgoPipe } from './time-ago.pipe';
import { GetFilePipe } from './get-file.pipe';
import { FilterPipe } from './filter.pipe';
import { TimeAgoDatePipe } from './time-ago-date.pipe';
import { AssetUrlPipe } from './asset-url.pipe';
import { SanitizeTagsPipe, TrimPipe } from './';

const PIPES = [
  BoldPipe,
  SizePipe,
  SafePipe,
  KeysPipe,
  GetByIdPipe,
  TimeAgoPipe,
  FloorPipe,
  GetFilePipe,
  TimeAgoDatePipe,
  FilterPipe,
  TrimPipe,
  SanitizeTagsPipe,
  AssetUrlPipe,
];

@NgModule({
  declarations: [...PIPES],
  imports: [CommonModule],
  exports: [...PIPES],
})

export class STFPipesModule {}
