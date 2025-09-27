# Code Editor Component

A multiline code editor component with syntax highlighting and language### Inputs

- `form: FormGroup` - The reactive form group
- `controlName: string` - Name of the form control
- `label: string` - Display label for the editor
- `property: JSONSchema4` - JSON schema property definition
- `required?: boolean` - Whether the field is required (default: false)
- `placeholder?: string` - Placeholder text for the editor
- `rows?: number` - Number of visible rows (default: 10)
- `showLanguageSelector?: boolean` - Show language dropdown (default: false)
- `initialLanguage?: string` - Initial language to select (default: 'javascript')
- `availableLanguages?: string[]` - Limit available languages (default: all supported) that follows the same patterns as other form subcomponents.

## Features

- **Language Selection**: Supports 20+ programming languages including JavaScript, TypeScript, Python, Java, C#, SQL, JSON, YAML, and more
- **Syntax Highlighting**: Uses Prism.js for beautiful code highlighting with VS Code-like themes
- **Smart Indentation**: Tab/Shift+Tab for indentation control
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Works well on all screen sizes with proper mobile support
- **Theme Support**: Automatic dark/light theme detection and high contrast mode
- **Form Integration**: Seamless integration with Angular Reactive Forms

## Usage

```typescript
// Basic usage with language selector
<app-code-editor
  [form]="yourForm"
  controlName="codeField"
  label="Code Editor"
  [property]="jsonSchemaProperty"
  [required]="true"
  placeholder="Enter your code here..."
  [rows]="15"
  [showLanguageSelector]="true">
</app-code-editor>

// Python-only editor (no language selector)
<app-code-editor
  [form]="yourForm"
  controlName="pythonCode"
  label="Python Code"
  [property]="jsonSchemaProperty"
  [required]="true"
  placeholder="Enter your Python code here..."
  [rows]="20"
  [showLanguageSelector]="false"
  initialLanguage="python"
  [availableLanguages]="['python']">
</app-code-editor>

// Limited language options
<app-code-editor
  [form]="yourForm"
  controlName="webCode"
  label="Web Code"
  [property]="jsonSchemaProperty"
  [required]="false"
  placeholder="Enter your web code here..."
  [rows]="15"
  [showLanguageSelector]="true"
  initialLanguage="javascript"
  [availableLanguages]="['javascript', 'typescript', 'html', 'css']">
</app-code-editor>
```

## Field Configuration Examples

In the `field-config.service.ts`, you can configure different field behaviors:

```typescript
// Default code editor with Python as initial language
code: {
  component: 'code-editor',
  type: 'custom',
  additionalProps: {
    initialLanguage: 'python',
    showLanguageSelector: true
  }
},

// Python-only editor (restricted)
python_code: {
  component: 'code-editor',
  type: 'custom',
  additionalProps: {
    initialLanguage: 'python',
    availableLanguages: ['python'],
    showLanguageSelector: false
  }
},

// Multi-language editor with specific options
web_code: {
  component: 'code-editor',
  type: 'custom',
  additionalProps: {
    initialLanguage: 'javascript',
    availableLanguages: ['javascript', 'typescript', 'html', 'css', 'json'],
    showLanguageSelector: true
  }
}
```

## API

### Inputs

- `form: FormGroup` - The reactive form group
- `controlName: string` - Name of the form control
- `label: string` - Display label for the editor
- `property: JSONSchema4` - JSON schema property definition
- `required?: boolean` - Whether the field is required (default: false)
- `placeholder?: string` - Placeholder text for the editor
- `rows?: number` - Number of visible rows (default: 10)
- `showLanguageSelector?: boolean` - Show language dropdown (default: false)

### Supported Languages

JavaScript, TypeScript, Python, Java, C#, C++, PHP, Ruby, Go, Rust, SQL, JSON, YAML, XML, HTML, CSS, Bash, PowerShell, Markdown, Plain Text

## Implementation Details

- Uses Prism.js CDN for syntax highlighting (lightweight, no build dependencies)
- Debounced syntax highlighting for performance
- Overlay technique for highlighting while maintaining native textarea behavior
- Automatic scroll synchronization between input and highlight layers
- Smart tab handling for code indentation
- Lazy loading of language components

## Accessibility

- Full keyboard navigation
- Screen reader compatible
- High contrast mode support
- Proper ARIA labels and roles
- Focus management
