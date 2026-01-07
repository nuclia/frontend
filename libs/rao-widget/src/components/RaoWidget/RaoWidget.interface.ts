export type EViewType = 'conversation' | 'floating';

export interface IResources {
  aria_openchat: string;
  aria_collapsechat: string;
  aria_expandchat: string;
  aria_closechat: string;
  aria_suggestedprompts: string;
  aria_addprompt: string;
  aria_notsupported: string;
  aria_stoprecording: string;
  aria_startrecording: string;

  intro_title: string;
  intro_greetings: string;

  form_placeholder_default: string;
  form_placeholder_followup: string;

  meta_page: string;
  meta_jumpto: string;
  meta_citation: string;
  meta_reference: string;
  meta_source: string;
  meta_unexpectedissue: string;
  meta_step: string;
  meta_agent: string;
  meta_duration: string;
  meta_inputtokens: string;
  meta_outputtokens: string;
  meta_context: string;
  meta_contextgathered: string;
  meta_supportingevidence: string;
  meta_questionanalysed: string;
  meta_evidence: string;
  meta_sources: string;
  meta_citations: string;
  meta_reasoning: string;
  meta_agentrequest: string;
  feedback_choose: string;
  feedback_sending: string;
  feedback_sent: string;
  feedback_error: string;
  feedback_selected: string;
}

export interface IRaoWidget {
  /**
   * Configuration for prompts displayed in the widget.
   */
  promptconfig?: {
    /**
     * List of visible prompts for first time users.
     */
    prompts: string[];
    /**
     * If true, use fallback prompts when no prompts are provided
     * @default false
     */
    usefallbackprompts?: boolean;
    /**
     * Number of visible prompts.
     * @default 4
     */
    visibleprompts?: number;
  };

  /**
   * Configuration for voice recording capabilities.
   */
  recordingconfig?: {
    /**
     * Locale/language for speech recognition.
     */
    language: string;
  };

  /**
   * Resource labels to be used as text replacement in the widget.
   */
  resources?: Partial<IResources>;

  /**
   * Type of view to display the widget in.
   * @default 'conversation'
   */
  viewtype?: EViewType;

  /**
   * @private
   */
  onFloatingOpen?: () => void;
  /**
   * @private
   */
  onFloatingClose?: () => void;
}
