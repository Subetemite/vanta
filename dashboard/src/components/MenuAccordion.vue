<template>
  <button
    @click="!collapsed && toggleAccordion()"
    class="sidebar-tab text-gray-400 bg-transparent w-full flex rounded-md box-border p-3 transition-colors"
    :class="[
      isOpen && !collapsed ? 'bg-case-elevated text-gray-200 is-active' : 'hover:bg-case-elevated hover:text-gray-200',
      collapsed ? 'justify-center cursor-default' : 'text-left items-center'
    ]"
    :title="collapsed ? String($slots.title?.()[0]?.children ?? '') : ''"
  >
    <span class="text-xl flex-shrink-0" :class="{ 'mr-3': !collapsed }">
      <slot name="icon"></slot>
    </span>
    <span v-show="!collapsed" class="w-full">
      <slot name="title" />
    </span>
    <span
      v-show="!collapsed"
      class="box-border mt-1 transition-transform text-gray-600 flex-shrink-0"
      :class="isOpen ? 'rotate-180' : 'rotate-0'"
    >
      <Icon icon="fa6-solid:angle-down" />
    </span>
  </button>

  <div
    v-show="isOpen && !collapsed"
    class="bg-case-bg rounded-md mt-1 p-2 text-gray-400"
  >
    <slot name="content" />
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  export default {
    props: {
      collapsed: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        isOpen: false,
      };
    },
    watch: {
      collapsed(val) {
        if (val) this.isOpen = false;
      },
    },
    methods: {
      toggleAccordion() {
        this.isOpen = !this.isOpen;
      },
    },
    components: { Icon },
  };
</script>
