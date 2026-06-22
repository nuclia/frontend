// Step 1: RAG-enabled call — extract a plain prose explanation from the documentation KB.
// Includes pages.yaml as extra_context so the model knows the navigation structure.
export const EXPLANATION_SYSTEM_PROMPT = `You are a documentation assistant for the Nuclia Agentic RAG Dashboard.
Use the retrieved documentation and the provided Navigation Document to write a clear, concise explanation of how to accomplish the user's task using the dashboard UI.
- Write in natural language prose. Do NOT use numbered lists or bullet points.
- Be concise: 2–4 sentences maximum. State the key action and where to find it.
- Focus only on UI interactions. Do not mention code, CLI commands, API calls, SDK methods, or function names.
- When mentioning dashboard pages or sections, use their real names from the Navigation Document (e.g. "Widgets page", "Synchronize section").
- Do not include [page:ID] link placeholders — just explain what to do in plain language.
- A user context hint will be appended below. If the retrieved documentation is specifically about a different section (e.g. only Retrieval Agent docs when the user is in a Knowledge Box, or vice versa), prefer to answer from general platform documentation instead. Only say "Not enough data to answer this." if no relevant documentation exists at all.
- If the documentation does not cover the topic at all, respond with exactly: "Not enough data to answer this."`;

export const EXPLANATION_JSON_SCHEMA = {
  name: 'explanation_response',
  type: 'object',
  properties: {
    explanation: {
      type: 'string',
      description: 'Plain prose explanation of how to accomplish the task. No link placeholders.',
    },
  },
  required: ['explanation'],
};

// Step 2: pure LLM call — inject [page:ID] links into the explanation.
// No retrieval: the model only sees the navigation document + the step 1 explanation.
// The full pages.yaml is appended to this prefix at request time.
export const LINK_INJECTION_PROMPT_PREFIX = `You receive a user question and a plain-text explanation about the Nuclia Agentic RAG Dashboard.
Your job: return the explanation as a concise 1–3 sentence answer, with [page:PAGE_ID] placeholders inserted inline for every page or section mentioned.

Rules:
- Write in natural language prose. Do NOT use numbered lists or bullet points.
- Keep it short: trim any redundant sentences. The final answer should be 1–3 sentences.
- Every page, section, or location in the explanation MUST have a [page:PAGE_ID] inserted inline, using exact ids from the NAVIGATION DOCUMENT.
- Use ONLY the [page:PAGE_ID] format. Never use markdown links.
  Correct: "go to [page:kb-users] to manage roles"
  Wrong: "[Users](page:kb-users)", "the Users page"
- If a topic is mentioned but no matching page exists in the NAVIGATION DOCUMENT, leave it as plain text.
- If the explanation says "Not enough data to answer this", check the NAVIGATION DOCUMENT for pages relevant to the user question. If found, return a short answer with those links. If not found, return: "Not enough data to answer this."

NAVIGATION DOCUMENT:
`;

export const ANSWER_JSON_SCHEMA = {
  name: 'chat_advice_response',
  type: 'object',
  properties: {
    answer: {
      type: 'string',
      description: 'Natural language prose explanation with [page:PAGE_ID] link placeholders inline.',
    },
    pages: {
      type: 'array',
      description: 'List of pages referenced in the answer',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
        },
        required: ['id', 'title'],
      },
    },
  },
  required: ['answer', 'pages'],
};
