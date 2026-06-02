<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Case Management</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">NALECC-SCOC</h1>
        <p class="mt-1 text-xs text-gray-500 max-w-2xl">
          National Law Enforcement Coordinating Committee — Sub-Committee on Organized Crime.
          Track resolutions, meetings and action items.
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
      category="nalecc-scoc"
      context-label="NALECC-SCOC"
      :category-options="[]"
      :entry="editingEntry"
      @close="closeModal"
      @saved="onEntrySaved"
      @deleted="onEntryDeleted" />

    <section class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div v-for="stat in summary" :key="stat.key"
        class="bg-case-surface border border-case-border rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">{{ stat.label }}</p>
          <Icon :icon="stat.icon" class="text-gray-700 text-base" />
        </div>
        <p class="text-3xl font-bold text-white leading-none">{{ stat.value }}</p>
      </div>
    </section>

    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          type="text"
          placeholder="Search resolutions, ref no, agency..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
      </div>
      <span v-if="searchQuery" class="text-[10px] text-gray-600">
        {{ entries.length }} match{{ entries.length === 1 ? "" : "es" }}
      </span>
    </div>

    <section class="bg-case-surface border border-case-border rounded-xl">
      <header class="flex items-center justify-between border-b border-case-border px-5 py-3">
        <h2 class="text-sm font-semibold text-white">Resolutions &amp; Meetings</h2>
        <Icon icon="bi:three-dots-vertical" class="text-gray-700" />
      </header>
      <div class="p-5">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded-lg bg-case-elevated"></div>
        </div>
        <div v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">
          {{ error }}
        </div>
        <table v-else-if="entries.length" class="w-full text-sm">
          <thead>
            <tr class="border-b border-case-border">
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Reference</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Title</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Status</th>
              <th class="py-2.5 px-3 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in entries" :key="entry._id"
              @click="openEdit(entry)"
              class="border-b border-case-border/40 hover:bg-case-card transition-colors cursor-pointer">
              <td class="py-2.5 px-3 text-gray-400 text-xs">{{ entry.referenceNo || "—" }}</td>
              <td class="py-2.5 px-3 text-gray-300 font-medium">
                <div class="flex items-center gap-2">
                  <span class="truncate">{{ entry.title }}</span>
                  <Icon v-if="entry.attachments?.length" icon="mdi:paperclip" class="text-primary text-sm flex-shrink-0" />
                </div>
              </td>
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
          <Icon icon="mdi:gavel" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">
            {{ searchQuery ? `No entries match "${searchQuery}".` : "No NALECC-SCOC resolutions on file yet." }}
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
    name: "NaleccScoc",
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
    computed: {
      summary() {
        const open = this.entries.filter((e) => (e.status || "open") === "open").length;
        const closed = this.entries.filter((e) => e.status === "closed").length;
        return [
          { key: "total", label: "Total", value: this.entries.length, icon: "mdi:gavel" },
          { key: "open", label: "Open", value: open, icon: "mdi:circle-outline" },
          { key: "closed", label: "Closed", value: closed, icon: "mdi:check-circle-outline" },
        ];
      },
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
          const url = `/cases/entries/nalecc-scoc${queryString ? `?${queryString}` : ""}`;
          const res = await API.get(url);
          this.entries = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load NALECC-SCOC entries.";
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
