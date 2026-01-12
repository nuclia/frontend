import { Injectable } from '@angular/core';
import { JSONSchema4 } from 'json-schema';

export enum WidgetType {
  ARRAY_STRING_FIELD = 'array_string_field',
  CODE_EDITOR = 'code_editor',
  DRIVER_SELECT = 'driver_select',
  ENUM_SELECT = 'enum_select',
  EXPANDABLE_TEXTAREA = 'expandable_textarea',
  API_HEADERS_FIELD = 'api_headers_field',
  FILTERED_SOURCE_SELECT = 'filtered_source_select',
  KEY_VALUE_FIELD = 'key_value_field',
  LLM_SELECT = 'llm_select', // Temporary alias
  MODEL_SELECT = 'model_select',
  RULES_FIELD = 'rules_field',
  TRANSPORT_FIELD = 'transport_field',
  NOT_SHOW = 'not_show', // Used to hide fields
}

// Extend JSONSchema4 to include the widget property
interface ExtendedJSONSchema4 extends JSONSchema4 {
  /**
   * Override to specify a custom widget/component for rendering this field.
   */
  widget?: WidgetType;
}

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
  // @deprecated -> {getConfigFromWidget} Property `widget` in schema should be used instead
  private readonly specialFieldMappings: Record<string, FieldConfig> = {
    rules: { component: 'rules-field', type: 'custom' },
    transport: { component: 'transport-field', type: 'custom' },
    roots: { component: 'key-value-field', type: 'custom' },
    // TODOs
    labels: { component: 'custom-placeholder', type: 'custom' },
    rids: { component: 'custom-placeholder', type: 'custom' },
    detection_config: { component: 'custom-placeholder', type: 'custom' },
    // Driver selection fields
    source: { component: 'filtered-source-select', type: 'custom' },
    cypher: { component: 'driver-select', type: 'custom', additionalProps: { provider: 'cypher' } },
    kb: { component: 'driver-select', type: 'custom', additionalProps: { provider: 'nucliadb' } },
    provider: { component: 'driver-select', type: 'custom', additionalProps: { provider: 'alinia' } },
    sources: {
      component: 'driver-select',
      type: 'custom',
      additionalProps: { provider: 'nucliadb', multiselect: true },
    },
    // Model selection fields
    conversion_model: { component: 'model-select', type: 'custom' },
    generative_model: { component: 'model-select', type: 'custom' },
    model: { component: 'model-select', type: 'custom' },
    rephrase_model: { component: 'model-select', type: 'custom' },
    sampling_model: { component: 'model-select', type: 'custom' },
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
    prompt: {
      component: 'expandable-textarea',
      type: 'custom',
      additionalProps: {
        rows: 2,
        resizable: true,
      },
    },
    parameters: { component: 'key-value-field', type: 'custom' },
    provided_synonyms: { component: 'synonyms-field', type: 'custom' },
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

  /**
   * Gets the field configuration for rendering a form field.
   * Priority order:
   * 1. Widget property in schema (highest priority)
   * 2. Special field mappings by key name
   * 3. Source component overrides
   * 4. Type-based mappings (default)
   */
  getFieldConfig(key: string, property: ExtendedJSONSchema4, schema?: JSONSchema4): FieldConfig {
    // Check for widget property in schema first - this takes highest priority
    if (property.widget) {
      const widgetConfig = this.getConfigFromWidget(property.widget);
      if (widgetConfig) {
        return { ...widgetConfig, customKey: key };
      }
    }

    // Check for special field mappings
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

  /**
   * Maps widget names from schema to field configurations.
   * This allows schemas to specify which component to use via the 'widget' property.
   */
  private getConfigFromWidget(widget: string): FieldConfig | null {
    // Map widget names to their corresponding field configurations
    const widgetMappings: Record<string, FieldConfig> = {
      // Temporary alias for `model_select`
      llm_select: { component: 'model-select', type: 'custom' },
      model_select: { component: 'model-select', type: 'custom' },
      driver_select: { component: 'driver-select', type: 'custom' },
      filtered_source_select: { component: 'filtered-source-select', type: 'custom' },
      api_headers_field: { component: 'api-headers-field', type: 'custom' },
      code_editor: {
        component: 'code-editor',
        type: 'custom',
        additionalProps: {
          initialLanguage: 'python',
          availableLanguages: ['python'],
          showLanguageSelector: true,
        },
      },
      expandable_textarea: {
        component: 'expandable-textarea',
        type: 'custom',
        additionalProps: {
          rows: 2,
          resizable: true,
        },
      },
      transport_field: { component: 'transport-field', type: 'custom' },
      rules_field: { component: 'rules-field', type: 'custom' },
      key_value_field: { component: 'key-value-field', type: 'custom' },
      array_string_field: { component: 'array-string-field', type: 'array' },
      enum_select: { component: 'enum-select', type: 'enum' },
      synonyms_field: { component: 'synonyms-field', type: 'custom' },
    };

    return widgetMappings[widget] || null;
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

    // @deprecated -> {isFieldIgnored} Used in property schema to define visibility.
    const ignoredFields = new Set(['type', 'id', 'module', 'title', 'fallback', 'next_agent']);
    return (
      ignoredFields.has(key) ||
      // Ignore fields that are pointers to new agents.
      !!property?.title?.includes?.('IF agents') ||
      !!property?.title?.includes?.('Else agents') ||
      // Ignore fields that are pointers to new agents.
      !!(property?.items as any)?.discriminator
    );
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
}
