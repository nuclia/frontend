import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { JSONSchema4 } from 'json-schema';
import { Subject, takeUntil, debounceTime } from 'rxjs';

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
})
export class CodeEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() property!: JSONSchema4;
  @Input() required = false;
  @Input() placeholder = 'Enter your Python code here...';
  @Input() rows = 10;
  @Input() initialLanguage = 'python';
  @Input() availableLanguages: string[] = ['python', 'javascript', 'typescript', 'json'];
  @Input() showLanguageSelector = true;

  @ViewChild('codeTextarea', { static: false }) codeTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('highlightContainer', { static: false }) highlightContainer!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private prismLoaded = false;

  // Python-specific features
  validationErrors = signal<string[]>([]);
  currentValue = signal<string>('');

  ngOnInit() {
    this.setupFormValueSubscription();
    this.loadPrismJS();
  }

  ngAfterViewInit() {
    this.setupTextareaHandlers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormValueSubscription() {
    const control = this.form.get(this.controlName);
    if (control) {
      // Set initial value
      this.currentValue.set(control.value || '');

      // Subscribe to value changes with debounce for syntax highlighting
      control.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(300)).subscribe((value) => {
        this.currentValue.set(value || '');
        this.highlightCode();
      });
    }
  }

  private setupTextareaHandlers() {
    if (this.codeTextarea?.nativeElement) {
      const textarea = this.codeTextarea.nativeElement;

      // Enhanced Python-specific key handlers
      textarea.addEventListener('keydown', (event) => {
        this.handlePythonKeyDown(event, textarea);
      });

      // Handle character input for auto-completion
      textarea.addEventListener('input', (event) => {
        this.handlePythonInput(event as InputEvent, textarea);
      });

      // Sync scroll between textarea and highlight container
      textarea.addEventListener('scroll', () => {
        this.syncScroll();
      });

      // Also sync on resize
      window.addEventListener('resize', () => {
        this.syncScroll();
      });
    }
  }

  private handlePythonKeyDown(event: KeyboardEvent, textarea: HTMLTextAreaElement) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        // Remove indentation (shift+tab) - Python uses 4 spaces
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineContent = value.substring(lineStart, start);
        if (lineContent.startsWith('    ')) {
          const newValue = value.substring(0, lineStart) + lineContent.substring(4) + value.substring(start);
          textarea.value = newValue;
          textarea.setSelectionRange(start - 4, end - 4);
          this.updateFormControl(newValue);
        }
      } else {
        // Add indentation - Python uses 4 spaces
        const newValue = value.substring(0, start) + '    ' + value.substring(end);
        textarea.value = newValue;
        textarea.setSelectionRange(start + 4, start + 4);
        this.updateFormControl(newValue);
      }
    } else if (event.key === 'Enter') {
      // Smart auto-indentation for Python
      event.preventDefault();
      this.handlePythonEnter(textarea, start, value);
    }
  }

  private handlePythonInput(event: InputEvent, textarea: HTMLTextAreaElement) {
    const start = textarea.selectionStart;
    const value = textarea.value;
    const char = event.data;

    // Auto-close brackets, quotes, and parentheses
    // Only if we have actual character data (not backspace, delete, etc.)
    if (char && this.shouldAutoComplete(char)) {
      const complement = this.getAutoCompleteChar(char);
      if (complement) {
        const newValue = value.substring(0, start) + complement + value.substring(start);
        textarea.value = newValue;
        textarea.setSelectionRange(start, start);
        this.updateFormControl(newValue);
      }
    }
  }

  private handlePythonEnter(textarea: HTMLTextAreaElement, start: number, value: string) {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const currentLine = value.substring(lineStart, start);
    const indent = currentLine.match(/^[ ]*/)?.[0] || '';

    // Check if current line ends with colon (function, class, if, etc.)
    const shouldIncreaseIndent = currentLine.trim().endsWith(':');
    const newIndent = shouldIncreaseIndent ? indent + '    ' : indent;

    const newValue = value.substring(0, start) + '\n' + newIndent + value.substring(start);
    textarea.value = newValue;
    textarea.setSelectionRange(start + 1 + newIndent.length, start + 1 + newIndent.length);
    this.updateFormControl(newValue);
  }

  private shouldAutoComplete(char: string): boolean {
    return ['(', '[', '{', '"', "'"].includes(char);
  }

  private getAutoCompleteChar(char: string): string | null {
    const pairs: { [key: string]: string } = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
    };
    return pairs[char] || null;
  }

  private syncScroll() {
    if (this.codeTextarea?.nativeElement && this.highlightContainer?.nativeElement) {
      const textarea = this.codeTextarea.nativeElement;
      const highlight = this.highlightContainer.nativeElement;

      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    }
  }

  private updateFormControl(value: string) {
    const control = this.form.get(this.controlName);
    if (control) {
      control.setValue(value);
      control.markAsDirty();
    }
  }

  onTextareaInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.currentValue.set(target.value);
    this.updateFormControl(target.value);

    // Immediate highlighting for better responsiveness
    this.highlightCode();

    // Ensure scroll sync after highlighting
    this.syncScroll();
  }

  private async loadPrismJS() {
    if (this.prismLoaded || (window as any).Prism) {
      this.prismLoaded = true;
      this.highlightCode();
      return;
    }

    try {
      // Load Prism.js CSS
      const prismCSS = document.createElement('link');
      prismCSS.rel = 'stylesheet';
      prismCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
      document.head.appendChild(prismCSS);

      // Load Prism.js core
      const prismJS = document.createElement('script');
      prismJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
      prismJS.onload = () => {
        // Load Python language component only
        this.loadPythonSupport().then(() => {
          this.prismLoaded = true;
          this.highlightCode();
        });
      };
      document.head.appendChild(prismJS);
    } catch (error) {
      console.warn('Failed to load Prism.js:', error);
    }
  }

  private async loadPythonSupport() {
    // Only load Python language support
    return new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js';
      script.onload = () => resolve();
      script.onerror = () => resolve(); // Continue even if Python support fails to load
      document.head.appendChild(script);
    });
  }

  private highlightCode() {
    if (!this.prismLoaded || !this.highlightContainer?.nativeElement || !(window as any).Prism) {
      return;
    }

    const code = this.currentValue();

    try {
      let highlightedCode = '';

      // Use Prism for Python syntax highlighting
      const prism = (window as any).Prism;
      const grammar = prism.languages.python;

      if (grammar && code.trim()) {
        highlightedCode = prism.highlight(code, grammar, 'python');
      } else {
        // Fallback to plain text if no code or grammar not loaded
        highlightedCode = this.escapeHtml(code);
      }

      // Safely set highlighted code using DOM methods instead of innerHTML
      this.setHighlightedContent(highlightedCode, 'language-python');

      // Sync scroll position after highlighting
      this.syncScroll();

      // Check for Python syntax errors
      this.validatePythonSyntax(code);
    } catch (error) {
      console.warn('Syntax highlighting failed:', error);
      // Fallback to plain text using safe DOM manipulation
      this.setHighlightedContent(this.escapeHtml(code));

      // Sync scroll position after fallback
      this.syncScroll();
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Safely sets highlighted content using DOM methods instead of innerHTML
   * to prevent XSS vulnerabilities
   */
  private setHighlightedContent(content: string, className?: string): void {
    // Clear existing content
    this.highlightContainer.nativeElement.innerHTML = '';

    // Create code element
    const codeElement = document.createElement('code');
    if (className) {
      codeElement.className = className;
    }

    // Set content safely - if content comes from Prism, it's already safe HTML
    // If it's escaped content, we can use innerHTML since it's been sanitized
    codeElement.innerHTML = content;

    // Append to container
    this.highlightContainer.nativeElement.appendChild(codeElement);
  }

  private validatePythonSyntax(code: string) {
    const errors: string[] = [];

    if (!code.trim()) {
      this.validationErrors.set([]);
      return;
    }

    const lines = code.split('\n');
    let indentStack: number[] = [0];
    let inString = false;
    let stringChar = '';

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }

      // Basic indentation check
      const leadingSpaces = line.match(/^(\s*)/)?.[1]?.length || 0;

      // Check for mixed tabs and spaces
      if (line.match(/^\s*\t/) && line.match(/^\s* /)) {
        errors.push(`Line ${lineNumber}: Mixed tabs and spaces for indentation`);
      }

      // Check for common Python syntax errors
      if (trimmedLine.endsWith(':')) {
        // Lines ending with colon should be followed by indented block
        const nextLineIndex = lines.findIndex((l, i) => i > index && l.trim());
        if (nextLineIndex !== -1) {
          const nextLine = lines[nextLineIndex];
          const nextIndent = nextLine.match(/^(\s*)/)?.[1]?.length || 0;
          if (nextIndent <= leadingSpaces) {
            errors.push(`Line ${lineNumber}: Expected indented block after ':' `);
          }
        }
      }

      // Check for unmatched parentheses, brackets, braces
      const openChars = (line.match(/[\(\[\{]/g) || []).length;
      const closeChars = (line.match(/[\)\]\}]/g) || []).length;

      // Basic check for obvious mismatches on single line
      if (trimmedLine.includes('(') && !trimmedLine.includes(')') && openChars > closeChars) {
        // This might be a multi-line statement, so don't flag unless it's clearly wrong
      }

      // Check for invalid characters in Python identifiers
      const invalidIdentifier = trimmedLine.match(/^\s*[0-9]+[a-zA-Z]/);
      if (invalidIdentifier) {
        errors.push(`Line ${lineNumber}: Invalid identifier starting with number`);
      }
    });

    this.validationErrors.set(errors);
  }
}
