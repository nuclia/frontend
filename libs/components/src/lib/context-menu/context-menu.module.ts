import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { ContextMenuComponent } from './context-menu.component';
import { ContextMenuItemComponent } from './context-menu-item/context-menu-item.component';

@NgModule({
  declarations: [ContextMenuComponent, ContextMenuItemComponent],
  imports: [CommonModule, MatMenuModule],
  exports: [ContextMenuComponent, ContextMenuItemComponent],
})
export class ContextMenuModule {}
