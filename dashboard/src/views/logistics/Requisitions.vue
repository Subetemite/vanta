<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Assets Management</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Requisitions</h1>
      </div>
      <button @click="openCreate"
        class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> New Requisition
      </button>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search by ref no, requestor, purpose..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterStatus" @change="load"
        class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Status</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <section class="bg-case-surface border border-case-border rounded-xl">
      <div class="p-5">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 6" :key="i" class="h-12 animate-pulse rounded bg-case-elevated"></div>
        </div>
        <div v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</div>
        <table v-else-if="requisitions.length" class="w-full text-sm">
          <thead>
            <tr class="border-b border-case-border">
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Ref No.</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Requestor</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Purpose</th>
              <th class="py-2.5 px-3 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Items</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Priority</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Status</th>
              <th class="py-2.5 px-3 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in requisitions" :key="r._id"
              class="border-b border-case-border/40 hover:bg-case-card transition-colors">
              <td @click="openEdit(r)" class="py-2.5 px-3 text-gray-400 text-xs cursor-pointer">{{ r.refNo }}</td>
              <td @click="openEdit(r)" class="py-2.5 px-3 text-gray-200 cursor-pointer">
                <p class="font-medium">{{ r.requestor?.name || "—" }}</p>
                <p class="text-[10px] text-gray-500">{{ r.requestor?.unit || "" }}</p>
              </td>
              <td @click="openEdit(r)" class="py-2.5 px-3 text-gray-500 text-xs cursor-pointer max-w-xs truncate">{{ r.purpose }}</td>
              <td @click="openEdit(r)" class="py-2.5 px-3 text-right text-gray-300 cursor-pointer">{{ r.items?.length || 0 }}</td>
              <td @click="openEdit(r)" class="py-2.5 px-3 cursor-pointer">
                <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="priorityBadge(r.priority)">{{ r.priority }}</span>
              </td>
              <td @click="openEdit(r)" class="py-2.5 px-3 cursor-pointer">
                <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="statusBadge(r.status)">{{ r.status }}</span>
              </td>
              <td class="py-2.5 px-3 text-right">
                <div class="inline-flex gap-1">
                  <button v-if="r.status === 'pending'" @click.stop="approve(r)" title="Approve"
                    class="rounded p-1 text-emerald-400 hover:bg-emerald-950/40 transition-colors"><Icon icon="mdi:check" /></button>
                  <button v-if="r.status === 'pending'" @click.stop="deny(r)" title="Deny"
                    class="rounded p-1 text-red-400 hover:bg-red-950/40 transition-colors"><Icon icon="mdi:close" /></button>
                  <button v-if="r.status === 'approved'" @click.stop="issue(r)" title="Issue"
                    class="rounded p-1 text-cyan-400 hover:bg-cyan-950/40 transition-colors"><Icon icon="mdi:truck-delivery-outline" /></button>
                  <button v-if="r.status === 'issued'" @click.stop="complete(r)" title="Mark complete"
                    class="rounded p-1 text-emerald-500 hover:bg-emerald-950/40 transition-colors"><Icon icon="mdi:check-all" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="py-12 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:clipboard-list-outline" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No requisitions {{ searchQuery ? "match your search" : "filed yet" }}.</p>
          <button v-if="!searchQuery" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">File the first requisition</button>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-3xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ editing?._id ? `Requisition ${editing.refNo}` : "New Requisition" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Requestor Name</label>
                <input v-model.trim="form.requestor.name" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Unit</label>
                <input v-model.trim="form.requestor.unit" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Contact</label>
                <input v-model.trim="form.requestor.contact" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Purpose</label>
              <textarea v-model="form.purpose" rows="2" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Priority</label>
                <select v-model="form.priority" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                  <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Needed By</label>
                <input v-model="form.neededBy" type="date" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
            </div>

            <!-- Line items -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">Line Items</label>
                <button @click="addLine" type="button" class="text-[10px] text-primary hover:underline flex items-center gap-1">
                  <Icon icon="mdi:plus" /> Add line
                </button>
              </div>
              <div class="space-y-2">
                <div v-for="(line, i) in form.items" :key="i"
                  class="grid grid-cols-12 gap-2 items-center bg-case-card border border-case-border rounded-md p-2">
                  <select v-model="line.inventoryItem" @change="onLineItemChange(i, $event.target.value)"
                    class="col-span-4 rounded-md border border-case-border bg-case-surface px-2 py-1.5 text-xs text-gray-200 focus:border-primary focus:outline-none">
                    <option value="">Free-text item...</option>
                    <option v-for="item in inventoryOptions" :key="item._id" :value="item._id">{{ item.name }} ({{ item.quantity }} {{ item.unit }})</option>
                  </select>
                  <input v-model.trim="line.name" type="text" placeholder="Item name"
                    class="col-span-3 rounded-md border border-case-border bg-case-surface px-2 py-1.5 text-xs text-gray-200 focus:border-primary focus:outline-none" />
                  <input v-model.number="line.quantity" type="number" min="0" placeholder="Qty"
                    class="col-span-2 rounded-md border border-case-border bg-case-surface px-2 py-1.5 text-xs text-gray-200 focus:border-primary focus:outline-none" />
                  <input v-model.trim="line.unit" type="text" placeholder="Unit"
                    class="col-span-2 rounded-md border border-case-border bg-case-surface px-2 py-1.5 text-xs text-gray-200 focus:border-primary focus:outline-none" />
                  <button @click="removeLine(i)" type="button" class="col-span-1 text-red-400 hover:bg-red-950/40 rounded p-1 transition-colors flex items-center justify-center">
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Notes</label>
              <textarea v-model="form.notes" rows="2" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>

            <div v-if="editing?._id && editing.status === 'denied' && editing.denialReason" class="rounded-md border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-400">
              <p class="font-semibold uppercase tracking-wide text-[10px] mb-1">Denial reason</p>
              <p>{{ editing.denialReason }}</p>
            </div>

            <div v-if="submitError" class="rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>
          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="editing?._id" type="button" @click="confirmDelete"
              class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated transition-colors">Cancel</button>
              <button @click="submit" :disabled="!canSubmit || submitting"
                class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                <Icon v-if="submitting" icon="mdi:loading" class="animate-spin" />
                <Icon v-else icon="mdi:content-save-outline" />
                {{ submitting ? "Saving..." : (editing?._id ? "Update" : "Submit") }}
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

  const STATUSES = ["draft", "pending", "approved", "denied", "issued", "returned", "completed", "cancelled"];
  const PRIORITIES = ["low", "normal", "high", "urgent"];

  function emptyForm() {
    return {
      requestor: { name: "", unit: "", contact: "" },
      purpose: "",
      priority: "normal",
      neededBy: "",
      items: [{ inventoryItem: "", name: "", quantity: 1, unit: "pcs", notes: "" }],
      notes: "",
    };
  }

  function dateForInput(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }

  export default {
    name: "Requisitions",
    components: { Icon },
    data() {
      return {
        STATUSES, PRIORITIES,
        requisitions: [], inventoryOptions: [],
        loading: false, error: "",
        searchQuery: "", searchDebounce: null, filterStatus: "",
        showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "",
      };
    },
    computed: {
      canSubmit() {
        return this.form.items?.some((i) => i.name?.trim() && Number(i.quantity) > 0);
      },
    },
    methods: {
      statusBadge(status) {
        const map = {
          pending: "bg-amber-950/40 text-amber-400",
          approved: "bg-cyan-950/40 text-cyan-400",
          issued: "bg-emerald-950/40 text-emerald-400",
          completed: "bg-emerald-950/60 text-emerald-300",
          denied: "bg-red-950/40 text-red-400",
          cancelled: "bg-case-elevated text-gray-500",
          returned: "bg-case-elevated text-gray-400",
          draft: "bg-case-elevated text-gray-500",
        };
        return map[status] || "bg-case-elevated text-gray-400";
      },
      priorityBadge(priority) {
        const map = {
          urgent: "bg-red-950/40 text-red-400",
          high: "bg-amber-950/40 text-amber-400",
          normal: "bg-case-elevated text-gray-400",
          low: "bg-case-elevated text-gray-500",
        };
        return map[priority] || "bg-case-elevated text-gray-400";
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
          if (this.filterStatus) params.set("status", this.filterStatus);
          const res = await API.get(`/logistics/requisitions${params.toString() ? `?${params}` : ""}`);
          this.requisitions = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load requisitions.";
        } finally {
          this.loading = false;
        }
      },
      async loadInventory() {
        try {
          const res = await API.get("/logistics/inventory");
          this.inventoryOptions = Array.isArray(res.data) ? res.data : [];
        } catch { /* non-fatal */ }
      },
      openCreate() {
        this.editing = null; this.form = emptyForm(); this.submitError = ""; this.showModal = true;
      },
      openEdit(r) {
        this.editing = r;
        this.form = {
          ...emptyForm(),
          ...r,
          requestor: { ...emptyForm().requestor, ...(r.requestor || {}) },
          items: r.items?.length ? r.items.map((i) => ({ ...i })) : emptyForm().items,
          neededBy: dateForInput(r.neededBy),
        };
        this.submitError = ""; this.showModal = true;
      },
      closeModal() { if (!this.submitting) { this.showModal = false; this.editing = null; } },
      addLine() {
        this.form.items.push({ inventoryItem: "", name: "", quantity: 1, unit: "pcs", notes: "" });
      },
      removeLine(i) { this.form.items.splice(i, 1); },
      onLineItemChange(i, value) {
        const found = this.inventoryOptions.find((opt) => opt._id === value);
        if (found) {
          this.form.items[i].name = found.name;
          this.form.items[i].unit = found.unit;
          this.form.items[i].inventoryItem = found._id;
        } else {
          this.form.items[i].inventoryItem = null;
        }
      },
      async submit() {
        if (!this.canSubmit || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          const payload = {
            ...this.form,
            neededBy: this.form.neededBy || null,
            items: this.form.items.filter((i) => i.name?.trim() && Number(i.quantity) > 0),
          };
          let res;
          if (this.editing?._id) {
            res = await API.put(`/logistics/requisitions/${this.editing._id}`, payload);
          } else {
            res = await API.post("/logistics/requisitions", payload);
          }
          const r = res.data?.requisition;
          const idx = this.requisitions.findIndex((x) => x._id === r._id);
          if (idx >= 0) this.requisitions.splice(idx, 1, r); else this.requisitions.unshift(r);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to save requisition.";
        } finally {
          this.submitting = false;
        }
      },
      async confirmDelete() {
        if (!this.editing?._id || !window.confirm(`Delete requisition ${this.editing.refNo}?`)) return;
        this.submitting = true;
        try {
          await API.delete(`/logistics/requisitions/${this.editing._id}`);
          this.requisitions = this.requisitions.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to delete.";
        } finally {
          this.submitting = false;
        }
      },
      async approve(r) {
        try {
          const res = await API.post(`/logistics/requisitions/${r._id}/approve`);
          const updated = res.data?.requisition;
          const idx = this.requisitions.findIndex((x) => x._id === updated._id);
          if (idx >= 0) this.requisitions.splice(idx, 1, updated);
        } catch (err) {
          alert(err.response?.data?.message || "Unable to approve.");
        }
      },
      async deny(r) {
        const reason = window.prompt("Reason for denial:");
        if (reason === null) return;
        try {
          const res = await API.post(`/logistics/requisitions/${r._id}/deny`, { reason });
          const updated = res.data?.requisition;
          const idx = this.requisitions.findIndex((x) => x._id === updated._id);
          if (idx >= 0) this.requisitions.splice(idx, 1, updated);
        } catch (err) {
          alert(err.response?.data?.message || "Unable to deny.");
        }
      },
      async issue(r) {
        if (!window.confirm(`Issue items for ${r.refNo}? Stock will be deducted.`)) return;
        try {
          const res = await API.post(`/logistics/requisitions/${r._id}/issue`);
          const updated = res.data?.requisition;
          const idx = this.requisitions.findIndex((x) => x._id === updated._id);
          if (idx >= 0) this.requisitions.splice(idx, 1, updated);
        } catch (err) {
          alert(err.response?.data?.message || "Unable to issue.");
        }
      },
      async complete(r) {
        try {
          const res = await API.post(`/logistics/requisitions/${r._id}/complete`);
          const updated = res.data?.requisition;
          const idx = this.requisitions.findIndex((x) => x._id === updated._id);
          if (idx >= 0) this.requisitions.splice(idx, 1, updated);
        } catch (err) {
          alert(err.response?.data?.message || "Unable to complete.");
        }
      },
    },
    mounted() { this.load(); this.loadInventory(); },
  };
</script>
