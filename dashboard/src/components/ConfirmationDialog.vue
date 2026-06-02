<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
        @click.self="onBackdrop"
      >
        <div class="w-full max-w-md rounded-2xl border bg-case-surface p-6 shadow-2xl shadow-black/60"
          :class="containerBorderClass">
          <div class="flex items-start gap-4">
            <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full" :class="iconBgClass">
              <Icon :icon="resolvedIcon" class="text-2xl" :class="iconTextClass" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-semibold uppercase tracking-[0.3em]" :class="eyebrowClass">
                {{ eyebrow }}
              </p>
              <h3 class="mt-1.5 text-lg font-semibold text-white leading-tight">{{ title }}</h3>
              <p v-if="description" class="mt-2 text-sm leading-6 text-gray-400 whitespace-pre-line">{{ description }}</p>
              <p v-if="details" class="mt-3 rounded-md border border-case-border bg-case-card px-3 py-2 text-xs text-gray-300 font-mono break-all">
                {{ details }}
              </p>
            </div>
          </div>

          <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              v-if="!singleButton"
              type="button"
              :disabled="loading"
              class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated transition-colors disabled:opacity-50"
              @click="$emit('cancel')"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              :disabled="loading"
              class="rounded-md px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              :class="confirmBtnClass"
              @click="$emit('confirm')"
            >
              <Icon v-if="loading" icon="mdi:loading" class="animate-spin" />
              <Icon v-else-if="confirmIcon" :icon="confirmIcon" />
              {{ loading ? loadingText : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script>
  import { Icon } from "@iconify/vue";

  export default {
    name: "ConfirmationDialog",
    components: { Icon },
    emits: ["cancel", "confirm"],
    props: {
      visible:      { type: Boolean, default: false },
      title:        { type: String,  required: true },
      description:  { type: String,  default: "" },
      details:      { type: String,  default: "" },
      confirmText:  { type: String,  default: "Confirm" },
      cancelText:   { type: String,  default: "Cancel" },
      loadingText:  { type: String,  default: "Working..." },
      tone:         { type: String,  default: "primary" }, // primary | danger | warning | success | info
      icon:         { type: String,  default: "" },        // override the auto-picked icon
      confirmIcon:  { type: String,  default: "" },
      loading:      { type: Boolean, default: false },
      singleButton: { type: Boolean, default: false },
      dismissOnBackdrop: { type: Boolean, default: true },
    },
    computed: {
      eyebrow() {
        if (this.singleButton) {
          return this.tone === "success" ? "Success" : this.tone === "danger" ? "Error" : "Notice";
        }
        return this.tone === "danger" ? "Confirm Deletion" : "Confirmation";
      },
      eyebrowClass() {
        const map = {
          primary: "text-primary",
          danger: "text-red-400",
          warning: "text-amber-400",
          success: "text-emerald-400",
          info: "text-sky-400",
        };
        return map[this.tone] || "text-primary";
      },
      iconBgClass() {
        const map = {
          primary: "bg-primary/10",
          danger: "bg-red-500/10",
          warning: "bg-amber-500/10",
          success: "bg-emerald-500/10",
          info: "bg-sky-500/10",
        };
        return map[this.tone] || "bg-primary/10";
      },
      iconTextClass() { return this.eyebrowClass; },
      resolvedIcon() {
        if (this.icon) return this.icon;
        const map = {
          primary: "mdi:help-circle-outline",
          danger: "mdi:alert-octagon-outline",
          warning: "mdi:alert-outline",
          success: "mdi:check-circle-outline",
          info: "mdi:information-outline",
        };
        return map[this.tone] || "mdi:help-circle-outline";
      },
      confirmBtnClass() {
        const map = {
          primary: "bg-primary text-black hover:bg-primary/90",
          danger: "bg-red-600 text-white hover:bg-red-500",
          warning: "bg-amber-500 text-black hover:bg-amber-400",
          success: "bg-emerald-600 text-white hover:bg-emerald-500",
          info: "bg-sky-600 text-white hover:bg-sky-500",
        };
        return map[this.tone] || map.primary;
      },
      containerBorderClass() {
        const map = {
          primary: "border-case-border",
          danger: "border-red-900/50",
          warning: "border-amber-900/50",
          success: "border-emerald-900/50",
          info: "border-sky-900/50",
        };
        return map[this.tone] || "border-case-border";
      },
    },
    methods: {
      onBackdrop() {
        if (!this.loading && this.dismissOnBackdrop) {
          this.$emit(this.singleButton ? "confirm" : "cancel");
        }
      },
    },
  };
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
