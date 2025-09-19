import { Injectable } from '@angular/core';
import { JSONSchema4 } from 'json-schema';

export interface FieldConfig {
  component: string;
  type: string;
  customKey?: string;
  additionalProps?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class FieldConfigService {
  // Special field mappings by key name
  private readonly specialFieldMappings: Record<string, FieldConfig> = {
    rules: { component: 'rules-field', type: 'custom' },
    model: { component: 'model-select', type: 'custom' },
    summarize_model: { component: 'model-select', type: 'custom' },
    tool_choice_model: { component: 'model-select', type: 'custom' },
    kb: { component: 'driver-select', type: 'custom', additionalProps: { provider: 'nucliadb' } },
    labels: { component: 'custom-placeholder', type: 'custom' },
    rids: { component: 'custom-placeholder', type: 'custom' },
  };

  // Type-based mappings
  private readonly typeComponentMappings: Record<string, FieldConfig> = {
    string: { component: 'pa-input', type: 'text' },
    boolean: { component: 'pa-toggle', type: 'boolean' },
    array: { component: 'array-string-field', type: 'array' },
    enum: { component: 'enum-select', type: 'enum' },
    const: { component: 'pa-input', type: 'text', additionalProps: { readonly: true } },
  };

  getFieldConfig(key: string, property: JSONSchema4): FieldConfig {
    // Check for special field mappings first
    if (this.specialFieldMappings[key]) {
      return { ...this.specialFieldMappings[key], customKey: key };
    }

    // Determine type and get appropriate component
    const type = this.determineFieldType(property);
    return this.typeComponentMappings[type] || this.typeComponentMappings['string'];
  }

  private determineFieldType(property: JSONSchema4): string {
    if (property['const']) return 'const';
    if (property.enum) return 'enum';
    if (property.$ref) {
      // Resolve the $ref to determine the actual type
      // This would need schema context, for now return string
      return 'string';
    }
    if (property.type) {
      // Handle array of types or single type
      const type = Array.isArray(property.type) ? property.type[0] : property.type;
      return type as string;
    }
    if (property.anyOf) {
      // Prefer first non-null type
      const typeObj = property.anyOf.find((t: any) => t.type && t.type !== 'null');
      if (typeObj && typeObj.type) {
        const type = Array.isArray(typeObj.type) ? typeObj.type[0] : typeObj.type;
        if (type === 'array' && typeObj.items) {
          return 'array';
        }
        return type as string;
      }
    }
    return 'string';
  }

  isFieldIgnored(key: string, property: JSONSchema4): boolean {
    const ignoredFields = new Set(['type', 'id', 'module', 'title']);
    return ignoredFields.has(key) || !!property?.title?.includes?.('agent');
  }
}
