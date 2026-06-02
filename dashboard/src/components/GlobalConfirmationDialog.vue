<template>
  <ConfirmationDialog
    :visible="dialogState.visible"
    :title="dialogState.title"
    :description="dialogState.description"
    :details="dialogState.details"
    :confirm-text="dialogState.confirmText"
    :cancel-text="dialogState.cancelText"
    :loading-text="dialogState.loadingText"
    :tone="dialogState.tone"
    :icon="dialogState.icon"
    :confirm-icon="dialogState.confirmIcon"
    :single-button="dialogState.singleButton"
    :loading="dialogState.loading"
    :dismiss-on-backdrop="dialogState.dismissOnBackdrop"
    @confirm="onConfirm"
    @cancel="onCancel"
  />
</template>

<script>
  import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
  import { dialog, dialogState } from "@/services/dialog";

  export default {
    name: "GlobalConfirmationDialog",
    components: { ConfirmationDialog },
    data() {
      return { dialogState };
    },
    methods: {
      onConfirm() { dialog._accept(); },
      onCancel() { dialog._cancel(); },
    },
  };
</script>
