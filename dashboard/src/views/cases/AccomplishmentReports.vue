<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Case Management</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Accomplishment Reports</h1>
        <p class="mt-1 text-xs text-gray-500 max-w-2xl">
          Periodic accomplishment submissions across operations and coordination activities.
        </p>
      </div>
      <button
        @click="openCreate"
        class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> New Data Entry
      </button>
    </header>

    <EntryFormModal
      :open="showModal"
      category="accomplishment-reports"
      context-label="Accomplishment Reports"
      :category-options="[]"
      :entry="editingEntry"
      @close="closeModal"
      @saved="onEntrySaved"
      @deleted="onEntryDeleted" />

    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          type="text"
          placeholder="Search reports by title, ref no..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
      </div>
      <span v-if="searchQuery" class="text-[10px] text-gray-600">
        {{ entries.length }} match{{ entries.length === 1 ? "" : "es" }}
      </span>
    </div>

    <section class="bg-case-surface border border-case-border rounded-xl">
      <header class="flex items-center justify-between border-b border-case-border px-5 py-3">
        <h2 class="text-sm font-semibold text-white">Submitted Reports</h2>
        <Icon icon="bi:three-dots-vertical" class="text-gray-700" />
      </header>
      <div class="p-5">
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-lg bg-case-elevated"></div>
        </div>
        <div v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">
          {{ error }}
        </div>
        <div v-else-if="entries.length" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <article
            v-for="entry in entries"
            :key="entry._id"
            @click="openEdit(entry)"
            class="rounded-lg border border-case-border bg-case-card p-4 flex flex-col cursor-pointer hover:bg-case-elevated transition-colors">
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-gray-200">{{ entry.title }}</p>
              <Icon v-if="entry.attachments?.length" icon="mdi:paperclip" class="text-primary text-base flex-shrink-0" />
              <Icon v-else icon="mdi:file-chart-outline" class="text-primary text-base flex-shrink-0" />
            </div>
            <p v-if="entry.referenceNo" class="text-[11px] text-gray-500 mt-1">{{ entry.referenceNo }}</p>
            <p v-if="entry.description" class="text-[11px] text-gray-500 mt-2 line-clamp-3">{{ entry.description }}</p>
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-case-border">
              <span class="rounded-full bg-case-elevated px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">
                {{ entry.status || "draft" }}
              </span>
              <p class="text-[11px] text-gray-600">{{ formatDate(entry.createdAt) }}</p>
            </div>
          </article>
        </div>
        <div v-else class="py-12 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:file-chart-outline" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">
            {{ searchQuery ? `No reports match "${searchQuery}".` : "No accomplishment reports submitted yet." }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";
  import EntryFormModal from "./components/EntryFormModal.vue";

  export default {
    name: "AccomplishmentReports",
    components: { Icon, EntryFormModal },
    data() {
      return {
        entries: [],
        loading: false,
        error: "",
        showModal: false,
        editingEntry: null,
        searchQuery: "",
        searchDebounce: null,
      };
    },
    methods: {
      formatDate(d) {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      },
      async load() {
        this.loading = true;
        this.error = "";
        try {
          const params = {};
          if (this.searchQuery.trim()) params.q = this.searchQuery.trim();
          const queryString = new URLSearchParams(params).toString();
          const url = `/cases/entries/accomplishment-reports${queryString ? `?${queryString}` : ""}`;
          const res = await API.get(url);
          this.entries = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load reports.";
        } finally {
          this.loading = false;
        }
      },
      onSearchInput() {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => this.load(), 300);
      },
      openCreate() {
        this.editingEntry = null;
        this.showModal = true;
      },
      openEdit(entry) {
        this.editingEntry = entry;
        this.showModal = true;
      },
      closeModal() {
        this.showModal = false;
        this.editingEntry = null;
      },
      onEntrySaved(entry) {
        if (!entry) {
          this.load();
          return;
        }
        const idx = this.entries.findIndex((e) => e._id === entry._id);
        if (idx >= 0) {
          this.entries.splice(idx, 1, entry);
        } else {
          this.entries.unshift(entry);
        }
      },
      onEntryDeleted(id) {
        this.entries = this.entries.filter((e) => e._id !== id);
      },
    },
    mounted() {
      this.load();
    },
  };
</script>
