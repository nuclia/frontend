<script lang="ts">
  import Tabs from '../../../common/tabs/TabsList.svelte';
  import Tab from '../../../common/tabs/TabItem.svelte';
  import { combineLatest, filter, map, Subject, take } from 'rxjs';
  import { fieldData } from '../../../core';
  import { FileFieldExtractedData } from '@nuclia/core';
  import { onMount } from 'svelte';

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


<div class="sw-spreadsheet-renderer">
  <div class="tabs">
    {#if $sheets && Object.keys($sheets).length > 1}
      <Tabs>
        {#each Object.entries($sheets) as [id]}
          <Tab
            on:click={select(id)}
            active={$selectedSheetId === id}>
            {id}
          </Tab>
        {/each}
      </Tabs>
    {/if}
  </div>
  <div class="table-container">
    {#if $sheet}
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
</div>



<style
  lang="scss"
  src="./SpreadsheetRenderer.scss"></style>
