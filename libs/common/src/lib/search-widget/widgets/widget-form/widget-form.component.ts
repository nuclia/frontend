import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BackButtonComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import {
  AccordionBodyDirective,
  AccordionItemComponent,
  PaButtonModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { SearchConfigurationComponent } from '../../search-configuration';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BackButtonComponent,
    TranslateModule,
    PaButtonModule,
    AccordionItemComponent,
    AccordionBodyDirective,
    PaTogglesModule,
    SearchConfigurationComponent,
  ],
  templateUrl: './widget-form.component.html',
  styleUrl: './widget-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetFormComponent {
  @ViewChild('configurationContainer') configurationContainerElement?: ElementRef;

  widgetName = 'TODO';

  form = new FormGroup({
    popupStyle: new FormControl<'page' | 'popup'>('page', { nonNullable: true }),
    darkMode: new FormControl<'light' | 'dark'>('light', { nonNullable: true }),
    hideLogo: new FormControl<boolean>(false, { nonNullable: true }),
    permalinks: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToLink: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToFile: new FormControl<boolean>(false, { nonNullable: true }),
  });

  widgetFormExpanded = true;
}
