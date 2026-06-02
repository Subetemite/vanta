<template>
  <div :class="wrapperClass">
    <label :for="forId" class="mb-2 block text-sm font-medium text-gray-400">
      {{ label }}
    </label>
    <slot />
  </div>
</template>

<script>
  export default {
    name: "FormField",
    props: {
      label: {
        type: String,
        required: true,
      },
      forId: {
        type: String,
        required: true,
      },
      wrapperClass: {
        type: String,
        default: "",
      },
    },
  };
</script>
