<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { getTempToken, isPrivateKnowledgeBox } from '../../core/api';

  export let src: string;
  export let type: string;
  export let time: number | undefined;
  let firstLoadDone = false;
  let currentTime: number | undefined;
  let paused: boolean = true;
  let player: HTMLMediaElement;
  let isVideo: boolean;

  let dashPlayer: any;
  let isDashVideo: boolean;

  const dispatch = createEventDispatcher();

  onDestroy(() => {
    if (player && !paused) {
      player.pause();
    }
    if (dashPlayer) {
      dashPlayer.reset();
      dashPlayer.destroy();
    }
  });

  $: if (firstLoadDone && typeof time === 'number') {
    currentTime = time;
    play();
  }
  $: isVideo = type.slice(0, 5) === 'video' || type === 'text/xml';
  $: isDashVideo = type === 'text/xml';

  const play = () => {
    if (paused) {
      player.play();
    }
  };

  const onLoadDash = () => {
    if (isPrivateKnowledgeBox()) {
      getTempToken().subscribe((token) => {
        initDash(token);
      });
    } else {
      return initDash();
    }
  };

  const initDash = (token?: string) => {
    const dashjs = (window as any)['dashjs'];
    if (dashjs) {
      dashPlayer = dashjs.MediaPlayer().create();
      dashPlayer.extend('RequestModifier', () => {
        return {
          modifyRequestHeader: (xhr: any) => xhr,
          modifyRequestURL: (url: string) => {
            if (token && url.indexOf('eph-token') < 0) {
              return url + `?eph-token=${token}`;
            }
            return url;
          },
        };
      });
      dashPlayer.initialize(player, src, true);
    }
  };
</script>

<svelte:head>
  {#if isDashVideo}
    <script
      src="https://cdn.dashjs.org/v4.3.0/dash.all.min.js"
      on:load={onLoadDash}></script>
  {/if}
</svelte:head>

<div class="sw-player">
  {#if isVideo}
    <video
      preload="auto"
      crossorigin="anonymous"
      controls
      on:canplay={() => {
        if (!firstLoadDone) firstLoadDone = true;
        dispatch('videoReady');
      }}
      bind:this={player}
      bind:currentTime
      bind:paused>
      <source
        {src}
        {type} />
      <track kind="captions" />
    </video>
  {:else}
    <audio
      preload="auto"
      crossorigin="anonymous"
      controls
      on:canplay={() => {
        if (!firstLoadDone) firstLoadDone = true;
      }}
      bind:this={player}
      bind:currentTime
      bind:paused>
      <source
        {src}
        {type} />
    </audio>
  {/if}
</div>

<style
  lang="scss"
  src="./Player.scss"></style>
