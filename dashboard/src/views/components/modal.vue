<template>
  <div class="min-h-screen bg-case-bg p-6 sm:p-8">
    <div class="mx-auto max-w-6xl space-y-6">

      <!-- Header -->
      <div class="border-b border-case-border pb-5">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Case / Reports</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Case Reports</h1>
        <p class="mt-1 text-sm text-gray-500">Export and review case records by date range, operation, or status.</p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-500">From</label>
          <input v-model="filters.from" type="date"
            class="rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-500">To</label>
          <input v-model="filters.to" type="date"
            class="rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-500">Operation</label>
          <select v-model="filters.operation"
            class="rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer min-w-[160px]">
            <option value="">All operations</option>
            <option v-for="op in uniqueOperations" :key="op" :value="op">{{ op }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-500">Status</label>
          <select v-model="filters.status"
            class="rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button @click="resetFilters"
          class="rounded-xl border border-case-border px-4 py-2 text-sm text-gray-400 transition hover:bg-case-elevated hover:text-gray-200">
          Reset
        </button>
        <button @click="exportCsv"
          class="ml-auto rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500">
          Export CSV
        </button>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl border border-case-border bg-case-surface p-4">
          <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">Total Records</p>
          <p class="mt-2 text-3xl font-bold text-white">{{ filteredRecords.length }}</p>
        </div>
        <div class="rounded-xl border border-case-border bg-case-surface p-4">
          <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">Active Cases</p>
          <p class="mt-2 text-3xl font-bold text-cyan-400">{{ activeCount }}</p>
        </div>
        <div class="rounded-xl border border-case-border bg-case-surface p-4">
          <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">Closed Cases</p>
          <p class="mt-2 text-3xl font-bold text-primary">{{ closedCount }}</p>
        </div>
        <div class="rounded-xl border border-case-border bg-case-surface p-4">
          <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">Operations</p>
          <p class="mt-2 text-3xl font-bold text-gray-200">{{ uniqueOperations.length }}</p>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
        {{ error }}
      </div>

      <!-- Table -->
      <div class="rounded-xl border border-case-border bg-case-surface overflow-hidden">
        <div v-if="isLoading" class="space-y-2 p-4">
          <div v-for="i in 5" :key="i" class="h-10 animate-pulse rounded-lg bg-case-elevated"></div>
        </div>
        <div v-else-if="!filteredRecords.length" class="py-12 text-center text-sm text-gray-600">
          No records match the selected filters.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-case-border text-sm">
            <thead class="bg-case-card">
              <tr class="text-left text-[10px] uppercase tracking-[0.2em] text-gray-600">
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Operation</th>
                <th class="px-4 py-3 font-medium">Disposition</th>
                <th class="px-4 py-3 font-medium">Nationality</th>
                <th class="px-4 py-3 font-medium">Date Added</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-case-border/50">
              <tr
                v-for="record in paginatedRecords"
                :key="record._id"
                class="hover:bg-case-card transition-colors"
              >
                <td class="px-4 py-3 font-medium text-gray-200">{{ formatName(record) || "—" }}</td>
                <td class="px-4 py-3 text-gray-400 max-w-[160px]">
                  <span class="truncate block">{{ record.operationDetails?.operationName || "—" }}</span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ record.operationDetails?.disposition || "—" }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ record.personalInformation?.nationality || "—" }}</td>
                <td class="px-4 py-3 text-gray-600 text-xs">{{ formatDate(record.createdAt) }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="record.operationDetails?.disposition ? 'bg-primary/10 text-primary' : 'bg-cyan-900/20 text-cyan-400'"
                    class="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]"
                  >
                    {{ record.operationDetails?.disposition ? "Closed" : "Active" }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button
                    @click="openDetail(record)"
                    class="rounded-lg border border-case-border px-3 py-1 text-xs text-gray-400 transition hover:bg-case-elevated hover:text-gray-200"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-case-border px-4 py-3">
          <p class="text-xs text-gray-600">
            Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredRecords.length) }} of {{ filteredRecords.length }}
          </p>
          <div class="flex gap-1">
            <button
              v-for="p in totalPages" :key="p"
              @click="currentPage = p"
              :class="p === currentPage ? 'bg-primary text-black' : 'border border-case-border text-gray-400 hover:bg-case-elevated'"
              class="h-7 w-7 rounded-lg text-xs font-medium transition"
            >{{ p }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail modal -->
    <div v-if="detailRecord" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" @click.self="detailRecord = null">
      <div class="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-case-border bg-case-surface shadow-2xl shadow-black/60">
        <div class="flex items-start justify-between border-b border-case-border p-5">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Case Record</p>
            <h3 class="mt-1 text-lg font-semibold text-white">{{ formatName(detailRecord) || "Unknown" }}</h3>
          </div>
          <button @click="detailRecord = null" class="text-gray-500 hover:text-gray-300 text-xl leading-none">&times;</button>
        </div>
        <div class="p-5 space-y-5">
          <section>
            <h4 class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Personal Information</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div v-for="row in personalRows" :key="row.label">
                <p class="text-gray-600 text-xs">{{ row.label }}</p>
                <p class="mt-0.5 text-gray-200">{{ row.value || "—" }}</p>
              </div>
            </div>
          </section>
          <section v-if="hasOperationDetails">
            <h4 class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Operation Details</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div v-for="row in operationRows" :key="row.label">
                <p class="text-gray-600 text-xs">{{ row.label }}</p>
                <p class="mt-0.5 text-gray-200">{{ row.value || "—" }}</p>
              </div>
            </div>
          </section>
          <section v-if="hasBiometrics">
            <h4 class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Biometrics</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div v-for="row in biometricRows" :key="row.label">
                <p class="text-gray-600 text-xs">{{ row.label }}</p>
                <p class="mt-0.5 text-gray-200">{{ row.value || "—" }}</p>
              </div>
            </div>
          </section>
        </div>
        <div class="border-t border-case-border p-4 flex justify-end">
          <button @click="detailRecord = null"
            class="rounded-xl border border-case-border px-4 py-2 text-sm text-gray-400 transition hover:bg-case-elevated hover:text-gray-200">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import API from "@/services/api";

  export default {
    name: "ReportsPage",
    data() {
      return {
        records: [],
        isLoading: false,
        error: "",
        detailRecord: null,
        currentPage: 1,
        pageSize: 15,
        filters: { from: "", to: "", operation: "", status: "" },
      };
    },
    computed: {
      uniqueOperations() {
        return [...new Set(
          this.records.map(r => r.operationDetails?.operationName?.trim()).filter(Boolean)
        )].sort();
      },
      filteredRecords() {
        return this.records.filter(r => {
          if (this.filters.operation && r.operationDetails?.operationName?.trim() !== this.filters.operation) return false;
          if (this.filters.status === "active" && r.operationDetails?.disposition) return false;
          if (this.filters.status === "closed" && !r.operationDetails?.disposition) return false;
          if (this.filters.from || this.filters.to) {
            const d = r.createdAt ? new Date(r.createdAt) : null;
            if (!d) return false;
            if (this.filters.from && d < new Date(this.filters.from)) return false;
            if (this.filters.to && d > new Date(this.filters.to + "T23:59:59")) return false;
          }
          return true;
        });
      },
      activeCount() { return this.filteredRecords.filter(r => !r.operationDetails?.disposition).length; },
      closedCount() { return this.filteredRecords.filter(r =>  r.operationDetails?.disposition).length; },
      totalPages() { return Math.max(1, Math.ceil(this.filteredRecords.length / this.pageSize)); },
      paginatedRecords() {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredRecords.slice(start, start + this.pageSize);
      },
      personalRows() {
        if (!this.detailRecord) return [];
        const i = this.detailRecord.personalInformation || {};
        return [
          { label: "Name",          value: i.name },
          { label: "Alias",         value: i.alias },
          { label: "Birth Date",    value: i.birthDate },
          { label: "Sex",           value: i.sex },
          { label: "Civil Status",  value: i.civilStatus },
          { label: "Nationality",   value: i.nationality },
          { label: "Country",       value: i.country },
          { label: "Contact",       value: i.contactNumber },
          { label: "Email",         value: i.emailAddress },
          { label: "Address",       value: i.address },
        ].filter(r => r.value);
      },
      operationRows() {
        if (!this.detailRecord) return [];
        const o = this.detailRecord.operationDetails || {};
        return [
          { label: "Operation Name",    value: o.operationName },
          { label: "Operation Date",    value: o.operationDate },
          { label: "Operation Address", value: o.operationAddress },
          { label: "Disposition",       value: o.disposition },
          { label: "Visa Status",       value: o.visaStatus },
          { label: "Remarks",           value: o.remarks },
          { label: "Actions",           value: o.actions },
        ].filter(r => r.value);
      },
      biometricRows() {
        if (!this.detailRecord) return [];
        const b = this.detailRecord.biometrics || {};
        return [
          { label: "Height (cm)",           value: b.heightCm },
          { label: "Weight (kg)",           value: b.weightKg },
          { label: "Blood Type",            value: b.bloodType },
          { label: "Eye Color",             value: b.eyeColor },
          { label: "Hair Color",            value: b.hairColor },
          { label: "Complexion",            value: b.complexion },
          { label: "Fingerprint Code",      value: b.fingerprintCode },
          { label: "Distinguishing Marks",  value: b.distinguishingMarks },
        ].filter(r => r.value);
      },
      hasOperationDetails() { return this.operationRows.length > 0; },
      hasBiometrics()       { return this.biometricRows.length > 0; },
    },
    watch: {
      filters: { deep: true, handler() { this.currentPage = 1; } },
    },
    methods: {
      async loadRecords() {
        this.isLoading = true;
        this.error = "";
        try {
          const res = await API.get("/cases/records");
          this.records = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load records.";
        } finally {
          this.isLoading = false;
        }
      },
      formatName(r) {
        const i = r?.personalInformation || {};
        return i.name || "";
      },
      formatDate(v) {
        return v ? new Date(v).toLocaleDateString() : "—";
      },
      openDetail(record) {
        this.detailRecord = record;
      },
      resetFilters() {
        this.filters = { from: "", to: "", operation: "", status: "" };
      },
      exportCsv() {
        const headers = ["Name", "Operation", "Disposition", "Nationality", "Country", "Date Added", "Status"];
        const rows = this.filteredRecords.map(r => [
          this.formatName(r),
          r.operationDetails?.operationName || "",
          r.operationDetails?.disposition || "",
          r.personalInformation?.nationality || "",
          r.personalInformation?.country || "",
          this.formatDate(r.createdAt),
          r.operationDetails?.disposition ? "Closed" : "Active",
        ]);
        const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `case-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
    },
    mounted() {
      this.loadRecords();
    },
  };
</script>
