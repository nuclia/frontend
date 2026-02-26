import { Component, computed, input, signal } from '@angular/core';
import {
  AccordionBodyDirective,
  AccordionItemComponent,
  PaButtonModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { rootSchema } from '../../workflow.state';
import { convertNodeTypeToConfigTitle } from '../../workflow.utils';
import { ParentNode } from '../../workflow.models';

@Component({
  selector: 'app-node-functions',
  templateUrl: 'node-functions.component.html',
  styleUrls: ['./node-functions.component.scss'],
  imports: [AccordionBodyDirective, AccordionItemComponent, PaButtonModule, PaTextFieldModule, TranslateModule],
})
export class NodeFunctionsComponent {
  node = input<ParentNode>();

  expanded = true;
  copied = signal(false);
  agentId = computed(() => (this.node()?.nodeConfig as any)?.id);
  property = computed(() => {
    const nodeType = this.node()?.nodeType;
    const schemas = rootSchema();
    if (schemas && nodeType) {
      const schemaName = convertNodeTypeToConfigTitle(nodeType, schemas);
      const matchingSchema = schemas['$defs'][schemaName];
      return matchingSchema?.properties['published_functions'];
    }
  });
  functions = computed(() => this.property()?.default || []);

  copy() {
    this.copied.set(true);
    navigator.clipboard.writeText(this.agentId() || '');
    setTimeout(() => this.copied.set(false), 1000);
  }
}
