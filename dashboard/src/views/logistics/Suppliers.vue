<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Assets Management</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Suppliers</h1>
      </div>
      <button @click="openCreate"
        class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> Add Supplier
      </button>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search by name, contact, category..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterActive" @change="load"
        class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </div>

    <section v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="i in 6" :key="i" class="h-24 animate-pulse rounded-xl bg-case-elevated"></div>
    </section>
    <section v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</section>
    <section v-else-if="suppliers.length" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <article v-for="s in suppliers" :key="s._id" @click="openEdit(s)"
        class="bg-case-surface border border-case-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-white truncate">{{ s.name }}</p>
            <p class="text-[11px] text-gray-500">{{ s.category || "No category" }}</p>
          </div>
          <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium flex-shrink-0"
            :class="s.isActive ? 'bg-emerald-950/40 text-emerald-400' : 'bg-case-elevated text-gray-500'">
            {{ s.isActive ? "Active" : "Inactive" }}
          </span>
        </div>
        <div class="space-y-1 text-[11px]">
          <p v-if="s.contactPerson" class="flex items-center gap-2 text-gray-400"><Icon icon="mdi:account-outline" /> {{ s.contactPerson }}</p>
          <p v-if="s.email" class="flex items-center gap-2 text-gray-400"><Icon icon="mdi:email-outline" /> {{ s.email }}</p>
          <p v-if="s.phone" class="flex items-center gap-2 text-gray-400"><Icon icon="mdi:phone-outline" /> {{ s.phone }}</p>
          <p v-if="s.address" class="flex items-center gap-2 text-gray-500 line-clamp-1"><Icon icon="mdi:map-marker-outline" /> {{ s.address }}</p>
        </div>
      </article>
    </section>
    <section v-else class="bg-case-surface border border-case-border rounded-xl py-16 flex flex-col items-center justify-center">
      <Icon icon="mdi:account-tie-outline" class="text-3xl text-gray-700 mb-2" />
      <p class="text-xs text-gray-500">No suppliers {{ searchQuery ? "match your search" : "in directory yet" }}.</p>
      <button v-if="!searchQuery" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Add the first supplier</button>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-2xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ editing?._id ? "Edit Supplier" : "Add Supplier" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Supplier Name <span class="text-primary">*</span></label>
              <input v-model.trim="form.name" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Category</label>
              <input v-model.trim="form.category" type="text" placeholder="e.g. Communications, Vehicles" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Contact Person</label>
              <input v-model.trim="form.contactPerson" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Email</label>
              <input v-model.trim="form.email" type="email" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Phone</label>
              <input v-model.trim="form.phone" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Tax ID / TIN</label>
              <input v-model.trim="form.taxId" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Address</label>
              <input v-model.trim="form.address" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Website</label>
              <input v-model.trim="form.website" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Notes</label>
              <textarea v-model="form.notes" rows="3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div class="sm:col-span-2 flex items-center gap-2">
              <input id="supplier-active" v-model="form.isActive" type="checkbox" class="h-4 w-4 accent-primary" />
              <label for="supplier-active" class="text-xs text-gray-300">Active supplier</label>
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

  function emptyForm() {
    return { name: "", category: "", contactPerson: "", email: "", phone: "", address: "", taxId: "", website: "", isActive: true, notes: "" };
  }

  export default {
    name: "Suppliers",
    components: { Icon },
    data() {
      return {
        suppliers: [], loading: false, error: "",
        searchQuery: "", searchDebounce: null, filterActive: "",
        showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "",
      };
    },
    methods: {
      onSearchInput() {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => this.load(), 300);
      },
      async load() {
        this.loading = true; this.error = "";
        try {
          const params = new URLSearchParams();
          if (this.searchQuery.trim()) params.set("q", this.searchQuery.trim());
          if (this.filterActive) params.set("active", this.filterActive);
          const res = await API.get(`/logistics/suppliers${params.toString() ? `?${params}` : ""}`);
          this.suppliers = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load suppliers.";
        } finally {
          this.loading = false;
        }
      },
      openCreate() { this.editing = null; this.form = emptyForm(); this.submitError = ""; this.showModal = true; },
      openEdit(supplier) { this.editing = supplier; this.form = { ...emptyForm(), ...supplier }; this.submitError = ""; this.showModal = true; },
      closeModal() { if (!this.submitting) { this.showModal = false; this.editing = null; } },
      async submit() {
        if (!this.form.name?.trim() || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          let res;
          if (this.editing?._id) {
            res = await API.put(`/logistics/suppliers/${this.editing._id}`, this.form);
          } else {
            res = await API.post("/logistics/suppliers", this.form);
          }
          const s = res.data?.supplier;
          const idx = this.suppliers.findIndex((x) => x._id === s._id);
          if (idx >= 0) this.suppliers.splice(idx, 1, s); else this.suppliers.unshift(s);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to save supplier.";
        } finally { this.submitting = false; }
      },
      async confirmDelete() {
        if (!this.editing?._id || !window.confirm(`Delete ${this.editing.name}?`)) return;
        this.submitting = true;
        try {
          await API.delete(`/logistics/suppliers/${this.editing._id}`);
          this.suppliers = this.suppliers.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to delete supplier.";
        } finally { this.submitting = false; }
      },
    },
    mounted() { this.load(); },
  };
</script>
