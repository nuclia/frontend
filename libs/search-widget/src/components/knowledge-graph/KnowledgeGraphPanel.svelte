<script lang="ts">
  import { graphSelection, graphSelectionRelations } from '../../core/stores/graph.store';
</script>

<div class="sw-knowledge-graph-panel">
  <section>
    <p><strong>Network</strong></p>
    <ul>
      {#each $graphSelectionRelations as edge}
        <li>
          <div
            class="family-dot"
            style:background={edge.source.id === $graphSelection.id ? edge.target.color : edge.source.color} />
          <strong>{edge.label}</strong>
          {edge.source.id === $graphSelection.id ? edge.target.ner : edge.source.ner}
        </li>
      {/each}
    </ul>
  </section>
</div>

<style
  lang="scss"
  src="./KnowledgeGraphPanel.scss"></style>
