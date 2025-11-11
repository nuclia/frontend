import { Injectable } from '@angular/core';
import { JSONSchema4 } from 'json-schema';
import { WidgetType } from '../../agent-dashboard/workflow/basic-elements/node-form/field-config.service';

interface ExtendedJSONSchema4 extends JSONSchema4 {
  widget?: WidgetType;
}

export interface DriverFieldConfig {
  component: string;
  type: string;
  customKey?: string;
  additionalProps?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class DriverFieldConfigService {
  // Special field mappings by key name for driver forms
  private readonly specialFieldMappings: Record<string, DriverFieldConfig> = {
    // Driver identification fields
    id: { component: 'pa-input', type: 'text', additionalProps: { readonly: true } },
    identifier: { component: 'pa-input', type: 'text', additionalProps: { readonly: false } },
    name: { component: 'pa-input', type: 'text' },
    provider: { component: 'pa-input', type: 'text', additionalProps: { readonly: true } },

    // Database connection fields
    host: { component: 'pa-input', type: 'text' },
    port: { component: 'pa-input', type: 'number' },
    database: { component: 'pa-input', type: 'text' },
    username: { component: 'pa-input', type: 'text' },
    password: { component: 'pa-input', type: 'password' },

    // API configuration fields
    api_key: { component: 'pa-input', type: 'password' },
    api_url: { component: 'pa-input', type: 'url' },
    base_url: { component: 'pa-input', type: 'url' },
    endpoint: { component: 'pa-input', type: 'url' },

    // Nuclia-specific fields
    zone: { component: 'enum-select', type: 'enum' },
    kb_id: { component: 'kb-select', type: 'custom' },

    // MCP fields
    command: { component: 'pa-input', type: 'text' },
    args: { component: 'array-string-field', type: 'array' },
    env: { component: 'key-value-field', type: 'object' },
    headers: { component: 'api-headers-field', type: 'object' },

    // Connection settings
    timeout: { component: 'pa-input', type: 'number' },
    max_retries: { component: 'pa-input', type: 'number' },
    connection_string: { component: 'pa-input', type: 'text' },

    // Search configuration
    max_results: { component: 'pa-input', type: 'number' },
    search_depth: { component: 'enum-select', type: 'enum' },
    include_domains: { component: 'array-string-field', type: 'array' },
    exclude_domains: { component: 'array-string-field', type: 'array' },

    // Boolean options
    ssl: { component: 'pa-toggle', type: 'boolean' },
    verify_ssl: { component: 'pa-toggle', type: 'boolean' },
    use_ssl: { component: 'pa-toggle', type: 'boolean' },
    debug: { component: 'pa-toggle', type: 'boolean' },
  };

  // Type-based mappings for drivers
  private readonly typeComponentMappings: Record<string, DriverFieldConfig> = {
    string: { component: 'pa-input', type: 'text' },
    integer: { component: 'pa-input', type: 'number' },
    number: { component: 'pa-input', type: 'number' },
    boolean: { component: 'pa-toggle', type: 'boolean' },
    array: { component: 'array-string-field', type: 'array' },
    object: { component: 'key-value-field', type: 'object' },
    enum: { component: 'enum-select', type: 'enum' },
    const: { component: 'pa-input', type: 'text', additionalProps: { readonly: true } },
    subform: { component: 'driver-subform-field', type: 'subform' },
    ref: { component: 'driver-subform-field', type: 'subform' },
  };

  getFieldConfig(key: string, property: ExtendedJSONSchema4, schema?: JSONSchema4): DriverFieldConfig {
    if (property.widget) {
      const widgetConfig = this.getConfigFromWidget(property.widget);
      if (widgetConfig) {
        return { ...widgetConfig, customKey: key };
      }
    }

    // Special handling for config field - always treat as subform
    if (key === 'config') {
      return { component: 'subform-field', type: 'subform', customKey: key };
    }

    // Check for special field mappings first
    if (this.specialFieldMappings[key]) {
      return { ...this.specialFieldMappings[key], customKey: key };
    }

    // Special handling for password-like fields
    if (
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('token')
    ) {
      return { component: 'pa-input', type: 'password', customKey: key };
    }

    // Special handling for URL-like fields
    if (
      key.toLowerCase().includes('url') ||
      key.toLowerCase().includes('endpoint') ||
      key.toLowerCase().includes('uri')
    ) {
      return { component: 'pa-input', type: 'url', customKey: key };
    }

    // Determine type and get appropriate component
    const type = this.determineFieldType(property, schema);
    const baseConfig = this.typeComponentMappings[type] || this.typeComponentMappings['string'];
    return { ...baseConfig, customKey: key };
  }

  private determineFieldType(property: ExtendedJSONSchema4, schema?: JSONSchema4): string {
    if (property['const']) return 'const';
    if (property.enum) return 'enum';

    if (property.$ref && schema) {
      // Resolve the $ref and check what type it actually is
      const resolved = this.resolveRef(property.$ref, schema);
      if (resolved) {
        // Check if the resolved schema is an enum
        if (resolved.enum) return 'enum';
        // Check if it has other simple types
        if (resolved.type === 'string' && resolved.enum) return 'enum';
        if (resolved.type && !resolved.properties) return resolved.type;
        // Otherwise treat as subform
        return 'ref';
      }
      // Fallback to subform if can't resolve
      return 'ref';
    }

    if (property.$ref) {
      // Any $ref without schema context should be treated as a subform
      return 'ref';
    }

    if (property.type) {
      // Handle array of types or single type
      const type = Array.isArray(property.type) ? property.type[0] : property.type;
      return type as string;
    }

    if (property.anyOf) {
      // Check if any anyOf contains a $ref (subform)
      const refObj = property.anyOf.find((t: any) => t.$ref);
      if (refObj && refObj.$ref && schema) {
        // Resolve the ref and check if it's an enum
        const resolved = this.resolveRef(refObj.$ref, schema);
        if (resolved?.enum) return 'enum';
        return 'ref';
      }

      if (refObj) {
        return 'ref';
      }

      // Check if it's an array type with references
      const arrayObj = property.anyOf.find((t: any) => t.type === 'array' && t.items?.$ref);
      if (arrayObj) {
        return 'array'; // Keep as array but items might be subforms
      }

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

  private resolveRef(ref: string, schema: JSONSchema4): any {
    // Handle #/$defs/SomeName references
    if (ref.startsWith('#/$defs/')) {
      const defName = ref.replace('#/$defs/', '');
      return schema['$defs']?.[defName] || null;
    }

    return null;
  }

  private resolvePropertyRef(property: ExtendedJSONSchema4, schema: JSONSchema4): JSONSchema4 | null {
    // Direct $ref
    if (property.$ref) {
      return this.resolveRef(property.$ref, schema);
    }

    // anyOf containing $ref
    if (property.anyOf) {
      const refObj = property.anyOf.find((item: any) => item.$ref);
      if (refObj && refObj.$ref) {
        return this.resolveRef(refObj.$ref, schema);
      }
    }

    return null;
  }

  isFieldIgnored(key: string, property: ExtendedJSONSchema4): boolean {
    if (property?.widget === WidgetType.NOT_SHOW) {
      return true;
    }

    // Hide id and identifier fields as requested
    const ignoredFields = new Set([
      'id', // Hide id field
      'identifier', // Hide identifier field
      'type', // Schema type metadata
    ]);

    return ignoredFields.has(key);
  }

  isSubformField(property: ExtendedJSONSchema4, schema?: JSONSchema4): boolean {
    // If we can resolve the $ref, check what it actually points to
    if (schema) {
      const resolvedProperty = this.resolvePropertyRef(property, schema);
      if (resolvedProperty && resolvedProperty !== property) {
        // If it's an enum, it's not a subform
        if (resolvedProperty.enum) {
          return false;
        }

        // If it has simple type like string, number, etc., it's not a subform
        if (resolvedProperty.type && resolvedProperty.type !== 'object') {
          return false;
        }
      }
    }

    // Direct $ref without schema context - assume it's a subform
    if (property.$ref) {
      return true;
    }

    // anyOf containing $ref
    if (property.anyOf) {
      const hasRef = property.anyOf.some((item: any) => item.$ref);
      return hasRef;
    }

    return false;
  }

  getRefFromProperty(property: ExtendedJSONSchema4): string | null {
    // Direct $ref
    if (property.$ref) return property.$ref;

    // anyOf containing $ref
    if (property.anyOf) {
      const refObj = property.anyOf.find((item: any) => item.$ref);
      return refObj?.$ref || null;
    }

    return null;
  }

  private getConfigFromWidget(widget: WidgetType | string): DriverFieldConfig | null {
    const widgetMappings: Partial<Record<WidgetType, DriverFieldConfig>> = {
      [WidgetType.ARRAY_STRING_FIELD]: { component: 'array-string-field', type: 'array' },
      [WidgetType.ENUM_SELECT]: { component: 'enum-select', type: 'enum' },
      [WidgetType.EXPANDABLE_TEXTAREA]: {
        component: 'expandable-textarea',
        type: 'custom',
        additionalProps: {
          rows: 2,
          resizable: true,
        },
      },
      [WidgetType.KEY_VALUE_FIELD]: { component: 'key-value-field', type: 'object' },
      [WidgetType.API_HEADERS_FIELD]: { component: 'api-headers-field', type: 'object' },
    };

    const widgetKey = widget as WidgetType;
    return widgetMappings[widgetKey] ?? null;
  }
}
