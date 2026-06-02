<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Assets Management</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Inventory</h1>
      </div>
      <button @click="openCreate"
        class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> Add Item
      </button>
    </header>

    <!-- Scope tabs -->
    <div class="inline-flex rounded-lg border border-case-border bg-case-surface p-1 gap-1">
      <button v-for="s in SCOPES" :key="s.key" @click="setScope(s.key)" type="button"
        class="px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors flex items-center gap-2"
        :class="filterScope === s.key ? 'bg-primary text-black' : 'text-gray-400 hover:text-gray-200'">
        <Icon :icon="s.icon" />{{ s.label }}
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search by name, SKU, location..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
      </div>
      <select v-model="filterCategory" @change="load"
        class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Categories</option>
        <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="filterStatus" @change="load"
        class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Status</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <!-- Table -->
    <section class="bg-case-surface border border-case-border rounded-xl">
      <div class="p-5">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded bg-case-elevated"></div>
        </div>
        <div v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</div>
        <table v-else-if="items.length" class="w-full text-sm">
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
            <tr v-for="item in items" :key="item._id" @click="openEdit(item)"
              class="border-b border-case-border/40 hover:bg-case-card transition-colors cursor-pointer">
              <td class="py-2.5 px-3 text-gray-500 text-xs">{{ item.sku || "—" }}</td>
              <td class="py-2.5 px-3 text-gray-200 font-medium">{{ item.name }}</td>
              <td class="py-2.5 px-3 text-gray-500 text-xs">{{ item.category }}</td>
              <td class="py-2.5 px-3 text-right text-gray-300">{{ item.quantity }} <span class="text-[10px] text-gray-600">{{ item.unit }}</span></td>
              <td class="py-2.5 px-3 text-gray-500 text-xs">{{ item.location || "—" }}</td>
              <td class="py-2.5 px-3">
                <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="statusBadge(item.status)">
                  {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="py-12 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:package-variant" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No inventory items {{ searchQuery ? "match your search" : "yet" }}.</p>
          <button v-if="!searchQuery" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Add the first item</button>
        </div>
      </div>
    </section>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-2xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ editing?._id ? "Edit Item" : "New Inventory Item" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Inventory Type</label>
              <div class="inline-flex rounded-lg border border-case-border bg-case-card p-1 gap-1">
                <button v-for="s in SCOPES" :key="s.key" @click="form.scope = s.key" type="button"
                  class="px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors flex items-center gap-2"
                  :class="form.scope === s.key ? 'bg-primary text-black' : 'text-gray-400 hover:text-gray-200'">
                  <Icon :icon="s.icon" />{{ s.label }}
                </button>
              </div>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Item Name <span class="text-primary">*</span></label>
              <input v-model.trim="form.name" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">SKU</label>
              <input v-model.trim="form.sku" type="text" placeholder="auto-generated if blank" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Category</label>
              <select v-model="form.category" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Quantity</label>
              <input v-model.number="form.quantity" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Unit</label>
              <input v-model.trim="form.unit" type="text" placeholder="pcs, boxes, L, kg" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Min Stock</label>
              <input v-model.number="form.minStock" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Unit Cost (PHP)</label>
              <input v-model.number="form.unitCost" type="number" min="0" step="0.01" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Location / Bin</label>
              <input v-model.trim="form.location" type="text" placeholder="e.g. Warehouse A · Shelf 3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Supplier Name</label>
              <input v-model.trim="form.supplierName" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Description / Notes</label>
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
              <button @click="submit" :disabled="!form.name?.trim() || submitting"
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

  const CATEGORIES = ["equipment", "supplies", "communications", "ammunition", "ppe", "tools", "uniform", "other"];
  const STATUSES = ["in-stock", "low-stock", "out-of-stock", "retired"];
  const SCOPES = [
    { key: "office", label: "Office Inventory", icon: "mdi:office-building-outline" },
    { key: "case", label: "Case Inventory", icon: "mdi:shield-search" },
  ];

  function emptyForm(scope = "office") {
    return { name: "", sku: "", scope, category: "supplies", quantity: 0, unit: "pcs", minStock: 0, unitCost: 0, location: "", supplierName: "", description: "" };
  }

  export default {
    name: "Inventory",
    components: { Icon },
    data() {
      return {
        CATEGORIES, STATUSES, SCOPES,
        items: [], loading: false, error: "",
        searchQuery: "", searchDebounce: null,
        filterScope: "office", filterCategory: "", filterStatus: "",
        showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "",
      };
    },
    methods: {
      statusBadge(status) {
        const map = {
          "in-stock": "bg-emerald-950/40 text-emerald-400",
          "low-stock": "bg-amber-950/40 text-amber-400",
          "out-of-stock": "bg-red-950/40 text-red-400",
          "retired": "bg-case-elevated text-gray-500",
        };
        return map[status] || "bg-case-elevated text-gray-400";
      },
      onSearchInput() {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => this.load(), 300);
      },
      async load() {
        this.loading = true; this.error = "";
        try {
          const params = new URLSearchParams();
          params.set("scope", this.filterScope);
          if (this.searchQuery.trim()) params.set("q", this.searchQuery.trim());
          if (this.filterCategory) params.set("category", this.filterCategory);
          if (this.filterStatus) params.set("status", this.filterStatus);
          const res = await API.get(`/logistics/inventory?${params}`);
          this.items = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load inventory.";
        } finally {
          this.loading = false;
        }
      },
      setScope(scope) {
        if (this.filterScope === scope) return;
        this.filterScope = scope;
        this.load();
      },
      openCreate() {
        this.editing = null;
        this.form = emptyForm(this.filterScope);
        this.submitError = "";
        this.showModal = true;
      },
      openEdit(item) {
        this.editing = item; this.form = { ...emptyForm(), ...item }; this.submitError = ""; this.showModal = true;
      },
      closeModal() {
        if (this.submitting) return;
        this.showModal = false; this.editing = null;
      },
      async submit() {
        if (!this.form.name?.trim() || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          let res;
          if (this.editing?._id) {
            res = await API.put(`/logistics/inventory/${this.editing._id}`, this.form);
          } else {
            res = await API.post("/logistics/inventory", this.form);
          }
          const item = res.data?.item;
          const idx = this.items.findIndex((x) => x._id === item._id);
          if (idx >= 0) this.items.splice(idx, 1, item); else this.items.unshift(item);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to save item.";
        } finally {
          this.submitting = false;
        }
      },
      async confirmDelete() {
        if (!this.editing?._id) return;
        if (!window.confirm(`Delete ${this.editing.name}?`)) return;
        this.submitting = true;
        try {
          await API.delete(`/logistics/inventory/${this.editing._id}`);
          this.items = this.items.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to delete item.";
        } finally {
          this.submitting = false;
        }
      },
    },
    mounted() { this.load(); },
  };
</script>
