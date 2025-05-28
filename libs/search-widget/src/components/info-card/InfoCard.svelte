<script lang="ts">
  interface Props {
    entityRelations?: {
      entity: string;
      relations: {
        [relation: string]: string[];
      };
    }[];
  }

  let { entityRelations = [] }: Props = $props();
</script>

<div class="relations">
  {#each entityRelations as entity}
    <div class="entity">
      <div class="entity-name">{entity.entity}</div>
      {#each Object.entries(entity.relations) as [name, related]}
        <div class="relation">
          <span class="relation-name">{name}:</span>
          <span>{related.join(', ')}</span>
        </div>
      {/each}
    </div>
  {/each}
</div>

<style
  lang="scss"
  src="./InfoCard.scss"></style>
