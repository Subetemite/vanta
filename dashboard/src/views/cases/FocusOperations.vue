<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <!-- ── Page header ─────────────────────────────────────────────────── -->
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Case Management</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">4-Focus Operations</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <router-link
          to="/cases/records"
          class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs font-medium text-gray-300 hover:bg-case-elevated transition-colors flex items-center gap-2">
          <Icon icon="mdi:account-box-outline" class="text-base" /> Records
        </router-link>
        <router-link
          to="/cases/operations"
          class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs font-medium text-gray-300 hover:bg-case-elevated transition-colors flex items-center gap-2">
          <Icon icon="mdi:target" class="text-base" /> Operations
        </router-link>
        <button
          @click="openCreate"
          class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Icon icon="mdi:plus" class="text-base" /> New Data Entry
        </button>
      </div>
    </header>

    <EntryFormModal
      :open="showModal"
      category="focus-operations"
      context-label="4-Focus Operations"
      :category-options="focusAreas"
      :default-sub-category="activeFocus"
      :entry="editingEntry"
      @close="closeModal"
      @saved="onEntrySaved"
      @deleted="onEntryDeleted" />

    <!-- ── Focus tiles ─────────────────────────────────────────────────── -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <button
        v-for="focus in focusAreas"
        :key="focus.key"
        @click="activeFocus = focus.key"
        class="text-left bg-case-surface border border-case-border rounded-xl p-4 hover:border-primary/40 hover:bg-case-card transition-colors"
        :class="{ 'border-primary/60 bg-case-card ring-1 ring-primary/20': activeFocus === focus.key }">
        <div class="flex items-center justify-between mb-3">
          <Icon :icon="focus.icon" class="text-xl text-primary" />
          <span class="text-[10px] uppercase tracking-[0.2em] text-gray-600">{{ focus.tag }}</span>
        </div>
        <p class="text-sm font-semibold text-white">{{ focus.title }}</p>
        <p class="text-[11px] text-gray-500 mt-1">{{ focus.subtitle }}</p>
        <p class="mt-3 text-2xl font-bold text-primary leading-none">{{ countFor(focus.key) }}</p>
        <p class="text-[10px] text-gray-600 mt-1">entries logged</p>
      </button>
    </section>

    <!-- ── Search bar ──────────────────────────────────────────────────── -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          type="text"
          placeholder="Search by title, ref no, agency, location..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
      </div>
      <span v-if="searchQuery" class="text-[10px] text-gray-600">
        {{ entries.length }} match{{ entries.length === 1 ? "" : "es" }}
      </span>
    </div>

    <!-- ── Entries list ────────────────────────────────────────────────── -->
    <section class="bg-case-surface border border-case-border rounded-xl">
      <header class="flex items-center justify-between border-b border-case-border px-5 py-3">
        <div>
          <h2 class="text-sm font-semibold text-white">{{ activeFocusTitle }} — Entries</h2>
          <p class="text-[10px] text-gray-600">Click an entry to edit · search active across this focus area.</p>
        </div>
        <Icon icon="bi:three-dots-vertical" class="text-gray-700" />
      </header>
      <div class="p-5">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded-lg bg-case-elevated"></div>
        </div>
        <div v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">
          {{ error }}
        </div>
        <table v-else-if="filteredEntries.length" class="w-full text-sm">
          <thead>
            <tr class="border-b border-case-border">
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Title</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Ref No.</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Lead Agency</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Status</th>
              <th class="py-2.5 px-3 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in filteredEntries" :key="entry._id"
              @click="openEdit(entry)"
              class="border-b border-case-border/40 hover:bg-case-card transition-colors cursor-pointer">
              <td class="py-2.5 px-3 text-gray-300 font-medium">
                <div class="flex items-center gap-2">
                  <span class="truncate">{{ entry.title }}</span>
                  <Icon v-if="entry.attachments?.length" icon="mdi:paperclip" class="text-primary text-sm flex-shrink-0" />
                </div>
              </td>
              <td class="py-2.5 px-3 text-gray-500 text-xs">{{ entry.referenceNo || "—" }}</td>
              <td class="py-2.5 px-3 text-gray-500">{{ entry.leadAgency || "—" }}</td>
              <td class="py-2.5 px-3">
                <span class="rounded-full bg-case-elevated px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">
                  {{ entry.status || "open" }}
                </span>
              </td>
              <td class="py-2.5 px-3 text-gray-600 text-right text-xs">{{ formatDate(entry.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="py-12 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:folder-search-outline" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">
            {{ searchQuery ? `No entries match "${searchQuery}".` : `No entries yet for ${activeFocusTitle}.` }}
          </p>
          <button
            v-if="!searchQuery"
            @click="openCreate"
            class="mt-3 text-xs text-primary hover:underline">
            Add the first data entry
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";
  import EntryFormModal from "./components/EntryFormModal.vue";

  const FOCUS_AREAS = [
    { key: "economic-sabotage", tag: "F1", title: "Economic Sabotage", subtitle: "Acts undermining the national economy", icon: "mdi:chart-line-variant" },
    { key: "anti-pogo", tag: "F2", title: "Anti-POGO", subtitle: "Philippine Offshore Gaming Operators", icon: "mdi:dice-multiple-outline" },
    { key: "organized-crimes", tag: "F3", title: "Organized Crimes", subtitle: "Syndicated and transnational groups", icon: "mdi:account-group-outline" },
    { key: "graft-corruption", tag: "F4", title: "Graft & Corruption", subtitle: "Public-office malfeasance", icon: "mdi:scale-balance" },
  ];

  export default {
    name: "FocusOperations",
    components: { Icon, EntryFormModal },
    data() {
      return {
        focusAreas: FOCUS_AREAS,
        activeFocus: FOCUS_AREAS[0].key,
        entries: [],
        loading: false,
        error: "",
        showModal: false,
        editingEntry: null,
        searchQuery: "",
        searchDebounce: null,
      };
    },
    computed: {
      activeFocusTitle() {
        return this.focusAreas.find((f) => f.key === this.activeFocus)?.title || "";
      },
      filteredEntries() {
        return this.entries.filter((e) => e.subCategory === this.activeFocus);
      },
    },
    methods: {
      countFor(key) {
        return this.entries.filter((e) => e.subCategory === key).length;
      },
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
          const url = `/cases/entries/focus-operations${queryString ? `?${queryString}` : ""}`;
          const res = await API.get(url);
          this.entries = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load focus operations.";
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
        if (entry.subCategory) this.activeFocus = entry.subCategory;
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
