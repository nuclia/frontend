<script lang="ts">
</script>

<div class="paragraph">
  <div class="icon">
    <slot name="icon" />
  </div>
  <div class="content">
    <slot name="content" />
  </div>
</div>

<style>
  .paragraph {
    display: flex;
  }
  .icon {
    flex: 0 0 auto;
    width: 78px;
  }
  .content {
    flex: 1 1 0;
  }
</style>
