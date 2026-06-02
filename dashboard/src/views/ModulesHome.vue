<template>
  <div class="min-h-screen bg-case-bg px-6 py-10 sm:px-10 lg:px-12">
    <header class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.35em] text-primary">VANTA Platform</p>
        <h1 class="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          {{ isAdmin ? "Administrator Console" : "Pick a module" }}
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          <template v-if="isAdmin">
            Full access to all {{ allModules.length }} modules.
          </template>
          <template v-else>
            You have access to {{ visibleModules.length }} module<span v-if="visibleModules.length !== 1">s</span>.
          </template>
        </p>
      </div>
      <span
        v-if="currentUser"
        class="inline-flex items-center gap-2 self-start rounded-full border border-case-border bg-case-surface px-3 py-1.5 text-xs text-gray-300 sm:self-auto"
      >
        <span class="h-1.5 w-1.5 rounded-full" :class="isAdmin ? 'bg-primary' : 'bg-emerald-400'"></span>
        {{ currentUser.username || currentUser.email || "Signed in" }}
        <span class="text-[10px] uppercase tracking-[0.2em] text-gray-500">{{ currentUser.role || "user" }}</span>
      </span>
    </header>

    <div v-if="!visibleModules.length" class="rounded-2xl border border-case-border bg-case-surface p-10 text-center">
      <Icon icon="mdi:lock-outline" class="mx-auto text-4xl text-gray-600" />
      <h2 class="mt-3 text-lg font-semibold text-white">No modules assigned</h2>
      <p class="mt-1 text-sm text-gray-500">
        Your account hasn't been granted access to any modules yet. Please contact an administrator.
      </p>
    </div>

    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <router-link
        v-for="mod in visibleModules"
        :key="mod.key"
        :to="mod.to"
        class="group relative flex flex-col rounded-2xl border border-case-border bg-case-surface p-6 cursor-pointer transition hover:border-primary/40 hover:bg-case-card"
      >
        <div class="flex items-center justify-between">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon :icon="mod.icon" class="text-2xl" />
          </span>
          <span class="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600 transition group-hover:text-primary">
            Open <Icon icon="mdi:arrow-right" class="ml-0.5 inline-block align-text-bottom text-sm" />
          </span>
        </div>
        <h2 class="mt-5 text-lg font-semibold text-white">{{ mod.title }}</h2>
        <p class="mt-2 text-sm leading-relaxed text-gray-500">{{ mod.description }}</p>
        <ul class="mt-4 space-y-1 text-xs text-gray-600">
          <li v-for="f in mod.features" :key="f" class="flex items-center gap-2">
            <span class="h-1 w-1 rounded-full bg-primary/60"></span>
            {{ f }}
          </li>
        </ul>
      </router-link>
    </div>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";

  const MODULES = [
    {
      key: "admin",
      title: "ADMIN",
      icon: "mdi:account-multiple-outline",
      to: "/admin",
      description: "Personnel, timekeeping, calendar of activities, and documents tracking system.",
      features: ["HRIS", "Daily Time Record", "OPCR", "Calendar", "Documents Tracking"],
    },
    {
      key: "cases",
      title: "Case Management",
      icon: "mdi:shield-search",
      to: "/cases",
      description: "Economic sabotage, ANTI-POGO, organized crime, graft & corruption.",
      features: ["4-Focus Operations", "18 Crime Clusters", "Inter-Agency", "SOCTA Handbook"],
    },
    {
      key: "logistics",
      title: "Assets Management",
      icon: "mdi:truck-fast-outline",
      to: "/logistics",
      description: "Asset, supply, vehicle and operational support tracking.",
      features: ["Inventory", "Fleet & Vehicles", "Requisitions", "Suppliers", "Maintenance"],
    },
    {
      key: "operations",
      title: "Operations",
      icon: "mdi:target",
      to: "/operations",
      description: "Mission planning, deployments, situation reports and after-action reviews.",
      features: ["Missions", "Deployments", "SITREPs", "After-Action Reports"],
    },
    {
      key: "social",
      title: "Communication",
      icon: "mdi:account-search-outline",
      to: "/social",
      description: "Social account monitoring, posts, alerts and analyst campaigns.",
      features: ["Accounts", "Posts", "Alerts", "Campaigns"],
    },
  ];

  export default {
    name: "ModulesHome",
    components: { Icon },
    computed: {
      currentUser() {
        try {
          return JSON.parse(localStorage.getItem("auth_user") || "null");
        } catch {
          return null;
        }
      },
      isAdmin() {
        return this.currentUser?.role === "admin";
      },
      allModules() {
        return MODULES;
      },
      visibleModules() {
        if (this.isAdmin) return MODULES;
        return MODULES.filter((m) => this.hasAccess(m.key));
      },
    },
    methods: {
      hasAccess(moduleKey) {
        const user = this.currentUser;
        if (!user) return false;
        if (user.role === "admin") return true;
        return Boolean(user.modulePermissions?.[moduleKey]);
      },
    },
  };
</script>
