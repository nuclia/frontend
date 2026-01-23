export namespace Memory {
  // Memory Models converted from Python Pydantic models

  export interface Metadata {
    // TODO: Define based on actual usage
  }

  export interface KnowledgeGraph {
    // TODO: Define based on actual usage
  }

  export interface Reason {
    // TODO: Define based on actual usage
  }

  export interface NucliaDBMemoryConfig {
    key?: string | null;
    url: string;
    kbid: string;
    internal: boolean;
  }

  export interface MemoryConfig {
    nucliadb?: NucliaDBMemoryConfig | null;
  }

  export interface Rule {
    prompt?: string | null;
  }

  export interface Rules {
    rules: (Rule | string)[];
  }

  export interface Facets {
    chunks: Record<string, number>;
    fields: Record<string, number>;
  }

  export interface Source {
    id: string;
    description: string;
    labels: Record<string, string[]>;
    facets_native: any; // CatalogFacetsResponse - TODO: Define this type when available
    paragraph_facets: Record<string, number>;
    learning_configuration: any; // StoredLearningConfiguration - TODO: Define this type when available
  }

  export interface Answer {
    answer: string;
    original_question_uuid?: string | null;
    actual_question_uuid?: string | null;
    module: string;
    agent_path: string;
  }

  export interface Citations {
    metadata: {
      [block: string]: {
        context_id: string;
        origin_urls: string[];
      };
    };
  }

  export interface Step {
    original_question_uuid?: string | null;
    actual_question_uuid?: string | null;
    module: string;
    title: string;
    value?: string | null;
    agent_path: string;
    reason?: string | null;
    timeit: number;
    input_nuclia_tokens?: number | null;
    output_nuclia_tokens?: number | null;
    error?: string | null;
  }

  export interface ChunkImages {
    table?: string | null;
    chunk?: string | null;
    page?: string | null;
  }

  // Field types union - TODO: Define specific field data interfaces when available
  export type FieldTypes =
    | any // TextFieldData
    | any // ConversationFieldData
    | any // FileFieldData
    | any // LinkFieldData
    | any; // GenericFieldData

  export interface Chunk {
    chunk_id: string;
    title?: string | null;
    source?: string | null;
    text: string;
    labels: string[];
    url: string[];
    metadata?: { [key: string]: any } | null;
    action?: string | null;
    origin_url?: string | null;
  }

  export interface Context {
    id: string;
    actual_question_uuid?: string | null;
    agent: string;
    chunks: Chunk[];
    citations: string[] | null;
    images: Record<string, any>; // Image type - TODO: Define this type when available
    missing?: string | null;
    original_question_uuid?: string | null;
    question: string;
    source: string;
    structured: string[];
    summary: string;
    title?: string | null;
    agent_id: string;
  }

  export interface HistoryQuestionAnswer {
    question: string;
    answer: string;
  }

  // Utility functions (equivalent to Python methods)
  export class StepUtils {
    static toString(step: Step): string {
      return `(${step.timeit}) ${step.module}: ${step.title} - ${step.value} : ${step.reason} (${step.input_nuclia_tokens}:${step.output_nuclia_tokens})`;
    }

    static toMarkdown(step: Step): string {
      return `
## ${step.title}

${step.value}

- reason: ${step.reason}
- timeit: ${step.timeit}
- input_tokens: ${step.input_nuclia_tokens}
- output_tokens: ${step.output_nuclia_tokens}
`;
    }
  }

  export class ChunkUtils {
    static render(chunk: Chunk): string {
      const title = chunk.title || chunk.chunk_id;
      const urls = chunk.url.join(', ');
      return `## Chunk: ${title}\n Tags: ${JSON.stringify(chunk.labels)}\n URLs: ${urls} \n\`\`\` ${
        chunk.text
      } \`\`\` \n`;
    }
  }

  export class ContextUtils {
    static context(context: Context): string {
      return `# ${context.question}\n\n ${context.summary}`;
    }

    static contextMarkdown(context: Context): string {
      let result = '';

      // Render chunks
      context.chunks.forEach((chunk) => {
        result += ChunkUtils.render(chunk);
      });

      // Add structured info if available
      if (context.structured.length > 0) {
        result += '\n## Extra structured info:\n';
        context.structured.forEach((structured) => {
          result += structured + '\n';
        });
      }

      return result;
    }

    static stats(context: Context): Record<string, any> {
      return {
        chunks: context.chunks.length,
        images: Object.keys(context.images).length,
        structured: context.structured.length,
        source: context.source,
        question: context.question,
        agent: context.agent,
        summary: context.summary,
        title: context.title,
        missing: context.missing,
      };
    }
  }
}
