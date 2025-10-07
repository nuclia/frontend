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
    transport: { component: 'transport-field', type: 'custom' },
    roots: { component: 'key-value-field', type: 'custom' },
    // TODOs
    labels: { component: 'custom-placeholder', type: 'custom' },
    rids: { component: 'custom-placeholder', type: 'custom' },
    detection_config: { component: 'custom-placeholder', type: 'custom' },
    // Driver selection fields
    source: { component: 'mcp-source-select', type: 'custom' },
    cypher: { component: 'driver-select', type: 'custom', additionalProps: { provider: 'cypher' } },
    kb: { component: 'driver-select', type: 'custom', additionalProps: { provider: 'nucliadb' } },
    provider: { component: 'driver-select', type: 'custom', additionalProps: { provider: 'alinia' } },
    sources: {
      component: 'driver-select',
      type: 'custom',
      additionalProps: { provider: 'nucliadb', multiselect: true },
    },
    // Model selection fields
    model: { component: 'model-select', type: 'custom' },
    generative_model: { component: 'model-select', type: 'custom' },
    summarize_model: { component: 'model-select', type: 'custom' },
    tool_choice_model: { component: 'model-select', type: 'custom' },
    // Basic fields
    code: {
      component: 'code-editor',
      type: 'custom',
      additionalProps: {
        initialLanguage: 'python',
        availableLanguages: ['python'],
        showLanguageSelector: true,
      },
    },
  };

  // Source mappings
  private readonly sourceComponentOverride = (
    key: string,
    title: string,
  ): {
    isOverride: boolean;
    config?: FieldConfig;
  } => {
    const lookupKey = key.toLowerCase() + '-' + title.toLowerCase();
    const mapping: Record<string, FieldConfig> = {
      'source-source': { component: 'driver-select', type: 'custom', additionalProps: { provider: 'alinia' } },
    };

    return {
      isOverride: !!mapping[lookupKey],
      config: mapping[lookupKey],
    };
  };

  // Type-based mappings
  private readonly typeComponentMappings: Record<string, FieldConfig> = {
    string: { component: 'pa-input', type: 'text' },
    boolean: { component: 'pa-toggle', type: 'boolean' },
    array: { component: 'array-string-field', type: 'array' },
    enum: { component: 'enum-select', type: 'enum' },
    const: { component: 'pa-input', type: 'text', additionalProps: { readonly: true } },
    subform: { component: 'subform-field', type: 'subform' },
    ref: { component: 'subform-field', type: 'subform' },
  };

  getFieldConfig(key: string, property: JSONSchema4, schema?: JSONSchema4): FieldConfig {
    // Check for special field mappings first
    if (this.specialFieldMappings[key]) {
      return { ...this.specialFieldMappings[key], customKey: key };
    }

    const sourceOverride = this.sourceComponentOverride(key, property.title || '');
    if (sourceOverride.isOverride && sourceOverride.config) {
      return { ...sourceOverride.config, customKey: key };
    }

    // Determine type and get appropriate component
    const type = this.determineFieldType(property, schema);
    return this.typeComponentMappings[type] || this.typeComponentMappings['string'];
  }

  private determineFieldType(property: JSONSchema4, schema?: JSONSchema4): string {
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

  private resolvePropertyRef(property: JSONSchema4, schema: JSONSchema4): JSONSchema4 | null {
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

  isFieldIgnored(key: string, property: JSONSchema4): boolean {
    const ignoredFields = new Set(['type', 'id', 'module', 'title', 'fallback']);
    return (
      ignoredFields.has(key) ||
      // Ignore fields that are pointers to new agents.
      !!property?.title?.includes?.('agent') ||
      // Ignore fields that are pointers to new agents.
      !!(property?.items as any)?.discriminator
    );
  }

  isSubformField(property: JSONSchema4, schema?: JSONSchema4): boolean {
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

  getRefFromProperty(property: JSONSchema4): string | null {
    // Direct $ref
    if (property.$ref) return property.$ref;

    // anyOf containing $ref
    if (property.anyOf) {
      const refObj = property.anyOf.find((item: any) => item.$ref);
      return refObj?.$ref || null;
    }

    return null;
  }
}
