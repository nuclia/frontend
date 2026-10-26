import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmQuestionnaireImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Questionnaire',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmQuestionnaireImports] })],
  parameters: {
    docs: {
      description: {
        component: `Guides users through a series of questions with choices or freeform answers. Use it for onboarding, preference gathering, or guided requests where one question at a time keeps the task focused.`,
      },
    },
  },
  render: () => ({
    template: `<form hlmQuestionnaire class="max-w-lg" (submit)="$event.preventDefault()">
      <div hlmQuestionnaireProgress>Question 1 of 2</div>
      <fieldset hlmQuestionnaireItem name="format">
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
        </div>
      </fieldset>
      <div hlmQuestionnaireActions>
        <button hlmQuestionnairePrevious type="button">Previous</button>
        <button hlmQuestionnaireSkip type="button">Skip</button>
        <button hlmQuestionnaireNext type="button">Next</button>
      </div>
    </form>`,
  }),
};

export default meta;
type Story = StoryObj;
export const Default: Story = {};
export const WithError: Story = {
  render: () => ({
    template: `<form hlmQuestionnaire class="max-w-lg" (submit)="$event.preventDefault()">
      <fieldset hlmQuestionnaireItem name="email">
        <legend hlmQuestionnaireTitle>Where should we send the summary?</legend>
        <p hlmQuestionnaireDescription>Enter a work email address.</p>
        <input hlmQuestionnaireInput id="summary-email" type="email" aria-label="Work email address" />
        <div hlmQuestionnaireError message="Enter a valid email address."></div>
      </fieldset>
      <div hlmQuestionnaireActions><button hlmQuestionnaireSubmit type="submit">Submit</button></div>
    </form>`,
  }),
};
