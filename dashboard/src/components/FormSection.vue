<template>
  <div>
    <div class="mb-4 flex items-center justify-between gap-4">
      <h3 class="text-lg font-semibold text-gray-200">{{ title }}</h3>
      <span
        class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
        :class="badgeClass"
      >
        {{ badgeText }}
      </span>
    </div>
    <slot />
  </div>
</template>

<script>
  export default {
    name: "FormSection",
    props: {
      title: {
        type: String,
        required: true,
      },
      badgeText: {
        type: String,
        required: true,
      },
      badgeClass: {
        type: String,
        required: true,
      },
    },
  };
</script>
