<script lang="ts">
  import Answer from './Answer.svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import { dialog } from '../../core/stores/answers.store';
  import Feedback from './Feedback.svelte';
</script>

<div class="container">
  {#each $dialog as entry, i}
    <div class="entry">
      <div class="row">
        <div class="icon">
          <Icon name="chat" />
        </div>
        <h3 class="title-m">{entry.question}</h3>
        <div />
      </div>
      <div class="row">
        <div />
        <Answer answer={entry.answer} />
        <div class="feedback">
          <Feedback rank={i} />
        </div>
      </div>
    </div>
  {/each}
</div>

<style
  lang="scss"
  src="./Dialog.scss"></style>
