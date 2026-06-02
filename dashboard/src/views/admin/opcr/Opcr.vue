<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / OPCR</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Office Performance Commitment and Review</h1>
        <p class="mt-1 text-sm text-gray-500">Per-office targets, accomplishments, and ratings.</p>
      </div>
      <button type="button" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500" @click="$router.push('/admin/opcr/new')">
        + New OPCR
      </button>
    </header>

    <div class="mb-5 grid gap-3 sm:grid-cols-3">
      <div class="sm:col-span-2 flex items-center rounded-xl border border-case-border bg-case-surface px-3 py-2">
        <Icon icon="mdi:magnify" class="text-lg text-gray-500" />
        <input v-model="search" type="search" placeholder="Search by office or rating period..." class="w-full bg-transparent px-2 py-1 text-sm text-gray-200 outline-none placeholder:text-gray-600" @input="onSearch" />
      </div>
      <select v-model="statusFilter" class="rounded-xl border border-case-border bg-case-surface px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" @change="loadList">
        <option value="">All Statuses</option>
        <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div v-if="errorMessage" class="mb-3 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{{ errorMessage }}</div>

    <div class="overflow-hidden rounded-2xl border border-case-border bg-case-surface">
      <table class="w-full text-left text-sm">
        <thead class="bg-case-elevated text-xs uppercase tracking-[0.2em] text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">Office</th>
            <th class="px-4 py-3 font-medium">Rating Period</th>
            <th class="px-4 py-3 font-medium">Targets</th>
            <th class="px-4 py-3 font-medium">Overall</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Updated</th>
            <th class="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-case-border text-gray-300">
          <tr v-if="isLoading"><td colspan="7" class="px-4 py-6 text-center text-gray-500">Loading...</td></tr>
          <tr v-else-if="!records.length"><td colspan="7" class="px-4 py-6 text-center text-gray-500">No OPCR records yet.</td></tr>
          <tr v-for="r in records" :key="r.id" class="hover:bg-case-card cursor-pointer" @click="$router.push(`/admin/opcr/${r.id}`)">
            <td class="px-4 py-2 font-medium text-white">{{ r.office }}</td>
            <td class="px-4 py-2 text-gray-400">{{ r.ratingPeriod }}</td>
            <td class="px-4 py-2 text-gray-400 tabular-nums">{{ r.targets?.length || 0 }}</td>
            <td class="px-4 py-2 font-semibold text-primary tabular-nums">{{ r.overallRating ? r.overallRating.toFixed(2) : '—' }}</td>
            <td class="px-4 py-2"><span :class="statusBadge(r.status)" class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]">{{ r.status }}</span></td>
            <td class="px-4 py-2 text-gray-400 tabular-nums">{{ formatDate(r.updatedAt) }}</td>
            <td class="px-4 py-2 text-right" @click.stop>
              <div class="inline-flex items-center gap-1">
                <button type="button" class="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20" @click="$router.push(`/admin/opcr/${r.id}`)">View</button>
                <button type="button" class="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20" @click="$router.push(`/admin/opcr/${r.id}/edit`)">Edit</button>
                <button type="button" class="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/20" :disabled="deletingId === r.id" @click="confirmDelete(r)">{{ deletingId === r.id ? "…" : "Delete" }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmationDialog
      :visible="confirmationDialog.visible"
      :title="confirmationDialog.title"
      :description="confirmationDialog.description"
      :confirm-text="confirmationDialog.confirmText"
      @cancel="closeConfirmationDialog(false)"
      @confirm="closeConfirmationDialog(true)"
    />
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";
  import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
  import { createConfirmationDialogState, resolveConfirmation } from "@/helper/record-confirmation";

  export default {
    name: "AdminOpcr",
    components: { Icon, ConfirmationDialog },
    data() {
      return {
        records: [],
        search: "",
        searchTimer: null,
        statusFilter: "",
        statusOptions: ["Draft", "Submitted", "Approved"],
        isLoading: false,
        errorMessage: "",
        deletingId: "",
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    methods: {
      formatDate(v) { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10); },
      statusBadge(s) {
        const map = { Draft: "bg-gray-500/15 text-gray-300", Submitted: "bg-amber-500/15 text-amber-300", Approved: "bg-emerald-500/15 text-emerald-300" };
        return map[s] || "bg-gray-500/15 text-gray-300";
      },
      openConfirmationDialog(p) { this.confirmationDialog = { visible: true, ...p }; return new Promise((r) => { this.confirmationResolver = r; }); },
      closeConfirmationDialog(c) { this.confirmationDialog = createConfirmationDialogState(); resolveConfirmation(this.confirmationResolver, c); this.confirmationResolver = null; },
      onSearch() { clearTimeout(this.searchTimer); this.searchTimer = setTimeout(() => this.loadList(), 300); },
      async loadList() {
        this.isLoading = true; this.errorMessage = "";
        try {
          const params = new URLSearchParams();
          if (this.search.trim()) params.set("q", this.search.trim());
          if (this.statusFilter) params.set("status", this.statusFilter);
          const qs = params.toString();
          const res = await API.get(`/admin/opcr${qs ? `?${qs}` : ""}`);
          this.records = res.data?.records || [];
        } catch (err) { this.errorMessage = err.response?.data?.message || "Unable to load OPCR records."; }
        finally { this.isLoading = false; }
      },
      async confirmDelete(record) {
        const confirmed = await this.openConfirmationDialog({
          title: "Delete OPCR?",
          description: `OPCR for "${record.office}" (${record.ratingPeriod}) will be permanently removed. This cannot be undone.`,
          confirmText: "Yes, delete",
        });
        if (!confirmed) return;
        this.deletingId = record.id;
        try {
          await API.delete(`/admin/opcr/${record.id}`);
          await this.loadList();
        } catch (err) { this.errorMessage = err.response?.data?.message || "Unable to delete OPCR."; }
        finally { this.deletingId = ""; }
      },
    },
    mounted() { this.loadList(); },
    beforeUnmount() { clearTimeout(this.searchTimer); },
  };
</script>
