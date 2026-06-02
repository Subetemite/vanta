<template>
  <div class="min-h-screen p-3 sm:p-5 space-y-4">

    <!-- ── Filter bar ───────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center gap-3">
      <button class="flex items-center gap-2 rounded-md border border-case-border bg-case-surface px-4 py-2 text-sm text-primary hover:bg-case-elevated transition-colors">
        <Icon icon="ic:outline-folder-open" class="text-base" />
        Case Reports
      </button>
      <select class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-sm text-gray-400 focus:border-primary focus:outline-none appearance-none pr-8 cursor-pointer">
        <option value="">Severity</option>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>
      <select class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-sm text-gray-400 focus:border-primary focus:outline-none appearance-none pr-8 cursor-pointer">
        <option value="">Case Category</option>
      </select>
    </div>

    <!-- ── 3-column grid ────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-[170px_1fr_290px] gap-4 items-start">

      <!-- ── LEFT: Stat cards ─────────────────────────────────────────── -->
      <div class="grid grid-cols-2 lg:grid-cols-1 gap-3">

        <!-- Total Personnel -->
        <div class="bg-case-surface border border-case-border rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">Personnel</p>
            <Icon icon="ic:outline-people" class="text-gray-700 text-base" />
          </div>
          <div v-if="isLoadingRecords" class="h-10 flex items-center">
            <div class="h-2 w-12 animate-pulse rounded-full bg-case-elevated"></div>
          </div>
          <template v-else>
            <p class="text-4xl font-bold text-cyan-400 leading-none">{{ recentRecords.length }}</p>
            <p class="mt-2 text-[10px] text-gray-600">registered records</p>
          </template>
        </div>

        <!-- Total Cases -->
        <div class="bg-case-surface border border-case-border rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">Cases</p>
            <Icon icon="ic:outline-folder-open" class="text-gray-700 text-base" />
          </div>
          <div v-if="isLoadingRecords" class="h-10 flex items-center">
            <div class="h-2 w-12 animate-pulse rounded-full bg-case-elevated"></div>
          </div>
          <template v-else>
            <p class="text-4xl font-bold text-primary leading-none">{{ totalCases }}</p>
            <p class="mt-2 text-[10px] text-gray-600">unique operations</p>
          </template>
        </div>

        <!-- Total Countries -->
        <div class="bg-case-surface border border-case-border rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">Countries</p>
            <Icon icon="ic:outline-public" class="text-gray-700 text-base" />
          </div>
          <div v-if="isLoadingRecords" class="h-10 flex items-center">
            <div class="h-2 w-12 animate-pulse rounded-full bg-case-elevated"></div>
          </div>
          <template v-else>
            <p class="text-4xl font-bold text-emerald-400 leading-none">{{ totalCountries }}</p>
            <p class="mt-2 text-[10px] text-gray-600">nationalities tracked</p>
          </template>
        </div>

        <!-- Persons with Cases -->
        <div class="bg-case-surface border border-case-border rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">With Cases</p>
            <Icon icon="ic:outline-assignment-ind" class="text-gray-700 text-base" />
          </div>
          <div v-if="isLoadingRecords" class="h-10 flex items-center">
            <div class="h-2 w-12 animate-pulse rounded-full bg-case-elevated"></div>
          </div>
          <template v-else>
            <p class="text-4xl font-bold text-gray-200 leading-none">{{ personsWithCases }}</p>
            <p class="mt-2 text-[10px] text-gray-600">
              <span class="text-primary">●</span> of {{ recentRecords.length }} total
            </p>
          </template>
        </div>
      </div>

      <!-- ── MIDDLE ────────────────────────────────────────────────────── -->
      <div class="space-y-4">

        <!-- Line chart: Cases registered by month -->
        <div class="bg-case-surface border border-case-border rounded-xl p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-white">Cases Registered by Month</h3>
              <p class="text-[10px] text-gray-600 mt-0.5">Personnel records added over the last 12 months</p>
            </div>
            <div class="flex gap-2 text-gray-700">
              <button class="hover:text-gray-500 transition-colors"><Icon icon="bi:arrows-angle-expand" /></button>
              <button class="hover:text-gray-500 transition-colors"><Icon icon="bi:three-dots-vertical" /></button>
            </div>
          </div>
          <div v-if="isLoadingRecords" class="h-[200px] flex items-center justify-center">
            <div class="h-2 w-24 animate-pulse rounded-full bg-case-elevated"></div>
          </div>
          <apexchart v-else-if="chartReady" type="line" height="200"
            :options="lineChartOptions" :series="lineChartSeries" />
        </div>

        <!-- Personnel by Country (horizontal bar) -->
        <div class="bg-case-surface border border-case-border rounded-xl p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-white">Personnel by Country</h3>
              <p class="text-[10px] text-gray-600 mt-0.5">Top {{ countryDistribution.length }} countries by personnel count</p>
            </div>
            <button class="text-gray-700 hover:text-gray-500 transition-colors"><Icon icon="bi:three-dots-vertical" /></button>
          </div>
          <div v-if="isLoadingRecords" class="h-[220px] flex items-center justify-center">
            <div class="h-2 w-24 animate-pulse rounded-full bg-case-elevated"></div>
          </div>
          <div v-else-if="!countryDistribution.length" class="h-[220px] flex items-center justify-center text-xs text-gray-600">
            No country data available
          </div>
          <apexchart v-else-if="chartReady" type="bar" height="220"
            :options="countryBarOptions" :series="countryBarSeries" />
        </div>

        <!-- Recent records table -->
        <div class="bg-case-surface border border-case-border rounded-xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-white">Recent Case Records</h3>
            <div class="flex gap-2 text-gray-700">
              <button class="hover:text-gray-500 transition-colors"><Icon icon="bi:filter" /></button>
              <button class="hover:text-gray-500 transition-colors"><Icon icon="bi:three-dots-vertical" /></button>
            </div>
          </div>
          <div v-if="isLoadingRecords" class="space-y-2">
            <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded-lg bg-case-elevated"></div>
          </div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-case-border">
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Person</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Operation</th>
                <th class="py-2.5 px-3 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Date Added</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in tableRecords" :key="record._id"
                class="border-b border-case-border/40 hover:bg-case-card transition-colors cursor-pointer">
                <td class="py-2.5 px-3 text-gray-300 font-medium">{{ formatRecordName(record) || "—" }}</td>
                <td class="py-2.5 px-3 text-gray-500 max-w-[160px]">
                  <span class="truncate block">{{ record.operationDetails?.operationName || "—" }}</span>
                </td>
                <td class="py-2.5 px-3 text-gray-600 text-right text-xs">{{ formatRecordCreatedAt(record) }}</td>
              </tr>
              <tr v-if="!tableRecords.length">
                <td colspan="3" class="py-8 text-center text-gray-600 text-xs">No records available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── RIGHT ─────────────────────────────────────────────────────── -->
      <div class="space-y-4">

        <!-- Top 5 Operations bar -->
        <div class="bg-case-surface border border-case-border rounded-xl p-5">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-white">Top 5 Operations</h3>
            <button class="text-gray-700 hover:text-gray-500 transition-colors"><Icon icon="bi:three-dots-vertical" /></button>
          </div>
          <div class="flex gap-4 mb-3">
            <span class="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span class="inline-block h-2.5 w-4 rounded-sm bg-cyan-500"></span> Active
            </span>
            <span class="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span class="inline-block h-2.5 w-4 rounded-sm bg-primary"></span> Closed
            </span>
          </div>
          <div v-if="isLoadingRecords" class="h-[200px] flex items-center justify-center">
            <div class="h-2 w-24 animate-pulse rounded-full bg-case-elevated"></div>
          </div>
          <apexchart v-else-if="chartReady" type="bar" height="200"
            :options="barChartOptions" :series="barChartSeries" />
        </div>

        <!-- Country heatmap (treemap) -->
        <div class="bg-case-surface border border-case-border rounded-xl p-5">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-sm font-semibold text-white">Country Heatmap</h3>
            <button class="text-gray-700 hover:text-gray-500 transition-colors"><Icon icon="bi:three-dots-vertical" /></button>
          </div>
          <p class="text-[10px] text-gray-600 mb-4">Distribution of personnel across countries</p>
          <div v-if="isLoadingRecords" class="h-[240px] flex items-center justify-center">
            <div class="h-2 w-24 animate-pulse rounded-full bg-case-elevated"></div>
          </div>
          <div v-else-if="!countryDistribution.length" class="h-[240px] flex items-center justify-center text-xs text-gray-600">
            No country data available
          </div>
          <apexchart v-else-if="chartReady" type="treemap" height="240"
            :options="treemapOptions" :series="treemapSeries" />
        </div>

        <!-- Nationality donut -->
        <div class="bg-case-surface border border-case-border rounded-xl p-5">
          <h3 class="text-sm font-semibold text-white mb-1">Top Nationalities</h3>
          <p class="text-[10px] text-gray-600 mb-4">Share of personnel by nationality</p>
          <div v-if="isLoadingRecords" class="h-[200px] flex items-center justify-center">
            <div class="h-2 w-24 animate-pulse rounded-full bg-case-elevated"></div>
          </div>
          <apexchart v-else-if="chartReady && nationalityDonutSeries.length" type="donut" height="200"
            :options="donutOptions" :series="nationalityDonutSeries" />
          <div v-else class="h-[200px] flex items-center justify-center text-xs text-gray-600">
            No nationality data available
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";

  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const CHART_FONT = "Lexend, sans-serif";
  const LABEL_STYLE = { colors: "#64748b", fontSize: "10px", fontFamily: CHART_FONT };
  const GRID_OPTS = { borderColor: "#252830", strokeDashArray: 4, xaxis: { lines: { show: false } } };

  export default {
    name: "Dashboard",
    data() {
      return {
        recentRecords: [],
        isLoadingRecords: false,
        chartReady: false,
        recordsError: "",
      };
    },

    computed: {
      // ── Stat cards ────────────────────────────────────────────────────
      totalCases() {
        return new Set(
          this.recentRecords.map(r => r.operationDetails?.operationName?.trim()).filter(Boolean)
        ).size;
      },
      totalCountries() {
        return new Set(
          this.recentRecords.map(r => r.personalInformation?.country?.trim()).filter(Boolean)
        ).size;
      },
      personsWithCases() {
        return this.recentRecords.filter(r => r.operationDetails?.operationName?.trim()).length;
      },

      // ── Table ─────────────────────────────────────────────────────────
      tableRecords() {
        return this.recentRecords.slice(0, 8);
      },

      // ── Country distribution (sorted desc) ───────────────────────────
      countryDistribution() {
        const map = {};
        this.recentRecords.forEach(r => {
          const c = r.personalInformation?.country?.trim();
          if (c) map[c] = (map[c] || 0) + 1;
        });
        return Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15);
      },

      // ── Nationality distribution ──────────────────────────────────────
      nationalityDistribution() {
        const map = {};
        this.recentRecords.forEach(r => {
          const n = r.personalInformation?.nationality?.trim();
          if (n) map[n] = (map[n] || 0) + 1;
        });
        return Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);
      },

      // ── Monthly buckets ───────────────────────────────────────────────
      monthlySeries() {
        const now = new Date();
        const labels = [], persons = [], cases = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(MONTH_LABELS[d.getMonth()]);
          const inMonth = this.recentRecords.filter(r => {
            if (!r.createdAt) return false;
            const rd = new Date(r.createdAt);
            return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
          });
          persons.push(inMonth.length);
          cases.push(new Set(inMonth.map(r => r.operationDetails?.operationName?.trim()).filter(Boolean)).size);
        }
        return { labels, persons, cases };
      },

      // ── Line chart ────────────────────────────────────────────────────
      lineChartOptions() {
        return {
          chart: { type: "line", background: "transparent", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: CHART_FONT, animations: { enabled: true, speed: 500 } },
          colors: ["#D97706", "#06b6d4"],
          stroke: { curve: "smooth", width: [2, 2] },
          markers: { size: 4, strokeWidth: 0 },
          dataLabels: { enabled: false },
          grid: GRID_OPTS,
          xaxis: { categories: this.monthlySeries.labels, labels: { style: LABEL_STYLE }, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { style: LABEL_STYLE, formatter: v => Math.round(v) }, min: 0 },
          legend: { labels: { colors: "#9ca3af" }, fontFamily: CHART_FONT, fontSize: "10px" },
          tooltip: { theme: "dark", style: { fontFamily: CHART_FONT } },
        };
      },
      lineChartSeries() {
        return [
          { name: "Personnel", data: this.monthlySeries.persons },
          { name: "Cases", data: this.monthlySeries.cases },
        ];
      },

      // ── Personnel by Country (horizontal bar) ─────────────────────────
      countryBarOptions() {
        return {
          chart: { type: "bar", background: "transparent", toolbar: { show: false }, fontFamily: CHART_FONT, animations: { enabled: true, speed: 400 } },
          plotOptions: { bar: { horizontal: true, borderRadius: 3, borderRadiusApplication: "end", barHeight: "65%" } },
          colors: ["#D97706"],
          fill: {
            type: "gradient",
            gradient: { shade: "dark", type: "horizontal", gradientToColors: ["#f59e0b"], stops: [0, 100] },
          },
          dataLabels: {
            enabled: true,
            style: { fontSize: "10px", fontFamily: CHART_FONT, colors: ["#000"] },
            formatter: v => v,
          },
          grid: { ...GRID_OPTS, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
          xaxis: { labels: { style: LABEL_STYLE, formatter: v => Math.round(v) }, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { style: { ...LABEL_STYLE, colors: "#9ca3af" } } },
          legend: { show: false },
          tooltip: { theme: "dark", style: { fontFamily: CHART_FONT } },
        };
      },
      countryBarSeries() {
        return [{
          name: "Personnel",
          data: this.countryDistribution.map(([country, count]) => ({ x: country, y: count })),
        }];
      },

      // ── Top 5 Operations (stacked bar) ───────────────────────────────
      topOperations() {
        const ops = {};
        this.recentRecords.forEach(r => {
          const op = r.operationDetails?.operationName?.trim();
          if (!op) return;
          if (!ops[op]) ops[op] = { active: 0, closed: 0 };
          r.operationDetails?.disposition?.trim() ? ops[op].closed++ : ops[op].active++;
        });
        return Object.entries(ops).sort((a, b) => (b[1].active + b[1].closed) - (a[1].active + a[1].closed)).slice(0, 5);
      },
      barChartOptions() {
        const cats = this.topOperations.map(([name]) => name.length > 10 ? name.slice(0, 10) + "…" : name);
        return {
          chart: { type: "bar", background: "transparent", toolbar: { show: false }, fontFamily: CHART_FONT, stacked: true, animations: { enabled: true, speed: 500 } },
          colors: ["#06b6d4", "#D97706"],
          plotOptions: { bar: { columnWidth: "50%", borderRadius: 2, borderRadiusApplication: "end" } },
          grid: GRID_OPTS,
          xaxis: { categories: cats, labels: { style: { ...LABEL_STYLE, fontSize: "9px" }, rotate: -25 }, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { style: LABEL_STYLE, formatter: v => Math.round(v) }, min: 0 },
          legend: { show: false },
          dataLabels: { enabled: false },
          tooltip: { theme: "dark", style: { fontFamily: CHART_FONT } },
        };
      },
      barChartSeries() {
        return [
          { name: "Active", data: this.topOperations.map(([, v]) => v.active) },
          { name: "Closed", data: this.topOperations.map(([, v]) => v.closed) },
        ];
      },

      // ── Country treemap ───────────────────────────────────────────────
      treemapSeries() {
        return [{
          data: this.countryDistribution.map(([country, count]) => ({ x: country, y: count })),
        }];
      },
      treemapOptions() {
        return {
          chart: { type: "treemap", background: "transparent", toolbar: { show: false }, fontFamily: CHART_FONT, animations: { enabled: true, speed: 400 } },
          colors: ["#D97706"],
          plotOptions: {
            treemap: {
              enableShades: true,
              shadeIntensity: 0.5,
              colorScale: {
                ranges: [
                  { from: 1,  to: 3,   color: "#78350f" },
                  { from: 4,  to: 8,   color: "#b45309" },
                  { from: 9,  to: 20,  color: "#D97706" },
                  { from: 21, to: 999, color: "#f59e0b" },
                ],
              },
            },
          },
          dataLabels: { style: { fontSize: "11px", fontFamily: CHART_FONT, colors: ["#000"] } },
          legend: { show: false },
          tooltip: {
            theme: "dark",
            style: { fontFamily: CHART_FONT },
            y: { formatter: v => `${v} personnel` },
          },
        };
      },

      // ── Nationality donut ─────────────────────────────────────────────
      nationalityDonutSeries() {
        return this.nationalityDistribution.map(([, count]) => count);
      },
      donutOptions() {
        const COLORS = ["#D97706","#06b6d4","#10b981","#8b5cf6","#ef4444","#f97316","#ec4899","#6366f1"];
        return {
          chart: { type: "donut", background: "transparent", fontFamily: CHART_FONT, animations: { enabled: true, speed: 400 } },
          colors: COLORS,
          labels: this.nationalityDistribution.map(([name]) => name),
          dataLabels: { enabled: false },
          legend: {
            position: "bottom",
            labels: { colors: "#9ca3af" },
            fontFamily: CHART_FONT,
            fontSize: "10px",
            itemMargin: { horizontal: 4, vertical: 2 },
          },
          plotOptions: { pie: { donut: { size: "60%", labels: { show: true, total: { show: true, label: "Total", color: "#9ca3af", fontFamily: CHART_FONT, fontSize: "10px", formatter: w => w.globals.seriesTotals.reduce((a, b) => a + b, 0) } } } } },
          tooltip: { theme: "dark", style: { fontFamily: CHART_FONT }, y: { formatter: v => `${v} personnel` } },
          stroke: { width: 2, colors: ["#1a1d24"] },
        };
      },
    },

    components: { Icon },

    methods: {
      async loadRecentRecords() {
        this.isLoadingRecords = true;
        this.chartReady = false;
        this.recordsError = "";
        try {
          const res = await API.get("/cases/records");
          this.recentRecords = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.recordsError = err.response?.data?.message || "Unable to load records.";
        } finally {
          this.isLoadingRecords = false;
          await this.$nextTick();
          this.chartReady = true;
        }
      },
      formatRecordName(r) {
        return r.personalInformation?.name || "";
      },
      formatRecordCreatedAt(r) {
        if (!r.createdAt) return "—";
        return new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      },
    },

    mounted() {
      this.loadRecentRecords();
    },
  };
</script>
