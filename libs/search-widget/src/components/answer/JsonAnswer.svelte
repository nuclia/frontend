<script lang="ts">
  import { _, type JsonSchema, type JsonSchemaArray, type JsonSchemaObject } from '../../core';
  import { JsonAnswer } from './index';

  export let jsonAnswer: any;
  export let jsonSchema: JsonSchema;

  let items: {
    label: string;
    value: any;
    parameters?: JsonSchema;
  }[] = [];

  $: {
    const params = Object.entries(jsonSchema.parameters.properties);
    items = params.reduce((list, [key, value]) => {
      const label = value.description || key;
      if (jsonAnswer[key]) {
        if (value.type === 'object') {
          list.push({
            label, value: jsonAnswer[key], parameters: {
              name: key,
              description: label,
              parameters: (value as JsonSchemaObject)
            }
          });
        } else if (value.type === 'array') {
          const arrayValue = value as JsonSchemaArray;
          if (arrayValue.items.type !== 'object' && arrayValue.items.type !== 'array') {
            list.push({ label, value: (jsonAnswer[key] as Array<arrayValue.items.type>).join(', ') });
          } else {
            // TODO support array of objects and array of arrays
          }
        } else {
          list.push({ label, value: jsonAnswer[key] });
        }
      }
      return list;
    }, [] as { label: string; value: any; parameters?: JsonSchema; }[]);
    console.log(items);
  }
</script>

<div class="sw-json-answer">
  <h3 class="title-s">{ jsonSchema.description || $_('answer.json-answer.title')}</h3>
  <ul>
    {#each items as item}
      {#if !!item.parameters}
        <!--        <li><strong>{item.label}</strong>: TODO</li>-->
        <li>
          <JsonAnswer jsonAnswer={item.value} jsonSchema={item.parameters}></JsonAnswer>
        </li>
      {:else}
        <li><strong>{item.label}</strong>: {item.value}</li>
      {/if}
    {/each}
  </ul>
</div>

<style
  lang="scss"
  src="./JsonAnswer.scss"></style>
