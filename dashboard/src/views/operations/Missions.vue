<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Operations</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Missions</h1>
      </div>
      <button @click="openCreate" class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> New Mission
      </button>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search code name, ID, commander, location..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterStatus" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Status</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="filterType" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Types</option>
        <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <section v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div v-for="i in 6" :key="i" class="h-44 animate-pulse rounded-xl bg-case-elevated"></div>
    </section>
    <section v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</section>
    <section v-else-if="missions.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <article v-for="m in missions" :key="m._id" @click="openEdit(m)"
        class="bg-case-surface border border-case-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors flex flex-col">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="min-w-0">
            <p class="text-base font-bold text-white truncate">{{ m.codeName }}</p>
            <p class="text-[10px] text-gray-500">{{ m.missionId }}</p>
          </div>
          <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium flex-shrink-0" :class="statusBadge(m.status)">{{ m.status }}</span>
        </div>
        <p class="text-[11px] text-gray-400 line-clamp-2 mb-3">{{ m.objective || "No objective specified" }}</p>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div><p class="text-gray-600 uppercase tracking-wide text-[9px]">Type</p><p class="text-gray-300 mt-0.5">{{ m.type }}</p></div>
          <div><p class="text-gray-600 uppercase tracking-wide text-[9px]">Priority</p><p class="text-gray-300 mt-0.5">{{ m.priority }}</p></div>
          <div v-if="m.commander"><p class="text-gray-600 uppercase tracking-wide text-[9px]">Commander</p><p class="text-gray-300 mt-0.5 truncate">{{ m.commander }}</p></div>
          <div v-if="m.location"><p class="text-gray-600 uppercase tracking-wide text-[9px]">Location</p><p class="text-gray-300 mt-0.5 truncate">{{ m.location }}</p></div>
        </div>
        <div class="mt-3 pt-3 border-t border-case-border flex gap-2" @click.stop>
          <button v-if="m.status === 'planned'" @click="activate(m)"
            class="flex-1 rounded-md bg-emerald-950/40 border border-emerald-700/40 px-2 py-1 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-950/60">Activate</button>
          <button v-if="m.status === 'active'" @click="complete(m)"
            class="flex-1 rounded-md bg-cyan-950/40 border border-cyan-700/40 px-2 py-1 text-[10px] font-semibold text-cyan-400 hover:bg-cyan-950/60">Complete</button>
          <button @click="openEdit(m)" class="flex-1 rounded-md border border-case-border bg-case-card px-2 py-1 text-[10px] font-semibold text-gray-400 hover:bg-case-elevated">Details</button>
        </div>
      </article>
    </section>
    <section v-else class="bg-case-surface border border-case-border rounded-xl py-16 flex flex-col items-center justify-center">
      <Icon icon="mdi:target" class="text-3xl text-gray-700 mb-2" />
      <p class="text-xs text-gray-500">No missions {{ searchQuery ? "match your search" : "yet" }}.</p>
      <button v-if="!searchQuery" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Plan first mission</button>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-3xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ editing?._id ? `Mission ${editing.missionId || editing.codeName}` : "New Mission" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Code Name <span class="text-primary">*</span></label>
              <input v-model.trim="form.codeName" type="text" placeholder="e.g. OPLAN HARVEST" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Type</label>
              <select v-model="form.type" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Status</label>
              <select v-model="form.status" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Priority</label>
              <select v-model="form.priority" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Classification</label>
              <select v-model="form.classification" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="c in CLASSIFICATIONS" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Lead Agency</label>
              <input v-model.trim="form.leadAgency" type="text" placeholder="e.g. PNP-CIDG" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Commander</label>
              <input v-model.trim="form.commander" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Team Leader</label>
              <input v-model.trim="form.teamLeader" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Location</label>
              <input v-model.trim="form.location" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">City / District</label>
              <input v-model.trim="form.cityDistrict" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Planned Start</label>
              <input v-model="form.plannedStart" type="datetime-local" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Planned End</label>
              <input v-model="form.plannedEnd" type="datetime-local" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Objective</label>
              <textarea v-model="form.objective" rows="2" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Description / Plan</label>
              <textarea v-model="form.description" rows="4" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div v-if="submitError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>
          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="editing?._id" @click="confirmDelete" class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated">Cancel</button>
              <button @click="submit" :disabled="!form.codeName?.trim() || submitting"
                class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
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

  const STATUSES = ["planned", "active", "paused", "completed", "cancelled"];
  const TYPES = ["surveillance", "raid", "checkpoint", "rescue", "investigation", "escort", "patrol", "joint-operation", "intelligence", "other"];
  const PRIORITIES = ["low", "normal", "high", "critical"];
  const CLASSIFICATIONS = ["unclassified", "restricted", "confidential", "secret", "top-secret"];

  function emptyForm() {
    return { codeName: "", type: "investigation", status: "planned", priority: "normal", classification: "unclassified", leadAgency: "", commander: "", teamLeader: "", location: "", cityDistrict: "", plannedStart: "", plannedEnd: "", objective: "", description: "" };
  }
  function dtForInput(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
  }

  export default {
    name: "Missions",
    components: { Icon },
    data() {
      return { STATUSES, TYPES, PRIORITIES, CLASSIFICATIONS, missions: [], loading: false, error: "", searchQuery: "", searchDebounce: null, filterStatus: "", filterType: "", showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "" };
    },
    methods: {
      statusBadge(s) {
        const m = { planned: "bg-case-elevated text-gray-400", active: "bg-emerald-950/40 text-emerald-400", paused: "bg-amber-950/40 text-amber-400", completed: "bg-cyan-950/40 text-cyan-400", cancelled: "bg-red-950/40 text-red-400" };
        return m[s] || "bg-case-elevated text-gray-400";
      },
      onSearchInput() { clearTimeout(this.searchDebounce); this.searchDebounce = setTimeout(() => this.load(), 300); },
      async load() {
        this.loading = true; this.error = "";
        try {
          const params = new URLSearchParams();
          if (this.searchQuery.trim()) params.set("q", this.searchQuery.trim());
          if (this.filterStatus) params.set("status", this.filterStatus);
          if (this.filterType) params.set("type", this.filterType);
          const res = await API.get(`/operations/missions${params.toString() ? `?${params}` : ""}`);
          this.missions = Array.isArray(res.data) ? res.data : [];
        } catch (err) { this.error = err.response?.data?.message || "Unable to load missions."; }
        finally { this.loading = false; }
      },
      openCreate() { this.editing = null; this.form = emptyForm(); this.submitError = ""; this.showModal = true; },
      openEdit(m) {
        this.editing = m;
        this.form = { ...emptyForm(), ...m, plannedStart: dtForInput(m.plannedStart), plannedEnd: dtForInput(m.plannedEnd) };
        this.submitError = ""; this.showModal = true;
      },
      closeModal() { if (!this.submitting) { this.showModal = false; this.editing = null; } },
      async submit() {
        if (!this.form.codeName?.trim() || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          const payload = { ...this.form, plannedStart: this.form.plannedStart || null, plannedEnd: this.form.plannedEnd || null };
          let res;
          if (this.editing?._id) res = await API.put(`/operations/missions/${this.editing._id}`, payload);
          else res = await API.post("/operations/missions", payload);
          const m = res.data?.mission;
          const idx = this.missions.findIndex((x) => x._id === m._id);
          if (idx >= 0) this.missions.splice(idx, 1, m); else this.missions.unshift(m);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to save."; }
        finally { this.submitting = false; }
      },
      async confirmDelete() {
        if (!this.editing?._id || !window.confirm(`Delete mission ${this.editing.codeName}?`)) return;
        this.submitting = true;
        try {
          await API.delete(`/operations/missions/${this.editing._id}`);
          this.missions = this.missions.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to delete."; }
        finally { this.submitting = false; }
      },
      async activate(m) {
        try {
          const res = await API.post(`/operations/missions/${m._id}/activate`);
          const updated = res.data?.mission;
          const idx = this.missions.findIndex((x) => x._id === updated._id);
          if (idx >= 0) this.missions.splice(idx, 1, updated);
        } catch (err) { alert(err.response?.data?.message || "Unable to activate."); }
      },
      async complete(m) {
        if (!window.confirm(`Mark ${m.codeName} as completed?`)) return;
        try {
          const res = await API.post(`/operations/missions/${m._id}/complete`);
          const updated = res.data?.mission;
          const idx = this.missions.findIndex((x) => x._id === updated._id);
          if (idx >= 0) this.missions.splice(idx, 1, updated);
        } catch (err) { alert(err.response?.data?.message || "Unable to complete."); }
      },
    },
    mounted() { this.load(); },
  };
</script>
