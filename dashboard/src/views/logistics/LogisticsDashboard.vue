<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header>
      <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Assets Management</p>
      <h1 class="mt-2 text-2xl font-semibold text-white">Operations Overview</h1>
    </header>

    <!-- KPI cards -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <router-link
        v-for="kpi in kpis"
        :key="kpi.key"
        :to="kpi.to"
        class="bg-case-surface border border-case-border rounded-xl p-4 hover:border-primary/40 transition-colors block">
        <div class="flex items-center justify-between mb-3">
          <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">{{ kpi.label }}</p>
          <Icon :icon="kpi.icon" class="text-gray-700 text-base" />
        </div>
        <p v-if="loading" class="h-8 w-12 animate-pulse rounded bg-case-elevated"></p>
        <template v-else>
          <p class="text-3xl font-bold leading-none" :class="kpi.colorClass">{{ kpi.value }}</p>
          <p v-if="kpi.subtitle" class="mt-2 text-[10px] text-gray-600">{{ kpi.subtitle }}</p>
        </template>
      </router-link>
    </section>

    <!-- Charts row -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Inventory by category donut -->
      <div class="bg-case-surface border border-case-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-white">Inventory by Category</h3>
            <p class="text-[10px] text-gray-600 mt-0.5">Distribution of stocked items</p>
          </div>
          <Icon icon="bi:three-dots-vertical" class="text-gray-700" />
        </div>
        <div v-if="loading" class="h-[260px] flex items-center justify-center">
          <div class="h-2 w-24 animate-pulse rounded-full bg-case-elevated"></div>
        </div>
        <div v-else-if="!categorySeries.length" class="h-[260px] flex items-center justify-center text-xs text-gray-600">
          No inventory data yet.
        </div>
        <apexchart v-else type="donut" height="260" :options="categoryDonutOptions" :series="categorySeries" />
      </div>

      <!-- Requisitions by status bar -->
      <div class="bg-case-surface border border-case-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-white">Requisitions by Status</h3>
            <p class="text-[10px] text-gray-600 mt-0.5">Throughput of supply requests</p>
          </div>
          <Icon icon="bi:three-dots-vertical" class="text-gray-700" />
        </div>
        <div v-if="loading" class="h-[260px] flex items-center justify-center">
          <div class="h-2 w-24 animate-pulse rounded-full bg-case-elevated"></div>
        </div>
        <div v-else-if="!requisitionStatusSeries[0].data.length" class="h-[260px] flex items-center justify-center text-xs text-gray-600">
          No requisitions yet.
        </div>
        <apexchart v-else type="bar" height="260" :options="requisitionBarOptions" :series="requisitionStatusSeries" />
      </div>
    </section>

    <!-- Recent activity row -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Low stock alerts -->
      <div class="bg-case-surface border border-case-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-white">Low Stock Alerts</h3>
            <p class="text-[10px] text-gray-600 mt-0.5">Items at or below minimum stock level</p>
          </div>
          <router-link to="/logistics/inventory" class="text-[10px] uppercase tracking-wide text-primary hover:underline">
            View inventory →
          </router-link>
        </div>
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded-lg bg-case-elevated"></div>
        </div>
        <ul v-else-if="data?.inventory?.lowStockItems?.length" class="divide-y divide-case-border">
          <li v-for="item in data.inventory.lowStockItems" :key="item._id" class="py-2.5 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-200 truncate">{{ item.name }}</p>
              <p class="text-[10px] text-gray-500">{{ item.sku || "—" }} · {{ item.location || "—" }}</p>
            </div>
            <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide flex-shrink-0"
              :class="item.status === 'out-of-stock' ? 'bg-red-950/40 text-red-400' : 'bg-amber-950/40 text-amber-400'">
              {{ item.quantity }} {{ item.unit }}
            </span>
          </li>
        </ul>
        <div v-else class="py-8 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:check-circle-outline" class="text-3xl text-emerald-500/60 mb-2" />
          <p class="text-xs text-gray-500">All stocked items are above minimum threshold.</p>
        </div>
      </div>

      <!-- Recent requisitions -->
      <div class="bg-case-surface border border-case-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-white">Recent Requisitions</h3>
            <p class="text-[10px] text-gray-600 mt-0.5">Latest supply requests</p>
          </div>
          <router-link to="/logistics/requisitions" class="text-[10px] uppercase tracking-wide text-primary hover:underline">
            View all →
          </router-link>
        </div>
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded-lg bg-case-elevated"></div>
        </div>
        <ul v-else-if="data?.requisitions?.recent?.length" class="divide-y divide-case-border">
          <li v-for="r in data.requisitions.recent" :key="r._id" class="py-2.5 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-200 truncate">{{ r.refNo || "—" }} · {{ r.requestor?.name || "Unknown" }}</p>
              <p class="text-[10px] text-gray-500 truncate">{{ r.purpose || "No purpose specified" }}</p>
            </div>
            <span class="rounded-full bg-case-elevated px-2 py-0.5 text-[10px] uppercase tracking-wide flex-shrink-0"
              :class="statusColor(r.status)">
              {{ r.status }}
            </span>
          </li>
        </ul>
        <div v-else class="py-8 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:clipboard-list-outline" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No requisitions filed yet.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";

  const CHART_FONT = "Lexend, sans-serif";
  const STATUS_COLOR_MAP = {
    pending: "text-amber-400",
    approved: "text-cyan-400",
    issued: "text-emerald-400",
    completed: "text-emerald-500",
    denied: "text-red-400",
    cancelled: "text-gray-500",
    returned: "text-gray-400",
    draft: "text-gray-500",
  };

  export default {
    name: "LogisticsDashboard",
    components: { Icon },
    data() {
      return {
        loading: false,
        error: "",
        data: null,
      };
    },
    computed: {
      kpis() {
        const inv = this.data?.inventory;
        const veh = this.data?.vehicles;
        const req = this.data?.requisitions;
        const sup = this.data?.suppliers;
        return [
          {
            key: "inventory",
            label: "Inventory Items",
            value: inv?.total ?? 0,
            subtitle: `${inv?.lowStockCount ?? 0} need restocking`,
            icon: "mdi:package-variant-closed",
            colorClass: "text-cyan-400",
            to: "/logistics/inventory",
          },
          {
            key: "vehicles",
            label: "Vehicles Available",
            value: veh?.byStatus?.find((s) => s._id === "available")?.count || 0,
            subtitle: `of ${veh?.total ?? 0} fleet`,
            icon: "mdi:truck-fast-outline",
            colorClass: "text-emerald-400",
            to: "/logistics/vehicles",
          },
          {
            key: "requisitions",
            label: "Pending Requisitions",
            value: req?.pendingCount ?? 0,
            subtitle: `${req?.total ?? 0} total filed`,
            icon: "mdi:clipboard-list-outline",
            colorClass: "text-primary",
            to: "/logistics/requisitions",
          },
          {
            key: "suppliers",
            label: "Active Suppliers",
            value: sup?.total ?? 0,
            subtitle: "in directory",
            icon: "mdi:account-tie-outline",
            colorClass: "text-gray-200",
            to: "/logistics/suppliers",
          },
        ];
      },
      categorySeries() {
        return this.data?.inventory?.byCategory?.map((c) => c.totalQuantity || c.count || 0) || [];
      },
      categoryDonutOptions() {
        const labels = this.data?.inventory?.byCategory?.map((c) => c._id || "uncategorized") || [];
        return {
          chart: { type: "donut", background: "transparent", fontFamily: CHART_FONT },
          colors: ["#D97706", "#06b6d4", "#10b981", "#8b5cf6", "#ef4444", "#f97316", "#ec4899", "#6366f1"],
          labels,
          dataLabels: { enabled: false },
          legend: { position: "bottom", labels: { colors: "#9ca3af" }, fontSize: "10px", fontFamily: CHART_FONT },
          plotOptions: {
            pie: {
              donut: {
                size: "60%",
                labels: { show: true, total: { show: true, label: "Total Qty", color: "#9ca3af", fontFamily: CHART_FONT, fontSize: "10px" } },
              },
            },
          },
          tooltip: { theme: "dark", style: { fontFamily: CHART_FONT } },
          stroke: { width: 2, colors: ["#1a1d24"] },
        };
      },
      requisitionStatusSeries() {
        const data = this.data?.requisitions?.byStatus?.map((s) => s.count) || [];
        return [{ name: "Requisitions", data }];
      },
      requisitionBarOptions() {
        const cats = this.data?.requisitions?.byStatus?.map((s) => s._id) || [];
        return {
          chart: { type: "bar", background: "transparent", toolbar: { show: false }, fontFamily: CHART_FONT },
          colors: ["#D97706"],
          plotOptions: { bar: { columnWidth: "55%", borderRadius: 3, borderRadiusApplication: "end" } },
          dataLabels: { enabled: false },
          grid: { borderColor: "#252830", strokeDashArray: 4 },
          xaxis: {
            categories: cats,
            labels: { style: { colors: "#64748b", fontSize: "10px", fontFamily: CHART_FONT } },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
          yaxis: {
            labels: { style: { colors: "#64748b", fontSize: "10px", fontFamily: CHART_FONT }, formatter: (v) => Math.round(v) },
            min: 0,
          },
          tooltip: { theme: "dark", style: { fontFamily: CHART_FONT } },
        };
      },
    },
    methods: {
      statusColor(status) {
        return STATUS_COLOR_MAP[status] || "text-gray-400";
      },
      async load() {
        this.loading = true;
        this.error = "";
        try {
          const res = await API.get("/logistics/overview");
          this.data = res.data;
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load logistics overview.";
        } finally {
          this.loading = false;
        }
      },
    },
    mounted() {
      this.load();
    },
  };
</script>
