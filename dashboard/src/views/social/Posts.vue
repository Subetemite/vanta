<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Social Media</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Captured Posts</h1>
      </div>
      <button v-if="canEdit" @click="openCreate" class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> Capture Post
      </button>
      <span v-else class="rounded-full border border-case-border bg-case-elevated px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        Read-only
      </span>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search content, handle, tags..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterPlatform" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Platforms</option>
        <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
      </select>
      <label class="flex items-center gap-2 text-xs text-gray-400">
        <input v-model="onlyFlagged" @change="load" type="checkbox" class="h-4 w-4 accent-primary" /> Flagged only
      </label>
    </div>

    <section v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="i in 6" :key="i" class="h-28 animate-pulse rounded-xl bg-case-elevated"></div>
    </section>
    <section v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</section>
    <section v-else-if="posts.length" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <article v-for="p in posts" :key="p._id" @click="openEdit(p)"
        class="bg-case-surface border border-case-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-200 truncate">@{{ p.accountHandle || "unknown" }}</p>
            <p class="text-[10px] text-gray-500">{{ p.platform || "—" }} · {{ formatDate(p.capturedAt) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <Icon v-if="p.flagged" icon="mdi:flag" class="text-red-400" :title="p.flagReason" />
            <Icon v-if="p.attachments?.length" icon="mdi:paperclip" class="text-primary text-sm" />
          </div>
        </div>
        <p class="text-[12px] text-gray-300 line-clamp-3 leading-snug">{{ p.content || p.extractedText || "—" }}</p>
        <div class="mt-3 pt-3 border-t border-case-border flex items-center justify-between text-[10px] text-gray-500">
          <div class="flex gap-3">
            <span><Icon icon="mdi:thumb-up-outline" class="inline" /> {{ p.likes || 0 }}</span>
            <span><Icon icon="mdi:comment-outline" class="inline" /> {{ p.comments || 0 }}</span>
            <span><Icon icon="mdi:share-outline" class="inline" /> {{ p.shares || 0 }}</span>
          </div>
          <span class="rounded-full px-2 py-0.5 uppercase tracking-wide font-medium" :class="sentimentBadge(p.sentiment)">{{ p.sentiment }}</span>
        </div>
      </article>
    </section>
    <section v-else class="bg-case-surface border border-case-border rounded-xl py-16 flex flex-col items-center justify-center">
      <Icon icon="mdi:post-outline" class="text-3xl text-gray-700 mb-2" />
      <p class="text-xs text-gray-500">No posts {{ searchQuery || onlyFlagged ? "match your filter" : "captured yet" }}.</p>
      <button v-if="canEdit && !searchQuery && !onlyFlagged" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Capture first post</button>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-3xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ canEdit ? (editing?._id ? "Edit Post" : "Capture Post") : "Post Details" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Account</label>
              <select v-model="form.account" @change="onAccountChange" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option value="">Free-text account...</option>
                <option v-for="a in accountOptions" :key="a._id" :value="a._id">@{{ a.handle }} ({{ a.platform }})</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Handle</label>
              <input v-model.trim="form.accountHandle" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Platform</label>
              <select v-model="form.platform" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option value="">Select...</option>
                <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Post Type</label>
              <select v-model="form.postType" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="t in POST_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Post URL</label>
              <input v-model.trim="form.postUrl" type="url" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Content</label>
              <textarea v-model="form.content" rows="5" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Sentiment</label>
              <select v-model="form.sentiment" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="s in SENTIMENTS" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Posted At</label>
              <input v-model="form.postedAt" type="datetime-local" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Likes</label>
                <input v-model.number="form.likes" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-2 py-1.5 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Comments</label>
                <input v-model.number="form.comments" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-2 py-1.5 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Shares</label>
                <input v-model.number="form.shares" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-2 py-1.5 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Views</label>
                <input v-model.number="form.views" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-2 py-1.5 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
            </div>
            <div class="sm:col-span-2 flex items-center gap-2">
              <input id="post-flagged" v-model="form.flagged" type="checkbox" class="h-4 w-4 accent-primary" />
              <label for="post-flagged" class="text-xs text-gray-300">Flag this post</label>
              <input v-if="form.flagged" v-model.trim="form.flagReason" type="text" placeholder="Flag reason"
                class="flex-1 rounded-md border border-case-border bg-case-card px-3 py-1.5 text-xs text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div v-if="submitError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>
          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="canEdit && editing?._id" @click="confirmDelete" class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated">{{ canEdit ? "Cancel" : "Close" }}</button>
              <button v-if="canEdit" @click="submit" :disabled="submitting" class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                <Icon v-if="submitting" icon="mdi:loading" class="animate-spin" />
                <Icon v-else icon="mdi:content-save-outline" />
                {{ submitting ? "Saving..." : (editing?._id ? "Update" : "Capture") }}
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
  const POST_TYPES = ["text", "image", "video", "link", "story", "live", "comment", "share"];
  const SENTIMENTS = ["positive", "neutral", "negative", "hostile", "unknown"];

  function emptyForm() {
    return {
      account: "", accountHandle: "", platform: "", postType: "text", postUrl: "",
      content: "", sentiment: "unknown", postedAt: "",
      likes: 0, comments: 0, shares: 0, views: 0,
      flagged: false, flagReason: "",
    };
  }
  function dtForInput(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
  }

  export default {
    name: "Posts",
    components: { Icon },
    data() {
      return { PLATFORMS, POST_TYPES, SENTIMENTS, posts: [], accountOptions: [], loading: false, error: "", searchQuery: "", searchDebounce: null, filterPlatform: "", onlyFlagged: false, showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "" };
    },
    computed: {
      canEdit() {
        return canEditModule("social");
      },
    },
    methods: {
      sentimentBadge(s) {
        const m = { positive: "bg-emerald-950/40 text-emerald-400", neutral: "bg-case-elevated text-gray-400", negative: "bg-amber-950/40 text-amber-400", hostile: "bg-red-950/40 text-red-400", unknown: "bg-case-elevated text-gray-500" };
        return m[s] || "bg-case-elevated text-gray-400";
      },
      formatDate(d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"; },
      onSearchInput() { clearTimeout(this.searchDebounce); this.searchDebounce = setTimeout(() => this.load(), 300); },
      onAccountChange() {
        const a = this.accountOptions.find((x) => x._id === this.form.account);
        if (a) { this.form.accountHandle = a.handle; this.form.platform = a.platform; }
      },
      async load() {
        this.loading = true; this.error = "";
        try {
          const params = new URLSearchParams();
          if (this.searchQuery.trim()) params.set("q", this.searchQuery.trim());
          if (this.filterPlatform) params.set("platform", this.filterPlatform);
          if (this.onlyFlagged) params.set("flagged", "true");
          const res = await API.get(`/social/posts${params.toString() ? `?${params}` : ""}`);
          this.posts = Array.isArray(res.data) ? res.data : [];
        } catch (err) { this.error = err.response?.data?.message || "Unable to load."; }
        finally { this.loading = false; }
      },
      async loadAccounts() {
        try { const res = await API.get("/social/accounts"); this.accountOptions = res.data || []; } catch { /* */ }
      },
      openCreate() { this.editing = null; this.form = emptyForm(); this.submitError = ""; this.showModal = true; },
      openEdit(p) {
        this.editing = p;
        this.form = { ...emptyForm(), ...p, postedAt: dtForInput(p.postedAt) };
        this.submitError = ""; this.showModal = true;
      },
      closeModal() { if (!this.submitting) { this.showModal = false; this.editing = null; } },
      async submit() {
        if (this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          const payload = { ...this.form, postedAt: this.form.postedAt || null };
          let res;
          if (this.editing?._id) res = await API.put(`/social/posts/${this.editing._id}`, payload);
          else res = await API.post("/social/posts", payload);
          const p = res.data?.post;
          const idx = this.posts.findIndex((x) => x._id === p._id);
          if (idx >= 0) this.posts.splice(idx, 1, p); else this.posts.unshift(p);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to save."; }
        finally { this.submitting = false; }
      },
      async confirmDelete() {
        if (!this.editing?._id || !window.confirm("Delete this post?")) return;
        this.submitting = true;
        try {
          await API.delete(`/social/posts/${this.editing._id}`);
          this.posts = this.posts.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to delete."; }
        finally { this.submitting = false; }
      },
    },
    mounted() { this.load(); this.loadAccounts(); },
  };
</script>
