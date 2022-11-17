<script lang="ts">
  import Modal from '../../common/modal/Modal.svelte';
  import Viewer from '../../old-components/viewer/Viewer.svelte';
  import { isViewerOpen } from '../../core/stores/modal.store';
</script>

<div class="sw-viewer-modal">
  <Modal
    show={$isViewerOpen}
    on:close={() => isViewerOpen.set(false)}
    closeButton={true}
    --modal-width="var(--resource-modal-width)"
    --modal-width-md="var(--resource-modal-width-md)"
    --modal-height="var(--resource-modal-height)"
    --modal-height-md="var(--resource-modal-height-md)">
    <Viewer />
  </Modal>
</div>
