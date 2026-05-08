import ReactDOM from 'react-dom/client';
import { type RaoWidgetProps, RaoWrapper } from './RaoWrapper';

export const normalizeAttribute = (attribute: string) => {
  return attribute.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

class RaoWebComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const props = this.getPropsFromAttributes<RaoWidgetProps>();
    const root = ReactDOM.createRoot(this.shadowRoot as ShadowRoot);
    root.render(<RaoWrapper {...props} />);
  }

  private getPropsFromAttributes<T>(): T {
    const props: Record<string, string> = {};

    for (const attribute of this.attributes) {
      props[normalizeAttribute(attribute.name)] = attribute.value;
    }

    return props as T;
  }
}

export default RaoWebComponent;
