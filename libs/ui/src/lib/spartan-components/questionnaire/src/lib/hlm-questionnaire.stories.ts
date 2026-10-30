import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmQuestionnaireImports } from '../index';
import { HlmQuestionnaire } from './hlm-questionnaire';

interface QuestionnaireStoryArgs {
  shortcuts: 'letters' | 'numbers' | null;
  noValidate: boolean;
}

const meta: Meta<QuestionnaireStoryArgs> = {
  title: 'Spartan/Questionnaire',
  component: HlmQuestionnaire,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmQuestionnaireImports] })],
  parameters: {
    docs: {
      description: {
        component: `Guides users through a series of questions with choices or freeform answers. Use it for onboarding, preference gathering, or guided requests where one question at a time keeps the task focused.
Import <code>HlmQuestionnaireImports</code> from <code>@nuclia/ui-spartan/questionnaire</code> and put one <code>fieldset[hlmQuestionnaireItem]</code> per question inside a <code>form[hlmQuestionnaire]</code>. Only the active item is displayed; the others are hidden and inert.

Each item needs a unique <code>name</code> and is composed of a <code>legend[hlmQuestionnaireTitle]</code>, an optional <code>hlmQuestionnaireDescription</code>, and either <code>hlmQuestionnaireChoices</code> containing <code>label[hlmQuestionnaireChoice]</code> elements (radio by default, checkboxes with <code>multiple</code>) or an <code>input[hlmQuestionnaireInput]</code>. Mark an item <code>required</code> to block Next and hide Skip, and add <code>hlmQuestionnaireError</code> to show validation feedback.
Navigation is built from <code>hlmQuestionnaireProgress</code> and an <code>hlmQuestionnaireActions</code> bar with <code>hlmQuestionnairePrevious</code>, <code>hlmQuestionnaireSkip</code>, <code>hlmQuestionnaireNext</code> and <code>hlmQuestionnaireSubmit</code>, which show up only when they apply. Bind <code>[(item)]</code> to track the active question and use <code>shortcuts</code> to enable keyboard answers.
Give <code>hlmQuestionnaireProgress</code> an <code>aria-label</code> when the default text is not descriptive enough.`,
      },
    },
  },
  args: {
    shortcuts: null,
    noValidate: true,
  },
  argTypes: {
    shortcuts: {
      description: 'Keyboard shortcuts for choices: letters (A, B, C…), numbers (1, 2, 3…) or disabled (null).',
      control: 'inline-radio',
      options: ['letters', 'numbers', null],
    },
    noValidate: {
      description: 'Disables the browser native validation UI so the questionnaire can show its own error messages.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <form hlmQuestionnaire class="max-w-lg" [shortcuts]="shortcuts" [noValidate]="noValidate" (submit)="$event.preventDefault()">
        <div hlmQuestionnaireProgress></div>
        <fieldset hlmQuestionnaireItem name="format" required>
          <legend hlmQuestionnaireTitle>Which format do you prefer?</legend>
          <p hlmQuestionnaireDescription>Choose the format you use most often.</p>
          <div hlmQuestionnaireChoices>
            <label hlmQuestionnaireChoice value="written">
              <span>Written report</span>
              <span hlmQuestionnaireChoiceDescription>A concise document with key findings.</span>
            </label>
            <label hlmQuestionnaireChoice value="presentation">
              <span>Presentation</span>
              <span hlmQuestionnaireChoiceDescription>A visual summary for sharing with a team.</span>
            </label>
            <label hlmQuestionnaireChoice value="dashboard">
              <span>Dashboard</span>
              <span hlmQuestionnaireChoiceDescription>An interactive view that updates automatically.</span>
            </label>
          </div>
          <div hlmQuestionnaireError></div>
        </fieldset>
        <fieldset hlmQuestionnaireItem name="frequency">
          <legend hlmQuestionnaireTitle>How often do you want updates?</legend>
          <p hlmQuestionnaireDescription>You can skip this question and change it later.</p>
          <div hlmQuestionnaireChoices>
            <label hlmQuestionnaireChoice value="daily"><span>Daily</span></label>
            <label hlmQuestionnaireChoice value="weekly"><span>Weekly</span></label>
            <label hlmQuestionnaireChoice value="monthly"><span>Monthly</span></label>
          </div>
        </fieldset>
        <fieldset hlmQuestionnaireItem name="email" required>
          <legend hlmQuestionnaireTitle>Where should we send the summary?</legend>
          <p hlmQuestionnaireDescription>Enter a work email address.</p>
          <input hlmQuestionnaireInput type="email" aria-label="Work email address" placeholder="name@company.com" />
          <div hlmQuestionnaireError message="Enter a valid email address."></div>
        </fieldset>
        <div hlmQuestionnaireActions>
          <button hlmQuestionnairePrevious type="button">Previous</button>
          <button hlmQuestionnaireSkip type="button">Skip</button>
          <button hlmQuestionnaireNext type="button">Next</button>
          <button hlmQuestionnaireSubmit type="submit">Submit</button>
        </div>
      </form>
    `,
  }),
};

export default meta;
type Story = StoryObj<QuestionnaireStoryArgs>;

export const Default: Story = {};

export const LetterShortcuts: Story = {
  args: { shortcuts: 'letters' },
};

export const NumberShortcuts: Story = {
  args: { shortcuts: 'numbers' },
};

export const MultipleChoice: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <form hlmQuestionnaire class="max-w-lg" (submit)="$event.preventDefault()">
        <fieldset hlmQuestionnaireItem name="channels" multiple>
          <legend hlmQuestionnaireTitle>Which notification channels do you use?</legend>
          <p hlmQuestionnaireDescription>Select all that apply.</p>
          <div hlmQuestionnaireChoices>
            <label hlmQuestionnaireChoice value="email"><span>Email</span></label>
            <label hlmQuestionnaireChoice value="slack"><span>Slack</span></label>
            <label hlmQuestionnaireChoice value="sms"><span>Text message</span></label>
          </div>
        </fieldset>
        <div hlmQuestionnaireActions><button hlmQuestionnaireSubmit type="submit">Submit</button></div>
      </form>
    `,
  }),
};

export const WithDisabledChoice: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <form hlmQuestionnaire class="max-w-lg" (submit)="$event.preventDefault()">
        <fieldset hlmQuestionnaireItem name="plan">
          <legend hlmQuestionnaireTitle>Which plan fits your team?</legend>
          <div hlmQuestionnaireChoices>
            <label hlmQuestionnaireChoice value="starter"><span>Starter</span></label>
            <label hlmQuestionnaireChoice value="team"><span>Team</span></label>
            <label hlmQuestionnaireChoice value="enterprise" disabled>
              <span>Enterprise</span>
              <span hlmQuestionnaireChoiceDescription>Contact sales to enable this plan.</span>
            </label>
          </div>
        </fieldset>
        <div hlmQuestionnaireActions><button hlmQuestionnaireSubmit type="submit">Submit</button></div>
      </form>
    `,
  }),
};

export const WithTextInput: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <form hlmQuestionnaire class="max-w-lg" (submit)="$event.preventDefault()">
        <fieldset hlmQuestionnaireItem name="team-name">
          <legend hlmQuestionnaireTitle>What is your team called?</legend>
          <p hlmQuestionnaireDescription>We use this name in reports and invitations.</p>
          <input hlmQuestionnaireInput type="text" aria-label="Team name" placeholder="Customer Success" />
        </fieldset>
        <div hlmQuestionnaireActions><button hlmQuestionnaireSubmit type="submit">Submit</button></div>
      </form>
    `,
  }),
};

export const WithError: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <form hlmQuestionnaire class="max-w-lg" (submit)="$event.preventDefault()">
        <fieldset hlmQuestionnaireItem name="email" required>
          <legend hlmQuestionnaireTitle>Where should we send the summary?</legend>
          <p hlmQuestionnaireDescription>Enter a work email address.</p>
          <input hlmQuestionnaireInput id="summary-email" type="email" aria-label="Work email address" />
          <div hlmQuestionnaireError message="Enter a valid email address."></div>
        </fieldset>
        <div hlmQuestionnaireActions><button hlmQuestionnaireSubmit type="submit">Submit</button></div>
      </form>
    `,
  }),
};
