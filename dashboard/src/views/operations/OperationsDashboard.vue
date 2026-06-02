<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header>
      <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Operations</p>
      <h1 class="mt-2 text-2xl font-semibold text-white">Active Theatre Overview</h1>
    </header>

    <section class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <router-link v-for="kpi in kpis" :key="kpi.key" :to="kpi.to"
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

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-case-surface border border-case-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-white">Missions by Status</h3>
        </div>
        <div v-if="loading" class="h-[240px] flex items-center justify-center">
          <div class="h-2 w-24 animate-pulse rounded-full bg-case-elevated"></div>
        </div>
        <div v-else-if="!missionStatusSeries[0].data.length" class="h-[240px] flex items-center justify-center text-xs text-gray-600">
          No missions yet.
        </div>
        <apexchart v-else type="bar" height="240" :options="missionStatusOptions" :series="missionStatusSeries" />
      </div>

      <div class="bg-case-surface border border-case-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-white">SITREPs by Severity</h3>
        </div>
        <div v-if="loading" class="h-[240px] flex items-center justify-center">
          <div class="h-2 w-24 animate-pulse rounded-full bg-case-elevated"></div>
        </div>
        <div v-else-if="!sitrepLevelSeries.length" class="h-[240px] flex items-center justify-center text-xs text-gray-600">
          No SITREPs yet.
        </div>
        <apexchart v-else type="donut" height="240" :options="sitrepLevelOptions" :series="sitrepLevelSeries" />
      </div>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-case-surface border border-case-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-white">Active Missions</h3>
          <router-link to="/operations/missions" class="text-[10px] uppercase tracking-wide text-primary hover:underline">View all →</router-link>
        </div>
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded bg-case-elevated"></div>
        </div>
        <ul v-else-if="data?.missions?.active?.length" class="divide-y divide-case-border">
          <li v-for="m in data.missions.active" :key="m._id" class="py-2.5 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-200 truncate">{{ m.codeName }}</p>
              <p class="text-[10px] text-gray-500">{{ m.missionId }} · {{ m.commander || "—" }}</p>
            </div>
            <span class="rounded-full bg-emerald-950/40 px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium text-emerald-400 flex-shrink-0">
              {{ m.type }}
            </span>
          </li>
        </ul>
        <div v-else class="py-8 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:target" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No active missions.</p>
        </div>
      </div>

      <div class="bg-case-surface border border-case-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-white">Recent SITREPs</h3>
          <router-link to="/operations/sitreps" class="text-[10px] uppercase tracking-wide text-primary hover:underline">View all →</router-link>
        </div>
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded bg-case-elevated"></div>
        </div>
        <ul v-else-if="data?.sitreps?.recent?.length" class="divide-y divide-case-border">
          <li v-for="s in data.sitreps.recent" :key="s._id" class="py-2.5 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-200 truncate">{{ s.title }}</p>
              <p class="text-[10px] text-gray-500 truncate">{{ s.missionCodeName }} · {{ s.reportedBy || "—" }}</p>
            </div>
            <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium flex-shrink-0" :class="levelBadge(s.level)">
              {{ s.level }}
            </span>
          </li>
        </ul>
        <div v-else class="py-8 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:radio-tower" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No SITREPs filed.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";

  const CHART_FONT = "Lexend, sans-serif";
  const LEVEL_BADGE = {
    routine: "bg-case-elevated text-gray-400",
    advisory: "bg-cyan-950/40 text-cyan-400",
    warning: "bg-amber-950/40 text-amber-400",
    critical: "bg-red-950/40 text-red-400",
  };

  export default {
    name: "OperationsDashboard",
    components: { Icon },
    data() { return { loading: false, error: "", data: null }; },
    computed: {
      kpis() {
        const m = this.data?.missions, d = this.data?.deployments, s = this.data?.sitreps, a = this.data?.afterAction;
        return [
          { key: "active", label: "Active Missions", value: m?.activeCount || 0, subtitle: `of ${m?.total || 0} total`, icon: "mdi:target", colorClass: "text-emerald-400", to: "/operations/missions" },
          { key: "deployed", label: "Personnel Deployed", value: d?.deployedCount || 0, subtitle: `${d?.total || 0} deployments logged`, icon: "mdi:account-group-outline", colorClass: "text-cyan-400", to: "/operations/deployments" },
          { key: "critical", label: "Critical SITREPs", value: s?.criticalCount || 0, subtitle: `${s?.total || 0} total filed`, icon: "mdi:alert", colorClass: "text-red-400", to: "/operations/sitreps" },
          { key: "aar", label: "AARs Pending", value: a?.pendingCount || 0, subtitle: "awaiting approval", icon: "mdi:file-document-check-outline", colorClass: "text-primary", to: "/operations/after-actions" },
        ];
      },
      missionStatusSeries() {
        return [{ name: "Missions", data: this.data?.missions?.byStatus?.map((s) => s.count) || [] }];
      },
      missionStatusOptions() {
        const cats = this.data?.missions?.byStatus?.map((s) => s._id) || [];
        return {
          chart: { type: "bar", background: "transparent", toolbar: { show: false }, fontFamily: CHART_FONT },
          colors: ["#D97706"],
          plotOptions: { bar: { columnWidth: "55%", borderRadius: 3, borderRadiusApplication: "end" } },
          dataLabels: { enabled: false },
          grid: { borderColor: "#252830", strokeDashArray: 4 },
          xaxis: { categories: cats, labels: { style: { colors: "#64748b", fontSize: "10px", fontFamily: CHART_FONT } }, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { style: { colors: "#64748b", fontSize: "10px", fontFamily: CHART_FONT }, formatter: (v) => Math.round(v) }, min: 0 },
          tooltip: { theme: "dark", style: { fontFamily: CHART_FONT } },
        };
      },
      sitrepLevelSeries() { return this.data?.sitreps?.byLevel?.map((s) => s.count) || []; },
      sitrepLevelOptions() {
        const labels = this.data?.sitreps?.byLevel?.map((s) => s._id) || [];
        return {
          chart: { type: "donut", background: "transparent", fontFamily: CHART_FONT },
          colors: ["#9ca3af", "#06b6d4", "#f59e0b", "#ef4444"],
          labels,
          dataLabels: { enabled: false },
          legend: { position: "bottom", labels: { colors: "#9ca3af" }, fontSize: "10px", fontFamily: CHART_FONT },
          plotOptions: { pie: { donut: { size: "60%" } } },
          tooltip: { theme: "dark", style: { fontFamily: CHART_FONT } },
          stroke: { width: 2, colors: ["#1a1d24"] },
        };
      },
    },
    methods: {
      levelBadge(level) { return LEVEL_BADGE[level] || "bg-case-elevated text-gray-400"; },
      async load() {
        this.loading = true;
        try {
          const res = await API.get("/operations/overview");
          this.data = res.data;
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load overview.";
        } finally { this.loading = false; }
      },
    },
    mounted() { this.load(); },
  };
</script>
