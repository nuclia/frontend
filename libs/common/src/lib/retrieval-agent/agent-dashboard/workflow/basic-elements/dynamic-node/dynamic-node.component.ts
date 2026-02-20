import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { JSONSchema4 } from 'json-schema';
import {
  ConfigBlockComponent,
  ConfigBlockItem,
  ConnectableEntryComponent,
  NodeBoxComponent,
  NodeDirective,
} from '../index';
import { WorkflowService } from '../../workflow.service';
import { NodeCategory, NodeType } from '../../workflow.models';
import { convertNodeTypeToConfigTitle } from '../../workflow.utils';
import { toSignal } from '@angular/core/rxjs-interop';
import { Driver, NucliaDBDriver } from '@nuclia/core';

// Extend JSONSchema4 to include show_in_node property
interface ExtendedJSONSchema4 extends JSONSchema4 {
  show_in_node?: boolean;
}

interface SchemaEntry {
  schema: JSONSchema4;
  title: string;
  hasDiscriminator: boolean;
  discriminatorProperties: string[];
  fallbackEntries: Array<{ id: string; title: string }>;
}

@Component({
  selector: 'app-dynamic-node',
  imports: [ConfigBlockComponent, ConnectableEntryComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './dynamic-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicNodeComponent extends NodeDirective implements OnInit {
  private workflowService = inject(WorkflowService);

  private schemas = signal<JSONSchema4 | null>(null);
  private schemaEntry = signal<SchemaEntry | null>(null);
  labels = signal<{ [field: string]: { [key: string]: string } }>({});
  drivers = toSignal(this.workflowService.driverModels$);

  nodeConfig = computed<ConfigBlockItem[]>(() => {
    const config = this.config();
    if (!config) {
      return [];
    }

    // Get the current schema to check for show_in_node property
    const schemaEntry = this.schemaEntry();
    const schema = schemaEntry?.schema;

    // Filter properties based on schema's show_in_node flag and other criteria
    const meaningfulProperties = Object.entries(config).filter(([key, value]) => {
      // Check if value is meaningful
      if (
        value === null ||
        value === undefined ||
        value === '' ||
        (typeof value === 'object' && !Array.isArray(value)) ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return false;
      }

      // Check schema for show_in_node property
      if (schema?.properties?.[key]) {
        const propertySchema = schema.properties[key] as ExtendedJSONSchema4;
        // Only show if show_in_node is explicitly set to true
        return propertySchema.show_in_node === true;
      }

      // If no schema available or property not found in schema, don't show
      return false;
    });

    return meaningfulProperties.map(([key, value]) => {
      let values = [{ value: this.formatPropertyValue(value) }];
      // For source/sources properties, extra information is displayed
      if (key === 'sources') {
        const sources = Array.isArray(value) ? value : value.split(',');
        values = this.formatSourcesValue(sources, this.drivers() || []);
      } else if (key === 'source' && typeof value === 'string') {
        values = this.formatSourcesValue([value], this.drivers() || []);
      }
      return {
        key,
        title: this.formatPropertyName(key),
        values,
      };
    });
  });

  private formatPropertyValue(value: any): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      // For objects, try to show a meaningful representation
      if (value.name || value.identifier || value.title) {
        return value.name || value.identifier || value.title;
      }
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  }

  private formatSourcesValue(value: string[], drivers: Driver[]) {
    return value.map((id) => {
      const source = drivers?.find((driver) => driver.identifier === id);
      return {
        value: source?.name || id,
        description: source?.provider === 'nucliadb' ? (source as NucliaDBDriver).config.description : undefined,
      };
    });
  }

  nodeTitle = computed(() => {
    const entry = this.schemaEntry();
    const nodeType = this.type();
    if (entry?.title) {
      return entry.title;
    }
    // Fallback to node type with proper formatting
    return nodeType ? this.formatNodeType(nodeType) : 'Node';
  });

  fallbackEntries = computed(() => {
    return this.schemaEntry()?.fallbackEntries || [];
  });

  ngOnInit(): void {
    // Always analyze the configuration first
    this.analyzeConfiguration();

    // Subscribe to schemas from the workflow service
    this.workflowService.schemas$.subscribe((schemas) => {
      if (schemas) {
        this.schemas.set(schemas);
        const matchingSchema = this.getMatchingSchema(this.type(), this.category(), schemas);
        if (matchingSchema) {
          const entry = this.createSchemaEntry(matchingSchema, matchingSchema?.title || this.type() || '');
          this.schemaEntry.set(entry);
        }
      }
    });

    this.workflowService.driverModels$.subscribe((drivers) => {
      const driversLabels = drivers?.reduce(
        (all, curr) => {
          all[curr.identifier] = curr.name;
          return all;
        },
        {} as { [key: string]: string },
      );
      if (driversLabels) {
        this.labels.set({ sources: driversLabels });
      }
    });

    // If schemas are not available, fetch them
    if (!this.schemas()) {
      this.workflowService.fetchSchemas();
    }
  }

  private analyzeConfiguration(): void {
    // Create entries based purely on the configuration, without waiting for schemas
    const configEntries = this.createEntriesFromConfig();

    // Always set the schema entry if we have a node type, even if no config entries
    const nodeType = this.type();
    this.schemaEntry.set({
      schema: {},
      title: this.formatNodeType(nodeType || 'Node'),
      hasDiscriminator: configEntries.length > 0,
      discriminatorProperties: [],
      fallbackEntries: configEntries,
    });
  }

  private getMatchingSchema(
    nodeType: NodeType | undefined,
    category: NodeCategory | undefined,
    schemas: JSONSchema4 | null,
  ): JSONSchema4 | undefined {
    if (!schemas || !nodeType || !category) {
      return;
    }
    const categorySchemas = schemas.properties?.[category];
    if (!categorySchemas) {
      return;
    }
    const mapping = (categorySchemas.items as any)?.discriminator?.mapping;
    if (!mapping) {
      return;
    }
    const key = mapping[nodeType]?.split('/').slice(-1)[0];
    if (key) {
      return schemas['$defs'][key] as JSONSchema4;
    }
    return;
  }

  private createEntriesFromConfig(): Array<{ id: string; title: string }> {
    const config = this.config();
    const entries: Array<{ id: string; title: string }> = [];

    if (!config) {
      return entries;
    }

    // For saved workflows, we can create entries based on configuration alone
    // Check for common connectable properties in the config first
    Object.entries(config).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value?.module) {
        const title = this.formatPropertyName(key);
        entries.push({ id: key, title });
      }
    });

    // If we found entries from config, return them immediately (for saved workflows)
    if (entries.length > 0) {
      return entries;
    }

    // Get the matching schema to understand which properties should create entries
    const schemas = this.schemas();
    const nodeType = this.type();
    const category = this.category();

    if (!schemas || !nodeType || !category) {
      return entries;
    }

    // Find the schema for this node type
    const categorySchemas = schemas.properties?.[category];
    if (!categorySchemas) {
      return entries;
    }

    const schemaTitle = convertNodeTypeToConfigTitle(nodeType, schemas);
    const matchingSchema = schemas['$defs'][schemaTitle];

    if (!matchingSchema?.properties) {
      return entries;
    }

    // Check each property in the config against the schema to see if it should create a connectable entry
    Object.entries(config as any).forEach(([key, value]) => {
      if (value && typeof value === 'object' && matchingSchema.properties?.[key]) {
        const propertySchema = matchingSchema.properties[key];

        // Check if this property has discriminators that would make it connectable
        if (this.hasDiscriminatorProperty(propertySchema)) {
          const title = this.getConnectableEntryTitle(key, propertySchema);
          entries.push({ id: key, title });
        }
      }
    });

    return entries;
  }

  private getConnectableEntryTitle(propertyKey: string, propertySchema: JSONSchema4): string {
    // Check if the schema defines a title
    if (propertySchema.title) {
      return propertySchema.title;
    }

    // Default to formatted property name
    return this.formatPropertyName(propertyKey);
  }

  private hasDiscriminatorProperty(property: JSONSchema4): boolean {
    // Check if the property has anyOf with discriminator
    if (property.anyOf && Array.isArray(property.anyOf)) {
      return property.anyOf.some(
        (item: any) => item.discriminator && typeof item.discriminator === 'object' && item.discriminator.mapping,
      );
    }

    // Check if the property has oneOf with discriminator
    if (property.oneOf && Array.isArray(property.oneOf)) {
      return property.oneOf.some(
        (item: any) => item.discriminator && typeof item.discriminator === 'object' && item.discriminator.mapping,
      );
    }

    // Check if the property itself has a discriminator
    if (
      (property as any).discriminator &&
      typeof (property as any).discriminator === 'object' &&
      (property as any).discriminator.mapping
    ) {
      return true;
    }

    // Check if it's an array type with items that have discriminators
    if (property.type === 'array' && property.items) {
      const items = property.items as JSONSchema4;

      // Check if items have discriminator directly
      if (
        (items as any).discriminator &&
        typeof (items as any).discriminator === 'object' &&
        (items as any).discriminator.mapping
      ) {
        return true;
      }

      // Check if items have anyOf/oneOf with discriminators
      if (items.anyOf && Array.isArray(items.anyOf)) {
        return items.anyOf.some(
          (item: any) => item.discriminator && typeof item.discriminator === 'object' && item.discriminator.mapping,
        );
      }

      if (items.oneOf && Array.isArray(items.oneOf)) {
        return items.oneOf.some(
          (item: any) => item.discriminator && typeof item.discriminator === 'object' && item.discriminator.mapping,
        );
      }
    }

    return false;
  }

  private extractDiscriminatorEntries(
    property: JSONSchema4,
    propertyKey: string,
  ): Array<{ id: string; title: string }> {
    const entries: Array<{ id: string; title: string }> = [];

    // Function to extract entries from a discriminator mapping
    const extractFromMapping = (discriminator: any) => {
      if (discriminator.mapping && typeof discriminator.mapping === 'object') {
        // Map property name to appropriate connectable entry
        let entryId = propertyKey;
        let entryTitle = this.formatPropertyName(propertyKey);

        entries.push({ id: entryId, title: entryTitle });
        return true;
      }
      return false;
    };

    // Check direct discriminator
    if ((property as any).discriminator) {
      if (extractFromMapping((property as any).discriminator)) {
        return entries;
      }
    }

    // Check discriminators in anyOf
    if (property.anyOf && Array.isArray(property.anyOf)) {
      for (const item of property.anyOf) {
        if ((item as any).discriminator && extractFromMapping((item as any).discriminator)) {
          return entries;
        }
      }
    }

    // Check discriminators in oneOf
    if (property.oneOf && Array.isArray(property.oneOf)) {
      for (const item of property.oneOf) {
        if ((item as any).discriminator && extractFromMapping((item as any).discriminator)) {
          return entries;
        }
      }
    }

    // Check discriminators in array items
    if (property.type === 'array' && property.items) {
      const items = property.items as JSONSchema4;

      // Check direct discriminator on items
      if ((items as any).discriminator && extractFromMapping((items as any).discriminator)) {
        return entries;
      }

      // Check discriminators in items' anyOf/oneOf
      if (items.anyOf && Array.isArray(items.anyOf)) {
        for (const item of items.anyOf) {
          if ((item as any).discriminator && extractFromMapping((item as any).discriminator)) {
            return entries;
          }
        }
      }

      if (items.oneOf && Array.isArray(items.oneOf)) {
        for (const item of items.oneOf) {
          if ((item as any).discriminator && extractFromMapping((item as any).discriminator)) {
            return entries;
          }
        }
      }
    }

    return entries;
  }

  private createSchemaEntry(schema: JSONSchema4, title: string): SchemaEntry {
    const properties = schema.properties || {};
    const discriminatorProperties: string[] = [];
    const nodeType = this.type();

    // Start with config-based entries
    const fallbackEntries = this.createEntriesFromConfig();
    let hasDiscriminator = fallbackEntries.length > 0;

    // Look for discriminator properties and fallback entries
    Object.entries(properties).forEach(([key, property]) => {
      const prop = property as JSONSchema4;

      // Check if this property is a discriminator (typically enum or const values)
      if (prop.enum || prop['const'] || (prop.anyOf && prop.anyOf.length > 0)) {
        discriminatorProperties.push(key);

        // If it's named 'discriminator' specifically, mark it
        if (key.toLowerCase() === 'discriminator') {
          hasDiscriminator = true;
        }
      }

      // Check for properties with discriminators or fallback scenarios
      if (this.hasDiscriminatorProperty(prop)) {
        hasDiscriminator = true;
        // Extract discriminator entries dynamically from the schema - but only if we didn't already add from config
        const discriminatorEntries = this.extractDiscriminatorEntries(prop, key);
        // Avoid duplicates - don't add if we already added from config
        const newEntries = discriminatorEntries.filter(
          (entry) => !fallbackEntries.some((existing) => existing.id === entry.id),
        );
        // "rank_fusion" property (from advanced_ask) is not a fallback entry even if it has a discriminator
        const validEntries = newEntries.filter((entry) => entry.id !== 'rank_fusion');
        fallbackEntries.push(...validEntries);
      } else if (
        key.toLowerCase().includes('fallback') ||
        key.toLowerCase().includes('next_agent') ||
        key.toLowerCase().includes('else') ||
        key.toLowerCase().includes('alternative') ||
        (key.toLowerCase().includes('agents') && !key.toLowerCase().startsWith('registered_agents_'))
      ) {
        // Only add if not already added from config
        if (!fallbackEntries.some((entry) => entry.id === key)) {
          fallbackEntries.push({
            id: key,
            title: prop.title || this.formatPropertyName(key),
          });
        }
      }
    });

    return {
      schema,
      title,
      hasDiscriminator,
      discriminatorProperties,
      fallbackEntries,
    };
  }

  private formatNodeType(nodeType: string): string {
    return nodeType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatPropertyName(propertyName: string): string {
    return propertyName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
