<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6">
      <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / DTR</p>
      <h1 class="mt-2 text-2xl font-semibold text-white">Daily Time Record</h1>
      <p class="mt-1 text-sm text-gray-500">Time logs, leaves, special orders, and official operations.</p>
    </header>

    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <router-link
        v-for="f in features"
        :key="f.to"
        :to="f.to"
        class="group rounded-2xl border border-case-border bg-case-surface p-6 transition hover:border-primary/40 hover:bg-case-card"
      >
        <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon :icon="f.icon" class="text-2xl" />
        </span>
        <h2 class="mt-5 text-lg font-semibold text-white">{{ f.title }}</h2>
        <p class="mt-2 text-sm leading-relaxed text-gray-500">{{ f.description }}</p>
      </router-link>
    </div>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  export default {
    name: "AdminDtr",
    components: { Icon },
    data() {
      return {
        features: [
          { title: "Daily Time Record", to: "/admin/dtr/time-logs", icon: "mdi:clock-outline", description: "Time-in and time-out punches per employee." },
          { title: "Leave of Absence", to: "/admin/dtr/leaves", icon: "mdi:calendar-remove-outline", description: "Vacation, sick, and other leave records." },
          { title: "Special Orders", to: "/admin/dtr/special-orders", icon: "mdi:file-document-edit-outline", description: "Numbered orders directing employees." },
          { title: "Official Operations", to: "/admin/dtr/operations", icon: "mdi:target", description: "Field deployments and official business." },
        ],
      };
    },
  };
</script>
