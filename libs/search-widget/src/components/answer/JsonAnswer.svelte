<script lang="ts">
  import { _, type JsonSchema, type JsonSchemaArray, type JsonSchemaObject, type JsonSchemaType } from '../../core';
  import { JsonAnswer } from './index';
  import type { JsonAnswerItem } from './json-answer.model';

  interface Props {
    jsonAnswer: any;
    jsonSchema: JsonSchema;
  }

  let { jsonAnswer, jsonSchema }: Props = $props();

  let items: JsonAnswerItem[] = $derived(
    Object.entries(jsonSchema.parameters.properties).reduce((list, [key, value]) => {
      const label = value.description || key;
      if (jsonAnswer[key]) {
        if (value.type === 'object') {
          list.push({
            label,
            value: jsonAnswer[key],
            parameters: {
              name: key,
              description: label,
              parameters: value as JsonSchemaObject,
            },
          });
        } else if (value.type === 'array') {
          const arrayValue = value as JsonSchemaArray;
          switch (arrayValue.items.type) {
            case 'object':
              list.push({
                label,
                value: null,
                items: jsonAnswer[key].map((subItem) => {
                  return Object.entries(subItem).map(([propertyKey, propertyValue]) => ({
                    label: (arrayValue.items as JsonSchemaObject).properties[propertyKey].description || propertyKey,
                    value: propertyValue,
                  }));
                }),
              });
              break;
            default:
              list.push({ label, value: (jsonAnswer[key] as Array<JsonSchemaType>).join(', ') });
              break;
          }
        } else {
          list.push({ label, value: jsonAnswer[key] });
        }
      }
      return list;
    }, [] as JsonAnswerItem[]),
  );
</script>

<div class="sw-json-answer">
  <h3 class="title-s">{jsonSchema.description || $_('answer.json-answer.title')}</h3>
  <ul>
    {#each items as item}
      {#if !!item.parameters}
        <li>
          <JsonAnswer
            jsonAnswer={item.value}
            jsonSchema={item.parameters}></JsonAnswer>
        </li>
      {:else if !!item.items}
        {#each item.items as properties, i}
          <li>
            <strong>{i + 1}</strong>
            <ul>
              {#each properties as subItem}
                <li>
                  <strong>{subItem.label}</strong>
                  : {subItem.value}
                </li>
              {/each}
            </ul>
          </li>
        {/each}
      {:else}
        <li>
          <strong>{item.label}</strong>
          : {item.value}
        </li>
      {/if}
    {/each}
  </ul>
</div>

<style src="./JsonAnswer.css"></style>
