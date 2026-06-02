<template>
  <nav class="sidebar bg-case-surface flex flex-col h-screen">

    <!-- Head -->
    <div
      class="sidebar-head border-b border-case-border flex-shrink-0 flex items-center transition-all duration-300"
      :class="collapsed ? 'p-3 justify-center' : 'p-4 justify-between'"
    >
      <router-link to="/home" class="flex items-center min-w-0 overflow-hidden">
        <img class="w-8 flex-shrink-0" src="@/assets/logo/logo.svg" alt="logo" />
        <h2
          v-show="!collapsed"
          class="text-2xl font-normal ml-3 text-white whitespace-nowrap"
          translate="no"
        >
          VANTA<span class="text-primary">.</span>
        </h2>
      </router-link>
      <button
        class="lg:hidden block text-gray-500 flex-shrink-0"
        @click="$emit('sidebarToggle')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="25px" height="25px" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32">
          <path fill="currentColor" d="M7.219 5.781L5.78 7.22L14.563 16L5.78 24.781l1.44 1.439L16 17.437l8.781 8.782l1.438-1.438L17.437 16l8.782-8.781L24.78 5.78L16 14.563z" />
        </svg>
      </button>
    </div>

    <!-- Module switcher -->
    <div class="border-b border-case-border flex-shrink-0" :class="collapsed ? 'p-2' : 'p-3'">
      <div v-show="!collapsed" class="mb-2 flex items-center justify-between px-1">
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">Modules</p>
        <span class="text-[10px] tabular-nums text-gray-600">{{ accessibleModules.length }}</span>
      </div>

      <!-- Collapsed: vertical stack -->
      <div v-if="collapsed" class="flex flex-col gap-1">
        <router-link
          v-for="mod in accessibleModules"
          :key="mod.key"
          :to="mod.to"
          class="sidebar-tab flex flex-col items-center justify-center gap-1 rounded-md px-1.5 py-2 text-gray-500 hover:bg-case-elevated hover:text-gray-200 transition-colors"
          :class="{ 'bg-case-elevated text-primary is-active': activeModule === mod.key }"
          :title="mod.title"
        >
          <Icon :icon="mod.icon" class="text-2xl flex-shrink-0" />
        </router-link>
      </div>

      <!-- Expanded: horizontal slider with prev/next -->
      <div v-else class="flex items-center gap-1.5">
        <button
          type="button"
          class="flex h-9 w-7 flex-shrink-0 items-center justify-center rounded-md border border-case-border bg-case-card text-gray-500 transition-colors hover:bg-case-elevated hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          :disabled="!canScrollPrev"
          aria-label="Previous module"
          @click="scrollModules(-1)"
        >
          <Icon icon="mdi:chevron-left" class="text-lg" />
        </button>

        <div
          ref="moduleScroller"
          class="module-scroller flex flex-1 gap-2 overflow-x-auto scroll-smooth"
          @scroll="updateScrollState"
        >
          <router-link
            v-for="mod in accessibleModules"
            :key="mod.key"
            :to="mod.to"
            class="sidebar-tab flex w-20 flex-shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 py-3 text-gray-500 hover:border-case-border hover:bg-case-elevated hover:text-gray-200 transition-colors"
            :class="{ 'border-primary/40 bg-case-elevated text-primary is-active': activeModule === mod.key }"
            :title="mod.title"
          >
            <Icon :icon="mod.icon" class="text-3xl flex-shrink-0" />
            <span class="truncate w-full text-center text-[10px] font-medium uppercase tracking-wide">
              {{ mod.shortTitle }}
            </span>
          </router-link>
        </div>

        <button
          type="button"
          class="flex h-9 w-7 flex-shrink-0 items-center justify-center rounded-md border border-case-border bg-case-card text-gray-500 transition-colors hover:bg-case-elevated hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          :disabled="!canScrollNext"
          aria-label="Next module"
          @click="scrollModules(1)"
        >
          <Icon icon="mdi:chevron-right" class="text-lg" />
        </button>
      </div>
    </div>

    <!-- Nav list (module-specific) -->
    <div class="sidebar-scroll flex-1 overflow-y-auto" :class="collapsed ? 'p-2' : 'p-4'">
      <div v-if="activeModule" class="pb-5">
        <p
          v-show="!collapsed"
          class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 mb-4"
        >
          {{ activeModuleTitle }}
        </p>

        <div class="wrap-item">
          <div
            v-for="item in moduleMenu"
            :key="item.to"
            class="item mt-1"
          >
            <router-link
              :to="item.to"
              class="sidebar-tab w-full flex rounded-md box-border p-3 hover:bg-case-elevated hover:text-gray-200 transition-colors text-gray-400"
              :class="collapsed ? 'justify-center' : 'items-center text-left'"
              :title="collapsed ? item.title : ''"
            >
              <span class="text-xl flex-shrink-0" :class="{ 'mr-3': !collapsed }">
                <Icon :icon="item.icon" />
              </span>
              <span v-show="!collapsed" class="w-full">{{ item.title }}</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- System accordion (admin only) -->
      <div v-if="isSystemAdmin" class="pb-5">
        <p
          v-show="!collapsed"
          class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 mb-4"
        >
          System
        </p>
        <div class="item">
          <router-link
            to="/files"
            class="sidebar-tab w-full flex rounded-md box-border p-3 hover:bg-case-elevated hover:text-gray-200 transition-colors text-gray-400"
            :class="collapsed ? 'justify-center' : 'items-center text-left'"
            :title="collapsed ? 'Files' : ''"
          >
            <span class="text-xl flex-shrink-0" :class="{ 'mr-3': !collapsed }">
              <Icon icon="mdi:file-document-multiple-outline" />
            </span>
            <span v-show="!collapsed" class="w-full">Files</span>
          </router-link>
        </div>

        <div class="item mt-1">
          <menu-accordion :collapsed="collapsed">
            <template v-slot:icon><Icon icon="ri:pages-fill" /></template>
            <template v-slot:title>Administration</template>
            <template v-slot:content>
              <router-link to="/system/settings/general" class="sidebar-tab w-full text-left block rounded-md p-3 hover:bg-case-elevated hover:text-gray-200 transition-colors">General Settings</router-link>
              <router-link to="/system/settings/security" class="sidebar-tab w-full text-left block rounded-md p-3 hover:bg-case-elevated hover:text-gray-200 transition-colors">Security Settings</router-link>
              <router-link to="/system/users" class="sidebar-tab w-full text-left block rounded-md p-3 hover:bg-case-elevated hover:text-gray-200 transition-colors">User Management</router-link>
              <router-link to="/system/users/create" class="sidebar-tab w-full text-left block rounded-md p-3 hover:bg-case-elevated hover:text-gray-200 transition-colors">Create Account</router-link>
              <router-link to="/system/users/passwords" class="sidebar-tab w-full text-left block rounded-md p-3 hover:bg-case-elevated hover:text-gray-200 transition-colors">Password Change</router-link>
              <router-link to="/system/users/login-history" class="sidebar-tab w-full text-left block rounded-md p-3 hover:bg-case-elevated hover:text-gray-200 transition-colors">Login History</router-link>
            </template>
          </menu-accordion>
        </div>
      </div>
    </div>

    <!-- Collapse toggle -->
    <div class="border-t border-case-border flex-shrink-0 hidden lg:block" :class="collapsed ? 'p-2' : 'p-3'">
      <button
        @click="$emit('collapseToggle')"
        class="w-full flex items-center rounded-md p-2 text-gray-500 hover:bg-case-elevated hover:text-gray-300 transition-colors"
        :class="collapsed ? 'justify-center' : ''"
        :title="collapsed ? 'Expand sidebar' : ''"
      >
        <Icon
          :icon="collapsed ? 'ic:outline-keyboard-double-arrow-right' : 'ic:outline-keyboard-double-arrow-left'"
          class="text-xl flex-shrink-0"
        />
        <span v-show="!collapsed" class="ml-2 text-xs">Minimize</span>
      </button>
    </div>

  </nav>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import MenuAccordion from "./MenuAccordion.vue";

  const MODULES = [
    { key: "admin", title: "ADMIN", shortTitle: "ADMIN", icon: "mdi:account-multiple-outline", to: "/admin" },
    { key: "cases", title: "Case Management", shortTitle: "Cases", icon: "mdi:shield-search", to: "/cases" },
    { key: "logistics", title: "Assets Management", shortTitle: "Assets", icon: "mdi:truck-fast-outline", to: "/logistics" },
    { key: "operations", title: "Operations", shortTitle: "Ops", icon: "mdi:target", to: "/operations" },
    { key: "social", title: "Communication", shortTitle: "Comms", icon: "mdi:account-search-outline", to: "/social" },
  ];

  const MODULE_MENUS = {
    admin: [
      { title: "Overview", to: "/admin", icon: "mdi:view-dashboard-outline" },
      { title: "HRIS", to: "/admin/hris", icon: "mdi:account-box-multiple-outline" },
      { title: "DTR", to: "/admin/dtr", icon: "mdi:clock-outline" },
      { title: "OPCR", to: "/admin/opcr", icon: "mdi:chart-line" },
      { title: "Calendar", to: "/admin/calendar", icon: "mdi:calendar-month-outline" },
      { title: "Documents Tracking", to: "/admin/documents", icon: "mdi:file-send-outline" },
    ],
    cases: [
      { title: "Overview", to: "/cases", icon: "mdi:view-dashboard-outline" },
      { title: "4-Focus Operations", to: "/cases/focus-operations", icon: "mdi:target" },
      { title: "18 Crime Clusters", to: "/cases/crime-clusters", icon: "mdi:grid-large" },
      { title: "NALECC-SCOC", to: "/cases/nalecc-scoc", icon: "mdi:gavel" },
      { title: "Inter-Agency Coordinations", to: "/cases/inter-agency", icon: "mdi:account-group-outline" },
      { title: "Accomplishment Reports", to: "/cases/accomplishment-reports", icon: "mdi:file-chart-outline" },
      { title: "SOCTA Handbook", to: "/cases/socta-handbook", icon: "mdi:book-open-page-variant-outline" },
    ],
    logistics: [
      { title: "Overview", to: "/logistics", icon: "mdi:view-dashboard-outline" },
      { title: "Inventory", to: "/logistics/inventory", icon: "mdi:package-variant-closed" },
      { title: "ICT", to: "/logistics/ict", icon: "mdi:laptop" },
      { title: "Fleet & Vehicles", to: "/logistics/vehicles", icon: "mdi:truck-fast-outline" },
      { title: "Requisitions", to: "/logistics/requisitions", icon: "mdi:clipboard-list-outline" },
      { title: "Suppliers", to: "/logistics/suppliers", icon: "mdi:account-tie-outline" },
      { title: "Maintenance", to: "/logistics/maintenance", icon: "mdi:wrench-outline" },
    ],
    operations: [
      { title: "Overview", to: "/operations", icon: "mdi:view-dashboard-outline" },
      { title: "Missions", to: "/operations/missions", icon: "mdi:target" },
      { title: "Deployments", to: "/operations/deployments", icon: "mdi:account-group-outline" },
      { title: "SITREPs", to: "/operations/sitreps", icon: "mdi:radio-tower" },
      { title: "After-Action Reports", to: "/operations/after-actions", icon: "mdi:file-chart-outline" },
      { title: "Case Inventory", to: "/operations/case-inventory", icon: "mdi:package-variant-closed" },
    ],
    social: [
      { title: "Overview", to: "/social", icon: "mdi:view-dashboard-outline" },
      { title: "Accounts", to: "/social/accounts", icon: "mdi:account-multiple-outline" },
      { title: "Posts", to: "/social/posts", icon: "mdi:message-text-outline" },
      { title: "Alerts", to: "/social/alerts", icon: "mdi:bell-outline" },
      { title: "Campaigns", to: "/social/campaigns", icon: "mdi:bullhorn-outline" },
    ],
  };

  export default {
    props: {
      collapsed: { type: Boolean, default: false },
    },
    emits: ["sidebarToggle", "collapseToggle"],
    components: { Icon, MenuAccordion },
    data() {
      return {
        canScrollPrev: false,
        canScrollNext: false,
      };
    },
    computed: {
      currentUser() {
        try {
          return JSON.parse(localStorage.getItem("auth_user") || "null");
        } catch {
          return null;
        }
      },
      accessibleModules() {
        return MODULES.filter((m) => {
          const user = this.currentUser;
          if (!user) return false;
          if (user.role === "admin") return true;
          return Boolean(user.modulePermissions?.[m.key]);
        });
      },
      isSystemAdmin() {
        return this.currentUser?.role === "admin";
      },
      activeModule() {
        return this.$route.meta?.module || null;
      },
      activeModuleTitle() {
        return MODULES.find((m) => m.key === this.activeModule)?.title || "";
      },
      moduleMenu() {
        return MODULE_MENUS[this.activeModule] || [];
      },
    },
    watch: {
      collapsed() {
        this.$nextTick(() => this.updateScrollState());
      },
      accessibleModules() {
        this.$nextTick(() => this.updateScrollState());
      },
    },
    methods: {
      updateScrollState() {
        const el = this.$refs.moduleScroller;
        if (!el) {
          this.canScrollPrev = false;
          this.canScrollNext = false;
          return;
        }
        this.canScrollPrev = el.scrollLeft > 2;
        this.canScrollNext = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      },
      scrollModules(direction) {
        const el = this.$refs.moduleScroller;
        if (!el) return;
        const firstChild = el.firstElementChild;
        const step = firstChild ? firstChild.clientWidth + 8 : 96;
        el.scrollBy({ left: direction * step, behavior: "smooth" });
      },
    },
    mounted() {
      this.$nextTick(() => this.updateScrollState());
      window.addEventListener("resize", this.updateScrollState);
    },
    beforeUnmount() {
      window.removeEventListener("resize", this.updateScrollState);
    },
  };
</script>

<style scoped>
.router-link-active {
  background-color: rgba(217, 119, 6, 0.12);
  color: #D97706;
  border-radius: 0.375rem;
}

.module-scroller {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.module-scroller::-webkit-scrollbar {
  display: none;
}

/* Custom amber scrollbar for the module nav list */
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(217, 119, 6, 0.45) transparent;
}
.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}
.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(217, 119, 6, 0.4);
  border-radius: 9999px;
  border: 1px solid rgba(28, 31, 40, 0.6);
}
.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(217, 119, 6, 0.8);
}
.sidebar-scroll::-webkit-scrollbar-thumb:active {
  background: #d97706;
}
</style>
