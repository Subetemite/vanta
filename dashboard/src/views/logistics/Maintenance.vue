<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Assets Management</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Maintenance Logs</h1>
      </div>
      <button @click="openCreate"
        class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> Log Maintenance
      </button>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search by asset, vendor, technician..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterAssetType" @change="load"
        class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Assets</option>
        <option value="vehicle">Vehicle</option>
        <option value="equipment">Equipment</option>
        <option value="other">Other</option>
      </select>
      <select v-model="filterType" @change="load"
        class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Types</option>
        <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <section class="bg-case-surface border border-case-border rounded-xl">
      <div class="p-5">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 6" :key="i" class="h-12 animate-pulse rounded bg-case-elevated"></div>
        </div>
        <div v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</div>
        <table v-else-if="logs.length" class="w-full text-sm">
          <thead>
            <tr class="border-b border-case-border">
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Date</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Asset</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Type</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Description</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Vendor</th>
              <th class="py-2.5 px-3 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Cost</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Next Due</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log._id" @click="openEdit(log)"
              class="border-b border-case-border/40 hover:bg-case-card transition-colors cursor-pointer">
              <td class="py-2.5 px-3 text-gray-500 text-xs">{{ formatDate(log.performedAt) }}</td>
              <td class="py-2.5 px-3 text-gray-200 font-medium">
                <p>{{ log.assetName || "—" }}</p>
                <p class="text-[10px] text-gray-600">{{ log.assetType }}</p>
              </td>
              <td class="py-2.5 px-3 text-gray-400 text-xs">{{ log.type }}</td>
              <td class="py-2.5 px-3 text-gray-500 text-xs max-w-xs truncate">{{ log.description }}</td>
              <td class="py-2.5 px-3 text-gray-400 text-xs">{{ log.vendor || "—" }}</td>
              <td class="py-2.5 px-3 text-right text-gray-300 text-xs">{{ log.cost ? `₱${log.cost.toLocaleString()}` : "—" }}</td>
              <td class="py-2.5 px-3 text-xs" :class="isOverdue(log.nextDueAt) ? 'text-red-400 font-medium' : 'text-gray-500'">
                {{ formatDate(log.nextDueAt) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="py-12 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:wrench-outline" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No maintenance logs {{ searchQuery ? "match your search" : "recorded yet" }}.</p>
          <button v-if="!searchQuery" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Log first service</button>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-2xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ editing?._id ? "Edit Log" : "Log Maintenance" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Asset Type</label>
              <select v-model="form.assetType" @change="onAssetTypeChange" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option value="vehicle">Vehicle</option>
                <option value="equipment">Equipment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Asset</label>
              <select v-if="form.assetType === 'vehicle'" v-model="form.assetRef" @change="onAssetSelect"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option value="">Select vehicle...</option>
                <option v-for="v in vehicleOptions" :key="v._id" :value="v._id">{{ v.plateNo }} ({{ v.make }} {{ v.model }})</option>
              </select>
              <select v-else-if="form.assetType === 'equipment'" v-model="form.assetRef" @change="onAssetSelect"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option value="">Select item...</option>
                <option v-for="i in inventoryOptions" :key="i._id" :value="i._id">{{ i.name }} ({{ i.sku }})</option>
              </select>
              <input v-else v-model.trim="form.assetName" type="text" placeholder="Asset name"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div v-if="form.assetType !== 'other'" class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Asset Name</label>
              <input v-model.trim="form.assetName" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Maintenance Type</label>
              <select v-model="form.type" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Performed At</label>
              <input v-model="form.performedAt" type="date" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Performed By</label>
              <input v-model.trim="form.performedBy" type="text" placeholder="Technician name" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Vendor / Shop</label>
              <input v-model.trim="form.vendor" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Cost (PHP)</label>
              <input v-model.number="form.cost" type="number" min="0" step="0.01" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Odometer (km)</label>
              <input v-model.number="form.odometer" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Next Due</label>
              <input v-model="form.nextDueAt" type="date" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Description</label>
              <textarea v-model="form.description" rows="3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div v-if="submitError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>
          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="editing?._id" type="button" @click="confirmDelete"
              class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated transition-colors">Cancel</button>
              <button @click="submit" :disabled="!form.assetName?.trim() || submitting"
                class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                <Icon v-if="submitting" icon="mdi:loading" class="animate-spin" />
                <Icon v-else icon="mdi:content-save-outline" />
                {{ submitting ? "Saving..." : (editing?._id ? "Update" : "Save") }}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";

  const TYPES = ["preventive", "corrective", "inspection", "repair", "calibration"];

  function emptyForm() {
    return {
      assetType: "vehicle",
      assetRef: "",
      assetRefModel: "Vehicle",
      assetName: "",
      type: "preventive",
      performedAt: new Date().toISOString().slice(0, 10),
      performedBy: "",
      vendor: "",
      cost: 0,
      odometer: null,
      nextDueAt: "",
      description: "",
      notes: "",
    };
  }

  function dateForInput(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }

  export default {
    name: "Maintenance",
    components: { Icon },
    data() {
      return {
        TYPES,
        logs: [], vehicleOptions: [], inventoryOptions: [],
        loading: false, error: "",
        searchQuery: "", searchDebounce: null,
        filterAssetType: "", filterType: "",
        showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "",
      };
    },
    methods: {
      formatDate(d) {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      },
      isOverdue(d) {
        if (!d) return false;
        return new Date(d) < new Date();
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
          if (this.filterAssetType) params.set("assetType", this.filterAssetType);
          if (this.filterType) params.set("type", this.filterType);
          const res = await API.get(`/logistics/maintenance${params.toString() ? `?${params}` : ""}`);
          this.logs = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load logs.";
        } finally {
          this.loading = false;
        }
      },
      async loadAssetOptions() {
        try {
          const [v, i] = await Promise.all([
            API.get("/logistics/vehicles"),
            API.get("/logistics/inventory"),
          ]);
          this.vehicleOptions = Array.isArray(v.data) ? v.data : [];
          this.inventoryOptions = Array.isArray(i.data) ? i.data : [];
        } catch { /* non-fatal */ }
      },
      onAssetTypeChange() {
        this.form.assetRef = "";
        this.form.assetName = "";
        this.form.assetRefModel = this.form.assetType === "equipment" ? "InventoryItem" : "Vehicle";
      },
      onAssetSelect() {
        if (this.form.assetType === "vehicle") {
          const v = this.vehicleOptions.find((x) => x._id === this.form.assetRef);
          if (v) this.form.assetName = `${v.plateNo} ${v.make || ""} ${v.model || ""}`.trim();
        } else if (this.form.assetType === "equipment") {
          const i = this.inventoryOptions.find((x) => x._id === this.form.assetRef);
          if (i) this.form.assetName = i.name;
        }
      },
      openCreate() {
        this.editing = null; this.form = emptyForm(); this.submitError = ""; this.showModal = true;
      },
      openEdit(log) {
        this.editing = log;
        this.form = {
          ...emptyForm(),
          ...log,
          performedAt: dateForInput(log.performedAt),
          nextDueAt: dateForInput(log.nextDueAt),
        };
        this.submitError = ""; this.showModal = true;
      },
      closeModal() { if (!this.submitting) { this.showModal = false; this.editing = null; } },
      async submit() {
        if (!this.form.assetName?.trim() || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          const payload = {
            ...this.form,
            performedAt: this.form.performedAt || new Date().toISOString(),
            nextDueAt: this.form.nextDueAt || null,
            assetRef: this.form.assetRef || null,
            assetRefModel: this.form.assetType === "equipment" ? "InventoryItem" : "Vehicle",
          };
          let res;
          if (this.editing?._id) {
            res = await API.put(`/logistics/maintenance/${this.editing._id}`, payload);
          } else {
            res = await API.post("/logistics/maintenance", payload);
          }
          const log = res.data?.log;
          const idx = this.logs.findIndex((x) => x._id === log._id);
          if (idx >= 0) this.logs.splice(idx, 1, log); else this.logs.unshift(log);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to save log.";
        } finally {
          this.submitting = false;
        }
      },
      async confirmDelete() {
        if (!this.editing?._id || !window.confirm("Delete this maintenance log?")) return;
        this.submitting = true;
        try {
          await API.delete(`/logistics/maintenance/${this.editing._id}`);
          this.logs = this.logs.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to delete.";
        } finally {
          this.submitting = false;
        }
      },
    },
    mounted() { this.load(); this.loadAssetOptions(); },
  };
</script>
