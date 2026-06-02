<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Administration Overview</h1>
        <p class="mt-1 text-sm text-gray-500">Summary across HRIS, DTR, OPCR, Calendar, and Documents Tracking.</p>
      </div>
      <button
        type="button"
        class="rounded-xl border border-case-border bg-case-surface px-4 py-2 text-sm text-gray-300 hover:bg-case-card disabled:opacity-50"
        :disabled="isLoading"
        @click="loadOverview"
      >
        {{ isLoading ? "Refreshing..." : "Refresh" }}
      </button>
    </header>

    <div v-if="errorMessage" class="mb-4 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
      {{ errorMessage }}
    </div>

    <!-- KPI tiles -->
    <section class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="kpi in kpis" :key="kpi.label" class="rounded-2xl border border-case-border bg-case-surface p-5">
        <div class="flex items-center justify-between">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon :icon="kpi.icon" class="text-xl" />
          </span>
          <span class="text-xs uppercase tracking-[0.2em] text-gray-500">{{ kpi.scope }}</span>
        </div>
        <p class="mt-4 text-3xl font-semibold text-white tabular-nums">{{ kpi.value }}</p>
        <p class="mt-1 text-sm text-gray-400">{{ kpi.label }}</p>
        <p v-if="kpi.detail" class="mt-1 text-xs text-gray-500">{{ kpi.detail }}</p>
      </div>
    </section>

    <!-- Charts grid -->
    <section class="mb-6 grid gap-4 lg:grid-cols-2">
      <!-- Employees by status -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5">
        <header class="mb-3 flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">HRIS</p>
            <h3 class="mt-1 text-base font-semibold text-white">Employees by Status</h3>
          </div>
          <span class="text-xs text-gray-500">{{ data?.hris?.totalEmployees || 0 }} total</span>
        </header>
        <apexchart
          v-if="employeesByStatus.series.length"
          height="260"
          type="donut"
          :options="employeesByStatus.options"
          :series="employeesByStatus.series"
        />
        <p v-else class="rounded-xl border border-dashed border-case-border px-4 py-10 text-center text-xs text-gray-600">
          No employees yet.
        </p>
      </div>

      <!-- Documents tracking per month -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5">
        <header class="mb-3 flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Documents Tracking</p>
            <h3 class="mt-1 text-base font-semibold text-white">Records per Month</h3>
          </div>
          <span class="text-xs text-gray-500">{{ data?.documents?.thisMonth || 0 }} this month</span>
        </header>
        <apexchart
          v-if="documentsByMonth.series[0].data.length"
          height="260"
          type="bar"
          :options="documentsByMonth.options"
          :series="documentsByMonth.series"
        />
        <p v-else class="rounded-xl border border-dashed border-case-border px-4 py-10 text-center text-xs text-gray-600">
          No data yet.
        </p>
      </div>

      <!-- OPCR by status -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5">
        <header class="mb-3 flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">OPCR</p>
            <h3 class="mt-1 text-base font-semibold text-white">Status Breakdown</h3>
          </div>
          <span class="text-xs text-gray-500">Avg rating: <span class="font-semibold text-primary tabular-nums">{{ data?.opcr?.avgOverallRating ? data.opcr.avgOverallRating.toFixed(2) : "—" }}</span></span>
        </header>
        <apexchart
          v-if="opcrByStatus.series.length"
          height="260"
          type="donut"
          :options="opcrByStatus.options"
          :series="opcrByStatus.series"
        />
        <p v-else class="rounded-xl border border-dashed border-case-border px-4 py-10 text-center text-xs text-gray-600">
          No OPCR records yet.
        </p>
      </div>

      <!-- Leaves by type -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5">
        <header class="mb-3 flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">DTR</p>
            <h3 class="mt-1 text-base font-semibold text-white">Top Leave Types</h3>
          </div>
          <span class="text-xs text-gray-500">{{ data?.dtr?.onLeaveToday || 0 }} on leave today</span>
        </header>
        <apexchart
          v-if="leavesByType.series[0].data.length"
          height="260"
          type="bar"
          :options="leavesByType.options"
          :series="leavesByType.series"
        />
        <p v-else class="rounded-xl border border-dashed border-case-border px-4 py-10 text-center text-xs text-gray-600">
          No leaves recorded.
        </p>
      </div>
    </section>

    <!-- Today's status strip + Calendar peek -->
    <section class="mb-6 grid gap-4 lg:grid-cols-3">
      <div class="rounded-2xl border border-case-border bg-case-surface p-5 lg:col-span-2">
        <header class="mb-3 flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">DTR · Today's Activity</p>
            <h3 class="mt-1 text-base font-semibold text-white">Who's where</h3>
          </div>
          <router-link to="/admin/dtr" class="text-xs text-primary hover:underline">View DTR →</router-link>
        </header>
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-case-border bg-case-card p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-rose-300">On Leave</p>
            <p class="mt-2 text-2xl font-semibold text-white tabular-nums">{{ data?.dtr?.onLeaveToday || 0 }}</p>
          </div>
          <div class="rounded-xl border border-case-border bg-case-card p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-blue-300">Special Orders</p>
            <p class="mt-2 text-2xl font-semibold text-white tabular-nums">{{ data?.dtr?.activeSpecialOrders || 0 }}</p>
          </div>
          <div class="rounded-xl border border-case-border bg-case-card p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-emerald-300">Operations</p>
            <p class="mt-2 text-2xl font-semibold text-white tabular-nums">{{ data?.dtr?.activeOperations || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-case-border bg-case-surface p-5">
        <header class="mb-3 flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Calendar</p>
            <h3 class="mt-1 text-base font-semibold text-white">Next 7 Days</h3>
          </div>
          <router-link to="/admin/calendar" class="text-xs text-primary hover:underline">Open →</router-link>
        </header>
        <p class="text-3xl font-semibold text-white tabular-nums">{{ data?.calendar?.upcomingWeek || 0 }}</p>
        <p class="mt-1 text-sm text-gray-400">activities upcoming</p>
        <ul v-if="activityTypeBreakdown.length" class="mt-4 space-y-1.5 text-xs text-gray-400">
          <li v-for="r in activityTypeBreakdown" :key="r.type" class="flex items-center justify-between">
            <span>{{ r.type }}</span>
            <span class="tabular-nums text-gray-500">{{ r.count }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Quick links -->
    <section>
      <h3 class="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Modules</h3>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <router-link
          v-for="f in features"
          :key="f.to"
          :to="f.to"
          class="group rounded-2xl border border-case-border bg-case-surface p-5 transition hover:border-primary/40 hover:bg-case-card"
        >
          <div class="flex items-center justify-between">
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon :icon="f.icon" class="text-xl" />
            </span>
            <Icon icon="mdi:arrow-top-right" class="text-base text-gray-600 group-hover:text-primary" />
          </div>
          <h4 class="mt-4 text-base font-semibold text-white">{{ f.title }}</h4>
          <p class="mt-1 text-xs leading-relaxed text-gray-500">{{ f.description }}</p>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";

  const STATUS_COLORS = {
    Active: "#10b981",
    "On Leave": "#f59e0b",
    Resigned: "#9ca3af",
    Retired: "#3b82f6",
    Terminated: "#ef4444",
  };
  const OPCR_COLORS = { Draft: "#9ca3af", Submitted: "#f59e0b", Approved: "#10b981" };

  const baseChartTheme = {
    chart: {
      foreColor: "#9ca3af",
      toolbar: { show: false },
      animations: { enabled: false },
      background: "transparent",
    },
    grid: { borderColor: "#252830" },
    tooltip: { theme: "dark" },
    legend: { labels: { colors: "#9ca3af" }, markers: { width: 8, height: 8 } },
    dataLabels: { enabled: false },
  };

  export default {
    name: "AdminDashboard",
    components: { Icon },
    data() {
      return {
        data: null,
        isLoading: false,
        errorMessage: "",
        features: [
          { title: "HRIS", to: "/admin/hris", icon: "mdi:account-box-multiple-outline", description: "Personnel records and 201 file documents." },
          { title: "DTR", to: "/admin/dtr", icon: "mdi:clock-outline", description: "Time logs, leaves, special orders, operations." },
          { title: "OPCR", to: "/admin/opcr", icon: "mdi:chart-line", description: "Office performance commitment and review." },
          { title: "Calendar", to: "/admin/calendar", icon: "mdi:calendar-month-outline", description: "Activities, meetings, and personnel status." },
          { title: "Documents Tracking", to: "/admin/documents", icon: "mdi:file-send-outline", description: "PAOCC routing records and routing logs." },
        ],
      };
    },
    computed: {
      kpis() {
        const d = this.data;
        return [
          {
            scope: "HRIS",
            label: "Total Employees",
            icon: "mdi:account-multiple-outline",
            value: d?.hris?.totalEmployees ?? 0,
            detail: `${d?.hris?.byStatus?.Active || 0} active`,
          },
          {
            scope: "Documents",
            label: "Records This Month",
            icon: "mdi:file-send-outline",
            value: d?.documents?.thisMonth ?? 0,
            detail: `${d?.documents?.total || 0} all-time`,
          },
          {
            scope: "OPCR",
            label: "Pending Review",
            icon: "mdi:chart-line",
            value: d?.opcr?.byStatus?.Submitted ?? 0,
            detail: `${d?.opcr?.byStatus?.Approved || 0} approved · ${d?.opcr?.byStatus?.Draft || 0} drafts`,
          },
          {
            scope: "Calendar",
            label: "Upcoming (7 days)",
            icon: "mdi:calendar-month-outline",
            value: d?.calendar?.upcomingWeek ?? 0,
          },
        ];
      },
      employeesByStatus() {
        const map = this.data?.hris?.byStatus || {};
        const labels = Object.keys(map);
        const series = labels.map((k) => map[k]);
        const colors = labels.map((k) => STATUS_COLORS[k] || "#6b7280");
        return {
          series,
          options: {
            ...baseChartTheme,
            chart: { ...baseChartTheme.chart, type: "donut" },
            labels,
            colors,
            stroke: { colors: ["#111318"], width: 2 },
            plotOptions: {
              pie: {
                donut: {
                  size: "65%",
                  labels: {
                    show: true,
                    total: { show: true, label: "Total", color: "#9ca3af", formatter: () => series.reduce((a, b) => a + b, 0) },
                    value: { color: "#ffffff" },
                  },
                },
              },
            },
            legend: { ...baseChartTheme.legend, position: "bottom" },
          },
        };
      },
      opcrByStatus() {
        const map = this.data?.opcr?.byStatus || {};
        const labels = Object.keys(map);
        const series = labels.map((k) => map[k]);
        const colors = labels.map((k) => OPCR_COLORS[k] || "#6b7280");
        return {
          series,
          options: {
            ...baseChartTheme,
            chart: { ...baseChartTheme.chart, type: "donut" },
            labels,
            colors,
            stroke: { colors: ["#111318"], width: 2 },
            plotOptions: {
              pie: {
                donut: {
                  size: "65%",
                  labels: {
                    show: true,
                    total: { show: true, label: "Total", color: "#9ca3af", formatter: () => series.reduce((a, b) => a + b, 0) },
                    value: { color: "#ffffff" },
                  },
                },
              },
            },
            legend: { ...baseChartTheme.legend, position: "bottom" },
          },
        };
      },
      documentsByMonth() {
        const months = this.data?.documents?.byMonth || [];
        return {
          series: [{ name: "Records", data: months.map((m) => m.count) }],
          options: {
            ...baseChartTheme,
            chart: { ...baseChartTheme.chart, type: "bar" },
            colors: ["#D97706"],
            xaxis: {
              categories: months.map((m) => m.label),
              labels: { style: { colors: "#9ca3af", fontSize: "11px" } },
              axisBorder: { color: "#252830" },
              axisTicks: { color: "#252830" },
            },
            yaxis: {
              labels: { style: { colors: "#9ca3af", fontSize: "11px" } },
            },
            plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } },
          },
        };
      },
      leavesByType() {
        const items = this.data?.dtr?.leavesByType || [];
        return {
          series: [{ name: "Leaves", data: items.map((i) => i.count) }],
          options: {
            ...baseChartTheme,
            chart: { ...baseChartTheme.chart, type: "bar" },
            colors: ["#f43f5e"],
            xaxis: {
              categories: items.map((i) => i.type),
              labels: { style: { colors: "#9ca3af", fontSize: "11px" } },
              axisBorder: { color: "#252830" },
              axisTicks: { color: "#252830" },
            },
            yaxis: { labels: { style: { colors: "#9ca3af", fontSize: "11px" } } },
            plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
          },
        };
      },
      activityTypeBreakdown() {
        const map = this.data?.calendar?.byType || {};
        return Object.entries(map)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count);
      },
    },
    methods: {
      async loadOverview() {
        this.isLoading = true;
        this.errorMessage = "";
        try {
          const res = await API.get("/admin/overview");
          this.data = res.data || null;
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to load overview.";
        } finally {
          this.isLoading = false;
        }
      },
    },
    mounted() {
      this.loadOverview();
    },
  };
</script>
