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
import { ARAGSchemas } from '@nuclia/core';

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

  private schemas = signal<ARAGSchemas | null>(null);
  private schemaEntry = signal<SchemaEntry | null>(null);

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

    return meaningfulProperties.map(([key, value]) => ({
      title: this.formatPropertyName(key),
      content: this.formatPropertyValue(value),
    }));
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
        this.analyzeSchema();
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

  private analyzeSchema(): void {
    const schemas = this.schemas();
    const nodeType = this.type();
    const category = this.category();

    if (!schemas || !nodeType || !category) {
      // Create a basic fallback entry even without schemas
      this.createFallbackEntry();
      return;
    }

    // Find the schema for this node type
    const categorySchemas = schemas.agents[category];
    if (!Array.isArray(categorySchemas)) {
      this.createFallbackEntry();
      return;
    }

    // Find the matching schema
    let matchingSchema: JSONSchema4 | null = null;
    let schemaTitle = '';

    for (const schema of categorySchemas) {
      // Check if this schema matches our node type
      if (this.schemaMatchesNodeType(schema, nodeType)) {
        // If the schema has a $ref, resolve it from $defs
        if (schema['$ref']) {
          matchingSchema = this.resolveSchemaRef(schema, schema['$ref']);
          schemaTitle = matchingSchema?.title || schema.title || nodeType;
        } else {
          matchingSchema = schema;
          schemaTitle = schema.title || nodeType;
        }
        break;
      }
    }

    if (matchingSchema) {
      const entry = this.createSchemaEntry(matchingSchema, schemaTitle);
      this.schemaEntry.set(entry);
    } else {
      // Create fallback entry if no schema matches
      this.createFallbackEntry();
    }
  }

  private createEntriesFromConfig(): Array<{ id: string; title: string }> {
    const config = this.config();
    const entries: Array<{ id: string; title: string }> = [];

    if (!config) {
      return entries;
    }

    // For saved workflows, we can create entries based on configuration alone
    // Check for common connectable properties in the config first
    const commonConnectableProperties = ['fallback', 'then', 'else_'];
    commonConnectableProperties.forEach((prop) => {
      if ((config as any)[prop]) {
        const title = this.formatPropertyName(prop);
        entries.push({ id: prop, title });
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
    const categorySchemas = schemas.agents[category];
    if (!Array.isArray(categorySchemas)) {
      return entries;
    }

    let matchingSchema: JSONSchema4 | null = null;
    for (const schema of categorySchemas) {
      if (this.schemaMatchesNodeType(schema, nodeType)) {
        if (schema['$ref']) {
          matchingSchema = this.resolveSchemaRef(schema, schema['$ref']);
        } else {
          matchingSchema = schema;
        }
        break;
      }
    }

    if (!matchingSchema?.properties) {
      return entries;
    }

    // Check each property in the config against the schema to see if it should create a connectable entry
    Object.entries(config as any).forEach(([key, value]) => {
      if (value && typeof value === 'object' && matchingSchema.properties?.[key]) {
        const propertySchema = matchingSchema.properties[key] as JSONSchema4;

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

  private createFallbackEntry(): void {
    const nodeType = this.type();
    const category = this.category();
    const schemas = this.schemas();

    // Start with config-based entries
    const fallbackEntries = this.createEntriesFromConfig();

    // Try to find schema even when not matched in analyzeSchema
    let schemaToAnalyze: JSONSchema4 | null = null;

    if (schemas && category) {
      const categorySchemas = schemas.agents[category];
      if (Array.isArray(categorySchemas)) {
        // Find any schema that might be relevant for this node type
        const foundSchema = categorySchemas.find(
          (schema) =>
            this.schemaMatchesNodeType(schema, nodeType || '') ||
            schema.title?.toLowerCase().includes((nodeType || '').toLowerCase().replace('_', '')),
        );

        if (foundSchema) {
          // If the schema has a $ref, resolve it from $defs
          if (foundSchema['$ref']) {
            schemaToAnalyze = this.resolveSchemaRef(foundSchema, foundSchema['$ref']);
          } else {
            schemaToAnalyze = foundSchema;
          }
        }
      }
    }

    // Also analyze the schema for discriminator properties (but avoid duplicates)
    const schemaEntries = this.createFallbackEntriesFromSchema(schemaToAnalyze, nodeType, category);
    const newEntries = schemaEntries.filter((entry) => !fallbackEntries.some((existing) => existing.id === entry.id));
    fallbackEntries.push(...newEntries);

    this.schemaEntry.set({
      schema: schemaToAnalyze || {},
      title: this.formatNodeType(nodeType || 'Node'),
      hasDiscriminator: fallbackEntries.length > 0,
      discriminatorProperties: [],
      fallbackEntries,
    });
  }

  private createFallbackEntriesFromSchema(
    schema: JSONSchema4 | null,
    nodeType: string | undefined,
    category: string,
  ): Array<{ id: string; title: string }> {
    const fallbackEntries: Array<{ id: string; title: string }> = [];

    if (schema?.properties) {
      // Look for properties that contain discriminators
      Object.entries(schema.properties).forEach(([key, property]) => {
        const prop = property as JSONSchema4;

        // Check if this property has a discriminator in its anyOf/oneOf
        if (this.hasDiscriminatorProperty(prop)) {
          // Extract discriminator entries dynamically from the schema
          const discriminatorEntries = this.extractDiscriminatorEntries(prop, key);
          fallbackEntries.push(...discriminatorEntries);
        }
      });
    }

    return fallbackEntries;
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

  private resolveSchemaRef(rootSchema: JSONSchema4, ref: string): JSONSchema4 | null {
    // Handle $ref like "#/$defs/ContextConditionalAgentConfig"
    if (ref.startsWith('#/$defs/')) {
      const defName = ref.replace('#/$defs/', '');
      const defs = (rootSchema as any)['$defs'];
      if (defs && defs[defName]) {
        return defs[defName] as JSONSchema4;
      }
    }
    return null;
  }

  private schemaMatchesNodeType(schema: JSONSchema4, nodeType: string): boolean {
    // Check if the schema title matches the node type
    if (schema.title?.toLowerCase().includes(nodeType.toLowerCase().replace('_', ''))) {
      return true;
    }

    // Check if properties contain identifiers that match the node type
    if (schema.properties?.['module']) {
      const moduleProperty = schema.properties['module'] as JSONSchema4;
      if (moduleProperty['const'] === nodeType || moduleProperty['default'] === nodeType) {
        return true;
      }
    }

    // Special handling for internet providers (brave, perplexity, tavily, google)
    if (nodeType === 'internet' && schema.properties?.['module']) {
      const moduleProperty = schema.properties['module'] as JSONSchema4;
      const internetProviders = ['brave', 'perplexity', 'tavily', 'google'];
      if (internetProviders.includes(moduleProperty['const'] || moduleProperty['default'] || '')) {
        return true;
      }
    }

    // Handle conditional nodes
    if (nodeType.includes('conditional') && schema.title?.toLowerCase().includes('conditional')) {
      return true;
    }

    // Handle conditional nodes with $ref
    if (nodeType.includes('conditional') && schema['$ref']) {
      const ref = schema['$ref'] as string;
      if (ref.toLowerCase().includes('conditional')) {
        return true;
      }
    }

    // Handle exact module matches in $ref
    if (schema['$ref']) {
      const ref = schema['$ref'] as string;
      // Extract the definition name from the $ref
      if (ref.startsWith('#/$defs/')) {
        const defName = ref.replace('#/$defs/', '');
        // Check if the definition name matches the node type pattern
        if (defName.toLowerCase().includes(nodeType.toLowerCase().replace('_', ''))) {
          return true;
        }
      }
    }

    // Handle alinia nodes
    if (
      (nodeType === 'preprocess_alinia' || nodeType === 'postprocess_alinia') &&
      schema.title?.toLowerCase().includes('alinia')
    ) {
      return true;
    }

    return false;
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
        fallbackEntries.push(...newEntries);
      } else if (
        key.toLowerCase().includes('fallback') ||
        key.toLowerCase().includes('else') ||
        key.toLowerCase().includes('alternative')
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
