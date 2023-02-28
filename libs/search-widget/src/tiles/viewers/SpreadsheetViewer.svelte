<script lang="ts">
  import { onMount } from 'svelte';
  import { combineLatest, filter, map, Subject, take } from 'rxjs';
  import { FileFieldExtractedData } from '@nuclia/core';
  import { fieldData } from '../../core/stores/viewer.store';
  import Button from '../../common/button/Button.svelte';

  const selectedSheetId = new Subject<string>();
  const sheets = fieldData.pipe(
    map(
      (field) => Object.values((field?.extracted as FileFieldExtractedData)?.file?.file_rows_previews || {})[0]?.sheets,
    ),
  );
  const sheet = combineLatest([sheets, selectedSheetId]).pipe(map(([list, selected]) => list?.[selected]));

  onMount(() => {
    sheets
      .pipe(
        filter((list) => !!list),
        take(1),
      )
      .subscribe((list) => {
        select(Object.keys(list)[0] || '');
      });
  });

  function select(id: string) {
    selectedSheetId.next(id);
  }
</script>

<div class="sw-spreadsheet-viewer">
  {#if $sheet}
    {#if Object.keys($sheets).length > 1}
      <div class="tabs">
        {#each Object.entries($sheets) as [id]}
          <Button
            on:click={select(id)}
            active={$selectedSheetId === id}
            size="small">
            {id}
          </Button>
        {/each}
      </div>
    {/if}
    <table>
      {#each $sheet.rows || [] as row, index}
        <tr>
          {#each row.cell || [] as cell}
            <td
              class="ellipsis"
              title={cell}>
              {cell}
            </td>
          {/each}
        </tr>
      {/each}
    </table>
  {/if}
</div>

<style
  lang="scss"
  src="./SpreadsheetViewer.scss"></style>
