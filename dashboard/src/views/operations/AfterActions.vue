<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Operations</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">After-Action Reports</h1>
      </div>
      <button @click="openCreate" class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> New AAR
      </button>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search by mission, summary, prepared by..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterOutcome" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Outcomes</option>
        <option v-for="o in OUTCOMES" :key="o" :value="o">{{ o }}</option>
      </select>
    </div>

    <section v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="i in 4" :key="i" class="h-36 animate-pulse rounded-xl bg-case-elevated"></div>
    </section>
    <section v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</section>
    <section v-else-if="reports.length" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <article v-for="r in reports" :key="r._id" @click="openEdit(r)"
        class="bg-case-surface border border-case-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-200 truncate">{{ r.missionCodeName || "—" }}</p>
            <p class="text-[11px] text-gray-500">Prepared by {{ r.preparedBy || "—" }} · {{ formatDate(r.submittedAt) }}</p>
          </div>
          <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="outcomeBadge(r.outcome)">{{ r.outcome }}</span>
        </div>
        <p v-if="r.summary" class="text-[11px] text-gray-400 line-clamp-3 mb-3">{{ r.summary }}</p>
        <div class="flex items-center justify-between text-[10px]">
          <div class="flex flex-wrap gap-3 text-gray-500">
            <span v-if="r.totalArrests"><span class="text-gray-300 font-semibold">{{ r.totalArrests }}</span> arrests</span>
            <span v-if="r.totalSeized">{{ r.totalSeized }}</span>
          </div>
          <span v-if="r.approvedAt" class="text-emerald-400 font-semibold uppercase tracking-wide">✓ Approved</span>
          <span v-else class="text-amber-400 uppercase tracking-wide">Pending Approval</span>
        </div>
      </article>
    </section>
    <section v-else class="bg-case-surface border border-case-border rounded-xl py-16 flex flex-col items-center justify-center">
      <Icon icon="mdi:file-document-check-outline" class="text-3xl text-gray-700 mb-2" />
      <p class="text-xs text-gray-500">No after-action reports {{ searchQuery ? "match your search" : "yet" }}.</p>
      <button v-if="!searchQuery" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Submit first AAR</button>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-3xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ editing?._id ? "Edit After-Action Report" : "New After-Action Report" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Mission <span class="text-primary">*</span></label>
              <select v-model="form.mission" @change="onMissionChange" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option value="">Select mission...</option>
                <option v-for="m in missionOptions" :key="m._id" :value="m._id">{{ m.codeName }} ({{ m.missionId }})</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Outcome</label>
              <select v-model="form.outcome" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="o in OUTCOMES" :key="o" :value="o">{{ o }}</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Executive Summary</label>
              <textarea v-model="form.summary" rows="4" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Objectives Met</label>
              <textarea v-model="form.objectivesMet" rows="3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Objectives Missed</label>
              <textarea v-model="form.objectivesMissed" rows="3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Successes (one per line)</label>
              <textarea :value="(form.successes || []).join('\n')" @input="form.successes = $event.target.value.split('\n').map(s => s.trim()).filter(Boolean)" rows="3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Challenges (one per line)</label>
              <textarea :value="(form.challenges || []).join('\n')" @input="form.challenges = $event.target.value.split('\n').map(s => s.trim()).filter(Boolean)" rows="3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Lessons Learned (one per line)</label>
              <textarea :value="(form.lessonsLearned || []).join('\n')" @input="form.lessonsLearned = $event.target.value.split('\n').map(s => s.trim()).filter(Boolean)" rows="3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Recommendations (one per line)</label>
              <textarea :value="(form.recommendations || []).join('\n')" @input="form.recommendations = $event.target.value.split('\n').map(s => s.trim()).filter(Boolean)" rows="3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Total Arrests</label>
              <input v-model.number="form.totalArrests" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Total Items Seized</label>
              <input v-model.trim="form.totalSeized" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Prepared By</label>
              <input v-model.trim="form.preparedBy" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div v-if="editing?._id && editing.approvedAt" class="sm:col-span-2 rounded-md border border-emerald-900/40 bg-emerald-950/20 p-3 text-xs text-emerald-400">
              ✓ Approved by {{ editing.approvedBy }} on {{ formatDate(editing.approvedAt) }}
            </div>
            <div v-if="submitError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>
          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="editing?._id" @click="confirmDelete" class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button v-if="editing?._id && !editing.approvedAt" @click="approve" :disabled="submitting"
                class="rounded-md bg-emerald-950/40 border border-emerald-700/40 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-950/60 flex items-center gap-2">
                <Icon icon="mdi:check-circle-outline" /> Approve
              </button>
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated">Cancel</button>
              <button @click="submit" :disabled="!form.mission || submitting" class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
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

  const OUTCOMES = ["success", "partial-success", "inconclusive", "failed"];

  function emptyForm() {
    return {
      mission: "", missionCodeName: "", outcome: "inconclusive",
      summary: "", objectivesMet: "", objectivesMissed: "",
      successes: [], challenges: [], lessonsLearned: [], recommendations: [],
      totalArrests: 0, totalSeized: "", preparedBy: "",
    };
  }

  export default {
    name: "AfterActions",
    components: { Icon },
    data() {
      return { OUTCOMES, reports: [], missionOptions: [], loading: false, error: "", searchQuery: "", searchDebounce: null, filterOutcome: "", showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "" };
    },
    methods: {
      outcomeBadge(o) {
        const m = { success: "bg-emerald-950/40 text-emerald-400", "partial-success": "bg-cyan-950/40 text-cyan-400", inconclusive: "bg-amber-950/40 text-amber-400", failed: "bg-red-950/40 text-red-400" };
        return m[o] || "bg-case-elevated text-gray-400";
      },
      formatDate(d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"; },
      onSearchInput() { clearTimeout(this.searchDebounce); this.searchDebounce = setTimeout(() => this.load(), 300); },
      onMissionChange() {
        const m = this.missionOptions.find((x) => x._id === this.form.mission);
        this.form.missionCodeName = m?.codeName || "";
      },
      async load() {
        this.loading = true; this.error = "";
        try {
          const params = new URLSearchParams();
          if (this.searchQuery.trim()) params.set("q", this.searchQuery.trim());
          if (this.filterOutcome) params.set("outcome", this.filterOutcome);
          const res = await API.get(`/operations/after-actions${params.toString() ? `?${params}` : ""}`);
          this.reports = Array.isArray(res.data) ? res.data : [];
        } catch (err) { this.error = err.response?.data?.message || "Unable to load."; }
        finally { this.loading = false; }
      },
      async loadMissions() {
        try { const res = await API.get("/operations/missions"); this.missionOptions = res.data || []; } catch { /* */ }
      },
      openCreate() { this.editing = null; this.form = emptyForm(); this.submitError = ""; this.showModal = true; },
      openEdit(r) { this.editing = r; this.form = { ...emptyForm(), ...r }; this.submitError = ""; this.showModal = true; },
      closeModal() { if (!this.submitting) { this.showModal = false; this.editing = null; } },
      async submit() {
        if (!this.form.mission || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          let res;
          if (this.editing?._id) res = await API.put(`/operations/after-actions/${this.editing._id}`, this.form);
          else res = await API.post("/operations/after-actions", this.form);
          const r = res.data?.report;
          const idx = this.reports.findIndex((x) => x._id === r._id);
          if (idx >= 0) this.reports.splice(idx, 1, r); else this.reports.unshift(r);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to save."; }
        finally { this.submitting = false; }
      },
      async confirmDelete() {
        if (!this.editing?._id || !window.confirm("Delete this AAR?")) return;
        this.submitting = true;
        try {
          await API.delete(`/operations/after-actions/${this.editing._id}`);
          this.reports = this.reports.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to delete."; }
        finally { this.submitting = false; }
      },
      async approve() {
        if (!this.editing?._id) return;
        try {
          const res = await API.post(`/operations/after-actions/${this.editing._id}/approve`);
          const r = res.data?.report;
          const idx = this.reports.findIndex((x) => x._id === r._id);
          if (idx >= 0) this.reports.splice(idx, 1, r);
          this.editing = r;
        } catch (err) { alert(err.response?.data?.message || "Unable to approve."); }
      },
    },
    mounted() { this.load(); this.loadMissions(); },
  };
</script>
