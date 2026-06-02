<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Social Media</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Campaigns</h1>
      </div>
      <button v-if="canEdit" @click="openCreate" class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> New Campaign
      </button>
      <span v-else class="rounded-full border border-case-border bg-case-elevated px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        Read-only
      </span>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search name, objective, keywords, lead..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterStatus" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
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
        <table v-else-if="campaigns.length" class="w-full text-sm">
          <thead>
            <tr class="border-b border-case-border">
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Name</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Objective</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Status</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Lead</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Platforms</th>
              <th class="py-2.5 px-3 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Window</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in campaigns" :key="c._id" @click="openEdit(c)" class="border-b border-case-border/40 hover:bg-case-card transition-colors" :class="canEdit ? 'cursor-pointer' : 'cursor-default'">
              <td class="py-2.5 px-3 text-gray-200 font-medium">{{ c.name }}</td>
              <td class="py-2.5 px-3 text-gray-400 text-xs truncate max-w-xs">{{ c.objective || "—" }}</td>
              <td class="py-2.5 px-3"><span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="statusBadge(c.status)">{{ c.status }}</span></td>
              <td class="py-2.5 px-3 text-gray-400 text-xs">{{ c.leadAnalyst || "—" }}</td>
              <td class="py-2.5 px-3 text-gray-400 text-xs">
                <span v-if="c.platforms?.length" class="inline-flex flex-wrap gap-1">
                  <span v-for="p in c.platforms.slice(0, 3)" :key="p" class="rounded bg-case-elevated px-1.5 py-0.5 text-[10px] text-gray-300">{{ p }}</span>
                  <span v-if="c.platforms.length > 3" class="text-[10px] text-gray-500">+{{ c.platforms.length - 3 }}</span>
                </span>
                <span v-else>—</span>
              </td>
              <td class="py-2.5 px-3 text-gray-500 text-right text-xs whitespace-nowrap">{{ formatRange(c.startsAt, c.endsAt) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="py-12 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:bullhorn-outline" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No campaigns {{ searchQuery || filterStatus ? "match your filters" : "yet" }}.</p>
          <button v-if="canEdit && !searchQuery && !filterStatus" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Create first campaign</button>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-2xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ canEdit ? (editing?._id ? "Edit Campaign" : "New Campaign") : "Campaign Details" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Name <span class="text-primary">*</span></label>
              <input v-model.trim="form.name" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Objective</label>
              <input v-model.trim="form.objective" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Status</label>
              <select v-model="form.status" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Lead Analyst</label>
              <input v-model.trim="form.leadAnalyst" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Starts At</label>
              <input v-model="form.startsAt" type="datetime-local" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Ends At</label>
              <input v-model="form.endsAt" type="datetime-local" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Platforms <span class="text-gray-600 normal-case tracking-normal">(comma-separated)</span></label>
              <input v-model="form.platformsText" type="text" placeholder="facebook, x, telegram" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Keywords <span class="text-gray-600 normal-case tracking-normal">(comma-separated)</span></label>
              <input v-model="form.keywordsText" type="text" placeholder="trafficking, recruitment" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Hashtags <span class="text-gray-600 normal-case tracking-normal">(comma-separated, no #)</span></label>
              <input v-model="form.hashtagsText" type="text" placeholder="opwatch, antipogo" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Team <span class="text-gray-600 normal-case tracking-normal">(comma-separated)</span></label>
              <input v-model="form.teamText" type="text" placeholder="Analyst A, Analyst B" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Description</label>
              <textarea v-model="form.description" rows="4" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div v-if="submitError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>
          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="canEdit && editing?._id" @click="confirmDelete" class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated">{{ canEdit ? "Cancel" : "Close" }}</button>
              <button v-if="canEdit" @click="submit" :disabled="!form.name?.trim() || submitting" class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                <Icon v-if="submitting" icon="mdi:loading" class="animate-spin" />
                <Icon v-else icon="mdi:content-save-outline" />
                {{ submitting ? "Saving..." : (editing?._id ? "Update" : "Create") }}
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

  const STATUSES = ["planned", "active", "paused", "completed", "archived"];

  function emptyForm() {
    return {
      name: "", objective: "", status: "planned",
      leadAnalyst: "", startsAt: "", endsAt: "",
      platformsText: "", keywordsText: "", hashtagsText: "", teamText: "",
      description: "",
    };
  }
  function dtForInput(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
  }
  function listToText(arr) { return Array.isArray(arr) ? arr.join(", ") : ""; }
  function textToList(text) {
    return String(text || "").split(",").map((s) => s.trim()).filter(Boolean);
  }

  export default {
    name: "Campaigns",
    components: { Icon },
    data() {
      return {
        STATUSES,
        campaigns: [], loading: false, error: "",
        searchQuery: "", searchDebounce: null, filterStatus: "",
        showModal: false, editing: null, form: emptyForm(),
        submitting: false, submitError: "",
      };
    },
    computed: {
      canEdit() {
        return canEditModule("social");
      },
    },
    methods: {
      statusBadge(s) {
        const m = {
          planned: "bg-case-elevated text-gray-400",
          active: "bg-emerald-950/40 text-emerald-400",
          paused: "bg-amber-950/40 text-amber-400",
          completed: "bg-cyan-950/40 text-cyan-400",
          archived: "bg-case-elevated text-gray-500",
        };
        return m[s] || "bg-case-elevated text-gray-400";
      },
      formatDate(d) {
        return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
      },
      formatRange(start, end) {
        if (!start && !end) return "—";
        if (start && end) return `${this.formatDate(start)} → ${this.formatDate(end)}`;
        if (start) return `from ${this.formatDate(start)}`;
        return `until ${this.formatDate(end)}`;
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
          const res = await API.get(`/social/campaigns${params.toString() ? `?${params}` : ""}`);
          this.campaigns = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load.";
        } finally {
          this.loading = false;
        }
      },
      openCreate() {
        this.editing = null;
        this.form = emptyForm();
        this.submitError = "";
        this.showModal = true;
      },
      openEdit(c) {
        this.editing = c;
        this.form = {
          ...emptyForm(),
          name: c.name || "",
          objective: c.objective || "",
          status: c.status || "planned",
          leadAnalyst: c.leadAnalyst || "",
          startsAt: dtForInput(c.startsAt),
          endsAt: dtForInput(c.endsAt),
          platformsText: listToText(c.platforms),
          keywordsText: listToText(c.keywords),
          hashtagsText: listToText(c.hashtags),
          teamText: listToText(c.team),
          description: c.description || "",
        };
        this.submitError = "";
        this.showModal = true;
      },
      closeModal() {
        if (!this.submitting) {
          this.showModal = false;
          this.editing = null;
        }
      },
      buildPayload() {
        return {
          name: this.form.name.trim(),
          objective: this.form.objective.trim(),
          status: this.form.status,
          leadAnalyst: this.form.leadAnalyst.trim(),
          startsAt: this.form.startsAt || null,
          endsAt: this.form.endsAt || null,
          platforms: textToList(this.form.platformsText),
          keywords: textToList(this.form.keywordsText),
          hashtags: textToList(this.form.hashtagsText),
          team: textToList(this.form.teamText),
          description: this.form.description.trim(),
        };
      },
      async submit() {
        if (!this.form.name?.trim() || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          const payload = this.buildPayload();
          let res;
          if (this.editing?._id) res = await API.put(`/social/campaigns/${this.editing._id}`, payload);
          else res = await API.post("/social/campaigns", payload);
          const c = res.data?.campaign;
          const idx = this.campaigns.findIndex((x) => x._id === c._id);
          if (idx >= 0) this.campaigns.splice(idx, 1, c); else this.campaigns.unshift(c);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to save.";
        } finally {
          this.submitting = false;
        }
      },
      async confirmDelete() {
        if (!this.editing?._id || !window.confirm("Delete this campaign?")) return;
        this.submitting = true;
        try {
          await API.delete(`/social/campaigns/${this.editing._id}`);
          this.campaigns = this.campaigns.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to delete.";
        } finally {
          this.submitting = false;
        }
      },
    },
    mounted() { this.load(); },
  };
</script>
