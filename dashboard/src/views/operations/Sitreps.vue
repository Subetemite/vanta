<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Operations</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">SITREPs</h1>
      </div>
      <button @click="openCreate" class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> File SITREP
      </button>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search title, summary, mission..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterLevel" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Levels</option>
        <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
      </select>
    </div>

    <section v-if="loading" class="space-y-2">
      <div v-for="i in 6" :key="i" class="h-20 animate-pulse rounded-xl bg-case-elevated"></div>
    </section>
    <section v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</section>
    <section v-else-if="sitreps.length" class="space-y-2">
      <article v-for="s in sitreps" :key="s._id" @click="openEdit(s)"
        class="bg-case-surface border border-case-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-gray-200 truncate">{{ s.title }}</p>
              <Icon v-if="s.attachments?.length" icon="mdi:paperclip" class="text-primary text-sm" />
            </div>
            <p class="text-[11px] text-gray-500 mt-0.5">{{ s.missionCodeName }} · {{ s.location || "—" }} · {{ formatDate(s.reportedAt) }}</p>
          </div>
          <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium flex-shrink-0" :class="levelBadge(s.level)">{{ s.level }}</span>
        </div>
        <p v-if="s.summary" class="text-[11px] text-gray-400 line-clamp-2">{{ s.summary }}</p>
        <div v-if="s.casualties || s.arrests || s.seized" class="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
          <span v-if="s.arrests"><span class="text-gray-300 font-semibold">{{ s.arrests }}</span> arrests</span>
          <span v-if="s.casualties?.friendly"><span class="text-amber-400 font-semibold">{{ s.casualties.friendly }}</span> friendly cas.</span>
          <span v-if="s.casualties?.hostile"><span class="text-red-400 font-semibold">{{ s.casualties.hostile }}</span> hostile cas.</span>
          <span v-if="s.casualties?.civilian"><span class="text-cyan-400 font-semibold">{{ s.casualties.civilian }}</span> civilian cas.</span>
          <span v-if="s.seized">seized: {{ s.seized }}</span>
        </div>
      </article>
    </section>
    <section v-else class="bg-case-surface border border-case-border rounded-xl py-16 flex flex-col items-center justify-center">
      <Icon icon="mdi:radio-tower" class="text-3xl text-gray-700 mb-2" />
      <p class="text-xs text-gray-500">No SITREPs {{ searchQuery ? "match your search" : "filed yet" }}.</p>
      <button v-if="!searchQuery" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">File first SITREP</button>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-3xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ editing?._id ? "Edit SITREP" : "New SITREP" }}</h2>
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
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Level</label>
              <select v-model="form.level" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Title <span class="text-primary">*</span></label>
              <input v-model.trim="form.title" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Report No.</label>
              <input v-model.trim="form.reportNo" type="text" placeholder="auto / manual" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Reported At</label>
              <input v-model="form.reportedAt" type="datetime-local" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Reported By</label>
              <input v-model.trim="form.reportedBy" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Location</label>
              <input v-model.trim="form.location" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Summary</label>
              <textarea v-model="form.summary" rows="2" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Detailed Report</label>
              <textarea v-model="form.details" rows="5" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div class="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Arrests</label>
                <input v-model.number="form.arrests" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-2 py-1.5 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Friendly Cas.</label>
                <input v-model.number="form.casualties.friendly" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-2 py-1.5 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Hostile Cas.</label>
                <input v-model.number="form.casualties.hostile" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-2 py-1.5 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Civilian Cas.</label>
                <input v-model.number="form.casualties.civilian" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-2 py-1.5 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Items Seized</label>
              <input v-model.trim="form.seized" type="text" placeholder="e.g. 5 firearms, 2 kg shabu, ₱500K cash" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div v-if="submitError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>
          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="editing?._id" @click="confirmDelete" class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated">Cancel</button>
              <button @click="submit" :disabled="!canSubmit || submitting" class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                <Icon v-if="submitting" icon="mdi:loading" class="animate-spin" />
                <Icon v-else icon="mdi:content-save-outline" />
                {{ submitting ? "Saving..." : (editing?._id ? "Update" : "File") }}
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

  const LEVELS = ["routine", "advisory", "warning", "critical"];

  function emptyForm() {
    return {
      mission: "", missionCodeName: "", title: "", reportNo: "",
      reportedAt: new Date().toISOString().slice(0, 16), reportedBy: "", location: "",
      level: "routine", summary: "", details: "",
      arrests: 0, seized: "",
      casualties: { friendly: 0, hostile: 0, civilian: 0 },
    };
  }
  function dtForInput(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
  }

  export default {
    name: "Sitreps",
    components: { Icon },
    data() {
      return { LEVELS, sitreps: [], missionOptions: [], loading: false, error: "", searchQuery: "", searchDebounce: null, filterLevel: "", showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "" };
    },
    computed: {
      canSubmit() { return !!(this.form.mission && this.form.title?.trim()); },
    },
    methods: {
      levelBadge(l) {
        const m = { routine: "bg-case-elevated text-gray-400", advisory: "bg-cyan-950/40 text-cyan-400", warning: "bg-amber-950/40 text-amber-400", critical: "bg-red-950/40 text-red-400" };
        return m[l] || "bg-case-elevated text-gray-400";
      },
      formatDate(d) { return d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"; },
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
          if (this.filterLevel) params.set("level", this.filterLevel);
          const res = await API.get(`/operations/sitreps${params.toString() ? `?${params}` : ""}`);
          this.sitreps = Array.isArray(res.data) ? res.data : [];
        } catch (err) { this.error = err.response?.data?.message || "Unable to load."; }
        finally { this.loading = false; }
      },
      async loadMissions() {
        try { const res = await API.get("/operations/missions"); this.missionOptions = res.data || []; } catch { /* */ }
      },
      openCreate() { this.editing = null; this.form = emptyForm(); this.submitError = ""; this.showModal = true; },
      openEdit(s) {
        this.editing = s;
        this.form = { ...emptyForm(), ...s, casualties: { ...emptyForm().casualties, ...(s.casualties || {}) }, reportedAt: dtForInput(s.reportedAt) };
        this.submitError = ""; this.showModal = true;
      },
      closeModal() { if (!this.submitting) { this.showModal = false; this.editing = null; } },
      async submit() {
        if (!this.canSubmit || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          let res;
          if (this.editing?._id) res = await API.put(`/operations/sitreps/${this.editing._id}`, this.form);
          else res = await API.post("/operations/sitreps", this.form);
          const s = res.data?.sitrep;
          const idx = this.sitreps.findIndex((x) => x._id === s._id);
          if (idx >= 0) this.sitreps.splice(idx, 1, s); else this.sitreps.unshift(s);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to save."; }
        finally { this.submitting = false; }
      },
      async confirmDelete() {
        if (!this.editing?._id || !window.confirm("Delete this SITREP?")) return;
        this.submitting = true;
        try {
          await API.delete(`/operations/sitreps/${this.editing._id}`);
          this.sitreps = this.sitreps.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to delete."; }
        finally { this.submitting = false; }
      },
    },
    mounted() { this.load(); this.loadMissions(); },
  };
</script>
