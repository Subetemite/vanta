<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header>
      <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Social Media Intelligence</p>
      <h1 class="mt-2 text-2xl font-semibold text-white">Monitoring Overview</h1>
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
        <h3 class="text-sm font-semibold text-white mb-4">Accounts by Platform</h3>
        <div v-if="loading" class="h-[240px] flex items-center justify-center">
          <div class="h-2 w-24 animate-pulse rounded-full bg-case-elevated"></div>
        </div>
        <div v-else-if="!platformSeries.length" class="h-[240px] flex items-center justify-center text-xs text-gray-600">No accounts yet.</div>
        <apexchart v-else type="donut" height="240" :options="platformOptions" :series="platformSeries" />
      </div>
      <div class="bg-case-surface border border-case-border rounded-xl p-5">
        <h3 class="text-sm font-semibold text-white mb-4">Alerts by Severity</h3>
        <div v-if="loading" class="h-[240px] flex items-center justify-center">
          <div class="h-2 w-24 animate-pulse rounded-full bg-case-elevated"></div>
        </div>
        <div v-else-if="!alertSeries[0].data.length" class="h-[240px] flex items-center justify-center text-xs text-gray-600">No alerts yet.</div>
        <apexchart v-else type="bar" height="240" :options="alertOptions" :series="alertSeries" />
      </div>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-case-surface border border-case-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-white">Recent Alerts</h3>
          <router-link to="/social/alerts" class="text-[10px] uppercase tracking-wide text-primary hover:underline">View all →</router-link>
        </div>
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded bg-case-elevated"></div>
        </div>
        <ul v-else-if="data?.alerts?.recent?.length" class="divide-y divide-case-border">
          <li v-for="a in data.alerts.recent" :key="a._id" class="py-2.5 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-200 truncate">{{ a.title }}</p>
              <p class="text-[10px] text-gray-500">{{ a.platform || a.type }} · {{ formatDate(a.detectedAt) }}</p>
            </div>
            <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium flex-shrink-0" :class="severityBadge(a.severity)">{{ a.severity }}</span>
          </li>
        </ul>
        <div v-else class="py-8 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:bell-outline" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No alerts raised.</p>
        </div>
      </div>

      <div class="bg-case-surface border border-case-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-white">Active Campaigns</h3>
          <router-link to="/social/campaigns" class="text-[10px] uppercase tracking-wide text-primary hover:underline">View all →</router-link>
        </div>
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded bg-case-elevated"></div>
        </div>
        <ul v-else-if="data?.campaigns?.active?.length" class="divide-y divide-case-border">
          <li v-for="c in data.campaigns.active" :key="c._id" class="py-2.5 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-200 truncate">{{ c.name }}</p>
              <p class="text-[10px] text-gray-500 truncate">{{ c.objective }}</p>
            </div>
            <span class="rounded-full bg-emerald-950/40 px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium text-emerald-400 flex-shrink-0">{{ c.status }}</span>
          </li>
        </ul>
        <div v-else class="py-8 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:bullhorn-outline" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No active campaigns.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";

  const CHART_FONT = "Lexend, sans-serif";
  const SEVERITY_BADGE = {
    low: "bg-case-elevated text-gray-400",
    medium: "bg-cyan-950/40 text-cyan-400",
    high: "bg-amber-950/40 text-amber-400",
    critical: "bg-red-950/40 text-red-400",
  };

  export default {
    name: "SocialDashboard",
    components: { Icon },
    data() { return { loading: false, error: "", data: null }; },
    computed: {
      kpis() {
        const a = this.data?.accounts, p = this.data?.posts, al = this.data?.alerts, c = this.data?.campaigns;
        return [
          { key: "accounts", label: "Monitored Accounts", value: a?.total || 0, subtitle: `${(a?.byPlatform || []).length} platforms`, icon: "mdi:account-search-outline", colorClass: "text-cyan-400", to: "/social/accounts" },
          { key: "posts", label: "Captured Posts", value: p?.total || 0, subtitle: `${p?.flaggedCount || 0} flagged`, icon: "mdi:post-outline", colorClass: "text-emerald-400", to: "/social/posts" },
          { key: "alerts", label: "Open Alerts", value: al?.newCount || 0, subtitle: `${al?.criticalCount || 0} critical`, icon: "mdi:alert-octagon-outline", colorClass: "text-red-400", to: "/social/alerts" },
          { key: "campaigns", label: "Active Campaigns", value: c?.activeCount || 0, subtitle: `of ${c?.total || 0} total`, icon: "mdi:bullhorn-outline", colorClass: "text-primary", to: "/social/campaigns" },
        ];
      },
      platformSeries() { return this.data?.accounts?.byPlatform?.map((p) => p.count) || []; },
      platformOptions() {
        const labels = this.data?.accounts?.byPlatform?.map((p) => p._id) || [];
        return {
          chart: { type: "donut", background: "transparent", fontFamily: CHART_FONT },
          colors: ["#D97706", "#06b6d4", "#10b981", "#8b5cf6", "#ef4444", "#f97316", "#ec4899", "#6366f1", "#84cc16"],
          labels,
          dataLabels: { enabled: false },
          legend: { position: "bottom", labels: { colors: "#9ca3af" }, fontSize: "10px", fontFamily: CHART_FONT },
          plotOptions: { pie: { donut: { size: "60%" } } },
          tooltip: { theme: "dark", style: { fontFamily: CHART_FONT } },
          stroke: { width: 2, colors: ["#1a1d24"] },
        };
      },
      alertSeries() {
        return [{ name: "Alerts", data: this.data?.alerts?.bySeverity?.map((s) => s.count) || [] }];
      },
      alertOptions() {
        const cats = this.data?.alerts?.bySeverity?.map((s) => s._id) || [];
        return {
          chart: { type: "bar", background: "transparent", toolbar: { show: false }, fontFamily: CHART_FONT },
          colors: ["#D97706"],
          plotOptions: { bar: { columnWidth: "50%", borderRadius: 3, borderRadiusApplication: "end", distributed: true } },
          dataLabels: { enabled: false },
          grid: { borderColor: "#252830", strokeDashArray: 4 },
          xaxis: { categories: cats, labels: { style: { colors: "#64748b", fontSize: "10px", fontFamily: CHART_FONT } }, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { style: { colors: "#64748b", fontSize: "10px", fontFamily: CHART_FONT }, formatter: (v) => Math.round(v) }, min: 0 },
          legend: { show: false },
          tooltip: { theme: "dark", style: { fontFamily: CHART_FONT } },
        };
      },
    },
    methods: {
      severityBadge(s) { return SEVERITY_BADGE[s] || "bg-case-elevated text-gray-400"; },
      formatDate(d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"; },
      async load() {
        this.loading = true;
        try { const res = await API.get("/social/overview"); this.data = res.data; }
        catch (err) { this.error = err.response?.data?.message || "Unable to load."; }
        finally { this.loading = false; }
      },
    },
    mounted() { this.load(); },
  };
</script>
