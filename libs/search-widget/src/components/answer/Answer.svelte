<script lang="ts">
  import type { Answer } from '../../core/answer.models';
  import { _ } from '../../core/i18n';
  export let answer: Partial<Answer>;
</script>

<div>
  {answer.text}
</div>

<style
  lang="scss"
  src="./Answer.scss"></style>
