<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Social Media</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Monitored Accounts</h1>
      </div>
      <button v-if="canEdit" @click="openCreate" class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> Add Account
      </button>
      <span v-else class="rounded-full border border-case-border bg-case-elevated px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        Read-only
      </span>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search by handle, name, location..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterPlatform" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Platforms</option>
        <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
      </select>
      <select v-model="filterStatus" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Status</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <section v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div v-for="i in 6" :key="i" class="h-32 animate-pulse rounded-xl bg-case-elevated"></div>
    </section>
    <section v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</section>
    <section v-else-if="accounts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <article v-for="a in accounts" :key="a._id" @click="openEdit(a)"
        class="bg-case-surface border border-case-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <Icon :icon="platformIcon(a.platform)" class="text-base flex-shrink-0" :class="platformColor(a.platform)" />
              <p class="text-sm font-semibold text-white truncate">@{{ a.handle }}</p>
            </div>
            <p class="text-[11px] text-gray-500 truncate">{{ a.displayName || a.suspectedRealName || "—" }}</p>
          </div>
          <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium flex-shrink-0" :class="riskBadge(a.riskLevel)">{{ a.riskLevel }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px] mt-3">
          <div><p class="text-gray-600 uppercase tracking-wide text-[9px]">Type</p><p class="text-gray-300 mt-0.5">{{ a.accountType }}</p></div>
          <div><p class="text-gray-600 uppercase tracking-wide text-[9px]">Status</p><p class="text-gray-300 mt-0.5">{{ a.status }}</p></div>
          <div v-if="a.followers"><p class="text-gray-600 uppercase tracking-wide text-[9px]">Followers</p><p class="text-gray-300 mt-0.5">{{ a.followers.toLocaleString() }}</p></div>
          <div v-if="a.location"><p class="text-gray-600 uppercase tracking-wide text-[9px]">Location</p><p class="text-gray-300 mt-0.5 truncate">{{ a.location }}</p></div>
        </div>
      </article>
    </section>
    <section v-else class="bg-case-surface border border-case-border rounded-xl py-16 flex flex-col items-center justify-center">
      <Icon icon="mdi:account-search-outline" class="text-3xl text-gray-700 mb-2" />
      <p class="text-xs text-gray-500">No accounts {{ searchQuery ? "match your search" : "monitored yet" }}.</p>
      <button v-if="canEdit && !searchQuery" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Add first account</button>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-2xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ canEdit ? (editing?._id ? "Edit Account" : "Monitor New Account") : "Account Details" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Handle / Username <span class="text-primary">*</span></label>
              <input v-model.trim="form.handle" type="text" placeholder="e.g. juandelacruz_2024" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Platform <span class="text-primary">*</span></label>
              <select v-model="form.platform" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option value="">Select platform...</option>
                <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Display Name</label>
              <input v-model.trim="form.displayName" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Suspected Real Name</label>
              <input v-model.trim="form.suspectedRealName" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Profile URL</label>
              <input v-model.trim="form.profileUrl" type="url" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Account Type</label>
              <select v-model="form.accountType" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
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
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Risk Level</label>
              <select v-model="form.riskLevel" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="r in RISKS" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Followers</label>
              <input v-model.number="form.followers" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Location</label>
              <input v-model.trim="form.location" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Notes</label>
              <textarea v-model="form.notes" rows="3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div v-if="submitError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>
          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="canEdit && editing?._id" @click="confirmDelete" class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated">{{ canEdit ? "Cancel" : "Close" }}</button>
              <button v-if="canEdit" @click="submit" :disabled="!canSubmit || submitting" class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
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
  import { canEditModule } from "@/services/access";

  const PLATFORMS = ["facebook", "twitter", "x", "instagram", "tiktok", "youtube", "telegram", "viber", "messenger", "whatsapp", "reddit", "discord", "other"];
  const TYPES = ["target", "asset", "agency", "informant", "civilian", "official"];
  const STATUSES = ["monitoring", "watch-list", "archived", "cleared"];
  const RISKS = ["low", "moderate", "high", "critical"];

  const PLATFORM_ICONS = {
    facebook: "mdi:facebook", twitter: "mdi:twitter", x: "mdi:close-thick", instagram: "mdi:instagram", tiktok: "ic:baseline-tiktok",
    youtube: "mdi:youtube", telegram: "mdi:telegram", viber: "mdi:phone-message-outline", messenger: "mdi:facebook-messenger",
    whatsapp: "mdi:whatsapp", reddit: "mdi:reddit", discord: "mdi:discord", other: "mdi:web",
  };
  const PLATFORM_COLORS = {
    facebook: "text-blue-400", twitter: "text-sky-400", x: "text-gray-200", instagram: "text-pink-400", tiktok: "text-gray-200",
    youtube: "text-red-500", telegram: "text-cyan-400", viber: "text-purple-400", messenger: "text-blue-400",
    whatsapp: "text-emerald-400", reddit: "text-orange-500", discord: "text-indigo-400", other: "text-gray-400",
  };

  function emptyForm() {
    return { handle: "", platform: "", displayName: "", suspectedRealName: "", profileUrl: "", accountType: "target", status: "monitoring", riskLevel: "moderate", followers: 0, location: "", notes: "" };
  }

  export default {
    name: "Accounts",
    components: { Icon },
    data() {
      return { PLATFORMS, TYPES, STATUSES, RISKS, accounts: [], loading: false, error: "", searchQuery: "", searchDebounce: null, filterPlatform: "", filterStatus: "", showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "" };
    },
    computed: {
      canSubmit() { return !!(this.form.handle?.trim() && this.form.platform); },
      canEdit() { return canEditModule("social"); },
    },
    methods: {
      platformIcon(p) { return PLATFORM_ICONS[p] || "mdi:web"; },
      platformColor(p) { return PLATFORM_COLORS[p] || "text-gray-400"; },
      riskBadge(r) {
        const m = { low: "bg-case-elevated text-gray-400", moderate: "bg-cyan-950/40 text-cyan-400", high: "bg-amber-950/40 text-amber-400", critical: "bg-red-950/40 text-red-400" };
        return m[r] || "bg-case-elevated text-gray-400";
      },
      onSearchInput() { clearTimeout(this.searchDebounce); this.searchDebounce = setTimeout(() => this.load(), 300); },
      async load() {
        this.loading = true; this.error = "";
        try {
          const params = new URLSearchParams();
          if (this.searchQuery.trim()) params.set("q", this.searchQuery.trim());
          if (this.filterPlatform) params.set("platform", this.filterPlatform);
          if (this.filterStatus) params.set("status", this.filterStatus);
          const res = await API.get(`/social/accounts${params.toString() ? `?${params}` : ""}`);
          this.accounts = Array.isArray(res.data) ? res.data : [];
        } catch (err) { this.error = err.response?.data?.message || "Unable to load."; }
        finally { this.loading = false; }
      },
      openCreate() { this.editing = null; this.form = emptyForm(); this.submitError = ""; this.showModal = true; },
      openEdit(a) { this.editing = a; this.form = { ...emptyForm(), ...a }; this.submitError = ""; this.showModal = true; },
      closeModal() { if (!this.submitting) { this.showModal = false; this.editing = null; } },
      async submit() {
        if (!this.canSubmit || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          let res;
          if (this.editing?._id) res = await API.put(`/social/accounts/${this.editing._id}`, this.form);
          else res = await API.post("/social/accounts", this.form);
          const a = res.data?.account;
          const idx = this.accounts.findIndex((x) => x._id === a._id);
          if (idx >= 0) this.accounts.splice(idx, 1, a); else this.accounts.unshift(a);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to save."; }
        finally { this.submitting = false; }
      },
      async confirmDelete() {
        if (!this.editing?._id || !window.confirm(`Stop monitoring @${this.editing.handle}?`)) return;
        this.submitting = true;
        try {
          await API.delete(`/social/accounts/${this.editing._id}`);
          this.accounts = this.accounts.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to delete."; }
        finally { this.submitting = false; }
      },
    },
    mounted() { this.load(); },
  };
</script>
