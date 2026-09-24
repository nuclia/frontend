import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SizePipe } from './size.pipe';

const PIPES = [SizePipe];

@NgModule({
  imports: [CommonModule, ...PIPES],
  exports: [...PIPES],
})
export class STFPipesModule {}
