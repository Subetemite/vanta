<template>
  <div class="relative" v-click-outside="close">
    <div class="relative">
      <input
        ref="input"
        :value="modelValue"
        :placeholder="placeholder"
        type="text"
        autocomplete="off"
        spellcheck="false"
        class="w-full rounded-md border border-case-border bg-case-card px-2 py-1.5 pr-7 text-xs text-gray-200 outline-none focus:border-primary"
        @focus="onFocus"
        @input="onInput"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.enter.prevent="commitHighlight"
        @keydown.esc="close"
      />
      <Icon
        :icon="open ? 'mdi:chevron-up' : 'mdi:chevron-down'"
        class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm"
        :class="modelValue ? 'text-primary' : 'text-gray-600'"
      />
    </div>

    <transition name="fade">
      <div
        v-if="open"
        class="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-case-border bg-case-surface shadow-2xl shadow-black/60"
      >
        <div v-if="!filteredOptions.length" class="px-3 py-3 text-[11px] text-gray-500">
          <span v-if="modelValue">No match — free text "{{ modelValue }}" will be used.</span>
          <span v-else>No employees found.</span>
        </div>
        <ul v-else class="py-1">
          <li
            v-for="(opt, idx) in filteredOptions"
            :key="opt.id"
            class="cursor-pointer px-3 py-2 text-xs transition-colors"
            :class="[
              idx === highlight
                ? 'bg-primary/10 text-primary'
                : 'text-gray-300 hover:bg-case-card hover:text-gray-100',
              opt.label === modelValue ? 'border-l-2 border-primary' : 'border-l-2 border-transparent',
            ]"
            @mousedown.prevent="select(opt)"
            @mouseenter="highlight = idx"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="truncate font-medium">{{ opt.label }}</span>
              <span v-if="opt.employeeId" class="flex-shrink-0 rounded bg-case-elevated px-1.5 py-0.5 text-[10px] tabular-nums text-gray-400">
                {{ opt.employeeId }}
              </span>
            </div>
            <p v-if="opt.position" class="mt-0.5 truncate text-[10px] text-gray-500">{{ opt.position }}</p>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";

  const clickOutside = {
    beforeMount(el, binding) {
      el._clickOutside = (event) => {
        if (!(el === event.target || el.contains(event.target))) {
          binding.value(event);
        }
      };
      document.addEventListener("mousedown", el._clickOutside);
    },
    unmounted(el) {
      document.removeEventListener("mousedown", el._clickOutside);
    },
  };

  export default {
    name: "EmployeeCombobox",
    components: { Icon },
    directives: { clickOutside },
    props: {
      modelValue: { type: String, default: "" },
      employeeId: { type: String, default: "" },
      options: { type: Array, default: () => [] },
      placeholder: { type: String, default: "Pick or type..." },
    },
    emits: ["update:modelValue", "update:employeeId", "focus"],
    data() {
      return {
        open: false,
        highlight: -1,
      };
    },
    computed: {
      filteredOptions() {
        const q = String(this.modelValue || "").trim().toLowerCase();
        if (!q) return this.options.slice(0, 50);
        return this.options
          .filter((o) =>
            o.label.toLowerCase().includes(q) ||
            (o.employeeId || "").toLowerCase().includes(q) ||
            (o.position || "").toLowerCase().includes(q)
          )
          .slice(0, 50);
      },
    },
    watch: {
      modelValue() {
        this.highlight = -1;
        this.syncEmployeeId();
      },
    },
    methods: {
      onFocus() {
        this.open = true;
        this.$emit("focus");
      },
      onInput(event) {
        this.open = true;
        const value = event.target.value;
        this.$emit("update:modelValue", value);
      },
      select(opt) {
        this.$emit("update:modelValue", opt.label);
        this.$emit("update:employeeId", opt.employeeId || "");
        this.close();
      },
      syncEmployeeId() {
        const match = this.options.find((o) => o.label === this.modelValue);
        const id = match ? match.employeeId || "" : "";
        if (id !== this.employeeId) {
          this.$emit("update:employeeId", id);
        }
      },
      moveHighlight(delta) {
        if (!this.open) {
          this.open = true;
          return;
        }
        const len = this.filteredOptions.length;
        if (!len) return;
        this.highlight = (this.highlight + delta + len) % len;
      },
      commitHighlight() {
        if (this.open && this.highlight >= 0 && this.filteredOptions[this.highlight]) {
          this.select(this.filteredOptions[this.highlight]);
        } else {
          this.close();
        }
      },
      close() {
        this.open = false;
        this.highlight = -1;
      },
    },
  };
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
