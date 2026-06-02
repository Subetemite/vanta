<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Social Media</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Alerts</h1>
      </div>
      <button v-if="canEdit" @click="openCreate" class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> Raise Alert
      </button>
      <span v-else class="rounded-full border border-case-border bg-case-elevated px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        Read-only
      </span>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search title, description, assignee..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterSeverity" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Severities</option>
        <option v-for="s in SEVERITIES" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="filterStatus" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Status</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="filterType" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
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
        <table v-else-if="alerts.length" class="w-full text-sm">
          <thead>
            <tr class="border-b border-case-border">
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Title</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Type</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Severity</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Status</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Assigned</th>
              <th class="py-2.5 px-3 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Detected</th>
              <th class="py-2.5 px-3 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in alerts" :key="a._id" class="border-b border-case-border/40 hover:bg-case-card transition-colors">
              <td @click="openEdit(a)" class="py-2.5 px-3 text-gray-200 font-medium cursor-pointer">{{ a.title }}</td>
              <td @click="openEdit(a)" class="py-2.5 px-3 text-gray-400 text-xs cursor-pointer">{{ a.type }}</td>
              <td @click="openEdit(a)" class="py-2.5 px-3 cursor-pointer"><span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="severityBadge(a.severity)">{{ a.severity }}</span></td>
              <td @click="openEdit(a)" class="py-2.5 px-3 cursor-pointer"><span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="statusBadge(a.status)">{{ a.status }}</span></td>
              <td @click="openEdit(a)" class="py-2.5 px-3 text-gray-400 text-xs cursor-pointer">{{ a.assignedTo || "—" }}</td>
              <td @click="openEdit(a)" class="py-2.5 px-3 text-gray-500 text-right text-xs cursor-pointer">{{ formatDate(a.detectedAt) }}</td>
              <td class="py-2.5 px-3 text-right">
                <div v-if="canEdit" class="inline-flex gap-1">
                  <button v-if="a.status === 'new'" @click.stop="transition(a, 'investigating')" title="Start investigating"
                    class="rounded p-1 text-cyan-400 hover:bg-cyan-950/40"><Icon icon="mdi:magnify" /></button>
                  <button v-if="['new','investigating'].includes(a.status)" @click.stop="transition(a, 'escalated')" title="Escalate"
                    class="rounded p-1 text-amber-400 hover:bg-amber-950/40"><Icon icon="mdi:arrow-up-bold" /></button>
                  <button v-if="!['resolved','dismissed','false-positive'].includes(a.status)" @click.stop="resolve(a)" title="Resolve"
                    class="rounded p-1 text-emerald-400 hover:bg-emerald-950/40"><Icon icon="mdi:check" /></button>
                </div>
                <span v-else class="text-[10px] text-gray-600">—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="py-12 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:bell-outline" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No alerts {{ searchQuery ? "match your search" : "raised yet" }}.</p>
          <button v-if="canEdit && !searchQuery" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Raise first alert</button>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-2xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ canEdit ? (editing?._id ? "Edit Alert" : "Raise Alert") : "Alert Details" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Title <span class="text-primary">*</span></label>
              <input v-model.trim="form.title" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Type</label>
              <select v-model="form.type" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Severity</label>
              <select v-model="form.severity" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="s in SEVERITIES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Status</label>
              <select v-model="form.status" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Platform</label>
              <input v-model.trim="form.platform" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Source URL</label>
              <input v-model.trim="form.sourceUrl" type="url" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Description</label>
              <textarea v-model="form.description" rows="4" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Assigned To</label>
              <input v-model.trim="form.assignedTo" type="text" placeholder="Analyst name" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Detected At</label>
              <input v-model="form.detectedAt" type="datetime-local" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Resolution Notes</label>
              <textarea v-model="form.resolution" rows="3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div v-if="submitError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>
          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="canEdit && editing?._id" @click="confirmDelete" class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated">{{ canEdit ? "Cancel" : "Close" }}</button>
              <button v-if="canEdit" @click="submit" :disabled="!form.title?.trim() || submitting" class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                <Icon v-if="submitting" icon="mdi:loading" class="animate-spin" />
                <Icon v-else icon="mdi:content-save-outline" />
                {{ submitting ? "Saving..." : (editing?._id ? "Update" : "Raise") }}
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
  import { canEditModule } from "@/services/access";

  const SEVERITIES = ["low", "medium", "high", "critical"];
  const STATUSES = ["new", "investigating", "escalated", "resolved", "false-positive", "dismissed"];
  const TYPES = ["threat", "scam", "disinformation", "harassment", "trafficking", "extremism", "drug-related", "fraud", "other"];

  function emptyForm() {
    return {
      title: "", type: "other", severity: "medium", status: "new",
      platform: "", sourceUrl: "", description: "",
      assignedTo: "", resolution: "",
      detectedAt: new Date().toISOString().slice(0, 16),
    };
  }
  function dtForInput(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
  }

  export default {
    name: "Alerts",
    components: { Icon },
    data() {
      return { SEVERITIES, STATUSES, TYPES, alerts: [], loading: false, error: "", searchQuery: "", searchDebounce: null, filterSeverity: "", filterStatus: "", filterType: "", showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "" };
    },
    computed: {
      canEdit() {
        return canEditModule("social");
      },
    },
    methods: {
      severityBadge(s) {
        const m = { low: "bg-case-elevated text-gray-400", medium: "bg-cyan-950/40 text-cyan-400", high: "bg-amber-950/40 text-amber-400", critical: "bg-red-950/40 text-red-400" };
        return m[s] || "bg-case-elevated text-gray-400";
      },
      statusBadge(s) {
        const m = { new: "bg-amber-950/40 text-amber-400", investigating: "bg-cyan-950/40 text-cyan-400", escalated: "bg-red-950/40 text-red-400", resolved: "bg-emerald-950/40 text-emerald-400", "false-positive": "bg-case-elevated text-gray-500", dismissed: "bg-case-elevated text-gray-500" };
        return m[s] || "bg-case-elevated text-gray-400";
      },
      formatDate(d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"; },
      onSearchInput() { clearTimeout(this.searchDebounce); this.searchDebounce = setTimeout(() => this.load(), 300); },
      async load() {
        this.loading = true; this.error = "";
        try {
          const params = new URLSearchParams();
          if (this.searchQuery.trim()) params.set("q", this.searchQuery.trim());
          if (this.filterSeverity) params.set("severity", this.filterSeverity);
          if (this.filterStatus) params.set("status", this.filterStatus);
          if (this.filterType) params.set("type", this.filterType);
          const res = await API.get(`/social/alerts${params.toString() ? `?${params}` : ""}`);
          this.alerts = Array.isArray(res.data) ? res.data : [];
        } catch (err) { this.error = err.response?.data?.message || "Unable to load."; }
        finally { this.loading = false; }
      },
      openCreate() { this.editing = null; this.form = emptyForm(); this.submitError = ""; this.showModal = true; },
      openEdit(a) { this.editing = a; this.form = { ...emptyForm(), ...a, detectedAt: dtForInput(a.detectedAt) }; this.submitError = ""; this.showModal = true; },
      closeModal() { if (!this.submitting) { this.showModal = false; this.editing = null; } },
      async submit() {
        if (!this.form.title?.trim() || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          let res;
          if (this.editing?._id) res = await API.put(`/social/alerts/${this.editing._id}`, this.form);
          else res = await API.post("/social/alerts", this.form);
          const a = res.data?.alert;
          const idx = this.alerts.findIndex((x) => x._id === a._id);
          if (idx >= 0) this.alerts.splice(idx, 1, a); else this.alerts.unshift(a);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to save."; }
        finally { this.submitting = false; }
      },
      async confirmDelete() {
        if (!this.editing?._id || !window.confirm("Delete this alert?")) return;
        this.submitting = true;
        try {
          await API.delete(`/social/alerts/${this.editing._id}`);
          this.alerts = this.alerts.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to delete."; }
        finally { this.submitting = false; }
      },
      async transition(a, status) {
        try {
          const res = await API.post(`/social/alerts/${a._id}/transition`, { status });
          const u = res.data?.alert;
          const idx = this.alerts.findIndex((x) => x._id === u._id);
          if (idx >= 0) this.alerts.splice(idx, 1, u);
        } catch (err) { alert(err.response?.data?.message || "Failed."); }
      },
      async resolve(a) {
        const note = window.prompt("Resolution notes (optional):", "");
        if (note === null) return;
        try {
          const res = await API.post(`/social/alerts/${a._id}/transition`, { status: "resolved", resolution: note });
          const u = res.data?.alert;
          const idx = this.alerts.findIndex((x) => x._id === u._id);
          if (idx >= 0) this.alerts.splice(idx, 1, u);
        } catch (err) { alert(err.response?.data?.message || "Failed."); }
      },
    },
    mounted() { this.load(); },
  };
</script>
