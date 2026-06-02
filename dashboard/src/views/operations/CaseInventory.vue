<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Operations</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Case Inventory</h1>
        <p class="mt-1 text-xs text-gray-500">Read-only view of supplies, ICT assets and vehicles tagged for case operations. Maintained in Assets Management.</p>
      </div>
    </header>

    <!-- Tabs -->
    <div class="border-b border-case-border">
      <div class="flex flex-wrap gap-1">
        <button v-for="t in tabs" :key="t.key" @click="setTab(t.key)" type="button"
          class="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors border-b-2 -mb-px flex items-center gap-2"
          :class="activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'">
          <Icon :icon="t.icon" /> {{ t.label }}
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" :placeholder="searchPlaceholder"
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
      </div>
      <span class="text-[10px] uppercase tracking-[0.25em] text-gray-600">{{ items.length }} record{{ items.length === 1 ? "" : "s" }}</span>
    </div>

    <!-- Body -->
    <section class="bg-case-surface border border-case-border rounded-xl">
      <div class="p-5">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded bg-case-elevated"></div>
        </div>
        <div v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</div>

        <!-- Inventory table -->
        <div v-else-if="activeTab === 'inventory'" class="overflow-x-auto">
          <table v-if="items.length" class="w-full text-sm">
            <thead>
              <tr class="border-b border-case-border">
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">SKU</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Name</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Category</th>
                <th class="py-2.5 px-3 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Qty</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Location</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in items" :key="it._id" class="border-b border-case-border/40 hover:bg-case-card transition-colors">
                <td class="py-2.5 px-3 text-gray-500 text-xs font-mono">{{ it.sku || "—" }}</td>
                <td class="py-2.5 px-3 text-gray-200 font-medium">{{ it.name }}</td>
                <td class="py-2.5 px-3 text-gray-500 text-xs capitalize">{{ it.category }}</td>
                <td class="py-2.5 px-3 text-right text-gray-300">{{ it.quantity }} <span class="text-[10px] text-gray-600">{{ it.unit }}</span></td>
                <td class="py-2.5 px-3 text-gray-500 text-xs">{{ it.location || "—" }}</td>
                <td class="py-2.5 px-3">
                  <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="invStatusBadge(it.status)">{{ it.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="py-12 flex flex-col items-center justify-center text-center">
            <Icon icon="mdi:package-variant" class="text-3xl text-gray-700 mb-2" />
            <p class="text-xs text-gray-500">No case inventory items found.</p>
          </div>
        </div>

        <!-- ICT table -->
        <div v-else-if="activeTab === 'ict'" class="overflow-x-auto">
          <table v-if="items.length" class="w-full text-sm">
            <thead>
              <tr class="border-b border-case-border">
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium w-14">Photo</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Tag</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Asset</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Category</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Serial</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Assigned</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in items" :key="it._id" class="border-b border-case-border/40 hover:bg-case-card transition-colors">
                <td class="py-2.5 px-3">
                  <div class="h-10 w-10 rounded-md border border-case-border bg-case-card overflow-hidden flex items-center justify-center">
                    <img v-if="it.photoUrl" :src="it.photoUrl" :alt="it.name" class="h-full w-full object-cover" @click="openPhoto(it.photoUrl)" />
                    <Icon v-else icon="mdi:devices" class="text-gray-700 text-lg" />
                  </div>
                </td>
                <td class="py-2.5 px-3 text-primary text-xs font-mono">{{ it.assetTag }}</td>
                <td class="py-2.5 px-3 text-gray-200 font-medium">
                  <div>{{ it.name }}</div>
                  <div class="text-[10px] text-gray-600">{{ [it.brand, it.model].filter(Boolean).join(" · ") || "—" }}</div>
                </td>
                <td class="py-2.5 px-3 text-gray-500 text-xs capitalize">{{ it.category }}</td>
                <td class="py-2.5 px-3 text-gray-500 text-xs font-mono">{{ it.serialNo || "—" }}</td>
                <td class="py-2.5 px-3 text-gray-300 text-xs">
                  <div>{{ it.assignedTo || "—" }}</div>
                  <div v-if="it.department" class="text-[10px] text-gray-600">{{ it.department }}</div>
                </td>
                <td class="py-2.5 px-3">
                  <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="ictStatusBadge(it.status)">{{ it.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="py-12 flex flex-col items-center justify-center text-center">
            <Icon icon="mdi:laptop" class="text-3xl text-gray-700 mb-2" />
            <p class="text-xs text-gray-500">No case ICT assets found.</p>
          </div>
        </div>

        <!-- Vehicles table -->
        <div v-else-if="activeTab === 'vehicles'" class="overflow-x-auto">
          <table v-if="items.length" class="w-full text-sm">
            <thead>
              <tr class="border-b border-case-border">
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium w-16">Photo</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Plate/CS No.</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Make/Model</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Type</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Driver</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Unit</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in items" :key="v._id" class="border-b border-case-border/40 hover:bg-case-card transition-colors">
                <td class="py-2.5 px-3">
                  <div class="h-10 w-14 rounded border border-case-border bg-case-card overflow-hidden flex items-center justify-center">
                    <img v-if="v.photoUrl" :src="v.photoUrl" :alt="v.plateNo" class="h-full w-full object-cover" @click="openPhoto(v.photoUrl)" />
                    <Icon v-else icon="mdi:truck-fast-outline" class="text-gray-700 text-base" />
                  </div>
                </td>
                <td class="py-2.5 px-3 font-mono text-gray-100">{{ v.plateNo }}</td>
                <td class="py-2.5 px-3 text-gray-200">{{ [v.make, v.model].filter(Boolean).join(" ") || "—" }}</td>
                <td class="py-2.5 px-3 text-gray-500 text-xs capitalize">{{ v.type }}</td>
                <td class="py-2.5 px-3 text-gray-300 text-xs">{{ v.currentDriver || "—" }}</td>
                <td class="py-2.5 px-3 text-gray-300 text-xs">{{ v.assignedUnit || "—" }}</td>
                <td class="py-2.5 px-3">
                  <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="vehicleStatusBadge(v.status)">{{ v.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="py-12 flex flex-col items-center justify-center text-center">
            <Icon icon="mdi:truck-fast-outline" class="text-3xl text-gray-700 mb-2" />
            <p class="text-xs text-gray-500">No case vehicles found.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";

  export default {
    name: "OperationsCaseInventory",
    components: { Icon },
    data() {
      return {
        activeTab: "inventory",
        tabs: [
          { key: "inventory", label: "Inventory", icon: "mdi:package-variant-closed" },
          { key: "ict", label: "ICT", icon: "mdi:laptop" },
          { key: "vehicles", label: "Fleet & Vehicles", icon: "mdi:truck-fast-outline" },
        ],
        items: [], loading: false, error: "",
        searchQuery: "", searchDebounce: null,
      };
    },
    computed: {
      searchPlaceholder() {
        if (this.activeTab === "inventory") return "Search by name, SKU, location...";
        if (this.activeTab === "ict") return "Search by tag, serial, hostname, assignee...";
        return "Search by plate, owner, driver, make...";
      },
    },
    methods: {
      invStatusBadge(s) {
        const map = {
          "in-stock": "bg-emerald-950/40 text-emerald-400",
          "low-stock": "bg-amber-950/40 text-amber-400",
          "out-of-stock": "bg-red-950/40 text-red-400",
          "retired": "bg-case-elevated text-gray-500",
        };
        return map[s] || "bg-case-elevated text-gray-400";
      },
      ictStatusBadge(s) {
        const map = {
          "in-use": "bg-emerald-950/40 text-emerald-400",
          "deployed": "bg-emerald-950/40 text-emerald-400",
          "in-storage": "bg-sky-950/40 text-sky-400",
          "for-repair": "bg-amber-950/40 text-amber-400",
          "for-disposal": "bg-orange-950/40 text-orange-400",
          "retired": "bg-case-elevated text-gray-500",
          "lost": "bg-red-950/40 text-red-400",
        };
        return map[s] || "bg-case-elevated text-gray-400";
      },
      vehicleStatusBadge(s) {
        const map = {
          available: "bg-emerald-950/40 text-emerald-400",
          dispatched: "bg-cyan-950/40 text-cyan-400",
          maintenance: "bg-amber-950/40 text-amber-400",
          retired: "bg-case-elevated text-gray-500",
        };
        return map[s] || "bg-case-elevated text-gray-400";
      },
      openPhoto(url) { if (url) window.open(url, "_blank", "noopener"); },
      setTab(key) {
        if (this.activeTab === key) return;
        this.activeTab = key;
        this.searchQuery = "";
        this.load();
      },
      onSearchInput() {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => this.load(), 300);
      },
      async load() {
        this.loading = true; this.error = "";
        try {
          const params = new URLSearchParams();
          if (this.searchQuery.trim()) params.set("q", this.searchQuery.trim());
          const path = `/operations/case-inventory/${this.activeTab}`;
          const res = await API.get(`${path}${params.toString() ? `?${params}` : ""}`);
          this.items = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.items = [];
          this.error = err.response?.data?.message || "Unable to load case inventory.";
        } finally {
          this.loading = false;
        }
      },
    },
    mounted() { this.load(); },
  };
</script>
