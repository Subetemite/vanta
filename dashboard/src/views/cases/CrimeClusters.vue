<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Case Management</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">18 Crime Clusters</h1>
        <p class="mt-1 text-xs text-gray-500 max-w-2xl">
          Focused-Operations crime cluster groupings. Three groups, six crime areas each — select an
          area to file or review entries.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[10px] uppercase tracking-[0.2em] text-gray-600">Total</span>
        <span class="rounded-full border border-case-border bg-case-surface px-3 py-1 text-primary font-semibold text-xs">
          {{ entries.length }}
        </span>
        <button
          @click="openCreate"
          class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Icon icon="mdi:plus" class="text-base" /> New Data Entry
        </button>
      </div>
    </header>

    <EntryFormModal
      :open="showModal"
      category="crime-clusters"
      context-label="18 Crime Clusters"
      :category-options="allAreas"
      :default-sub-category="selected?.key || ''"
      :entry="editingEntry"
      @close="closeModal"
      @saved="onEntrySaved"
      @deleted="onEntryDeleted" />

    <!-- ── Search bar ──────────────────────────────────────────────────── -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          type="text"
          placeholder="Search across all crime clusters..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
      </div>
      <span v-if="searchQuery" class="text-[10px] text-gray-600">
        {{ entries.length }} match{{ entries.length === 1 ? "" : "es" }}
      </span>
    </div>

    <!-- ── Three groups, six areas each ────────────────────────────────── -->
    <section v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="bg-case-surface border border-case-border rounded-xl p-5 space-y-3">
        <div class="h-4 w-24 animate-pulse rounded bg-case-elevated"></div>
        <div v-for="j in 6" :key="j" class="h-10 animate-pulse rounded-lg bg-case-elevated"></div>
      </div>
    </section>

    <section v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div
        v-for="(group, gi) in groups"
        :key="group.id"
        class="bg-case-surface border border-case-border rounded-xl overflow-hidden flex flex-col">
        <header class="bg-primary/90 px-4 py-2.5 flex items-center justify-between">
          <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-black">Crime Areas</p>
          <span class="text-[10px] font-semibold text-black/70">Group {{ gi + 1 }}</span>
        </header>
        <ul class="divide-y divide-case-border">
          <li
            v-for="(area, ai) in group.areas"
            :key="area.key"
            @click="selectArea(area)"
            class="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-case-card transition-colors"
            :class="{ 'bg-case-card': selected?.key === area.key }">
            <div class="flex items-start gap-3 min-w-0">
              <span class="mt-0.5 text-[10px] font-semibold text-gray-600 w-4 flex-shrink-0">{{ ai + 1 }}.</span>
              <div class="min-w-0">
                <p class="text-xs text-gray-200 truncate">{{ area.title }}</p>
              </div>
            </div>
            <span
              class="flex-shrink-0 rounded-full bg-case-elevated px-2 py-0.5 text-[10px] font-semibold"
              :class="countFor(area.key) > 0 ? 'text-primary' : 'text-gray-600'">
              {{ countFor(area.key) }}
            </span>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── Selected area panel ─────────────────────────────────────────── -->
    <section v-if="selected" class="bg-case-surface border border-case-border rounded-xl">
      <header class="flex items-center justify-between border-b border-case-border px-5 py-3">
        <div>
          <p class="text-[10px] uppercase tracking-[0.25em] text-gray-600">Selected crime area</p>
          <h2 class="text-sm font-semibold text-white mt-1">{{ selected.title }}</h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="openCreate"
            class="rounded-md bg-primary/10 border border-primary/40 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5">
            <Icon icon="mdi:plus" /> Add to this area
          </button>
          <button
            @click="selected = null"
            class="text-gray-600 hover:text-gray-300 transition-colors">
            <Icon icon="mdi:close" class="text-lg" />
          </button>
        </div>
      </header>
      <div class="p-5">
        <div v-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">
          {{ error }}
        </div>
        <div v-else-if="selectedEntries.length" class="space-y-2">
          <div
            v-for="entry in selectedEntries"
            :key="entry._id"
            @click="openEdit(entry)"
            class="rounded-lg border border-case-border bg-case-card p-3 flex items-start justify-between gap-3 cursor-pointer hover:bg-case-elevated transition-colors">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm text-gray-200 truncate">{{ entry.title }}</p>
                <Icon v-if="entry.attachments?.length" icon="mdi:paperclip" class="text-primary text-sm flex-shrink-0" />
              </div>
              <p class="text-[11px] text-gray-500 mt-0.5">{{ entry.leadAgency || "—" }} · {{ formatDate(entry.createdAt) }}</p>
            </div>
            <span class="rounded-full bg-case-elevated px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400 flex-shrink-0">
              {{ entry.status || "open" }}
            </span>
          </div>
        </div>
        <div v-else class="py-10 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:database-search-outline" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No entries filed under {{ selected.title }} yet.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";
  import EntryFormModal from "./components/EntryFormModal.vue";

  const CLUSTER_GROUPS = [
    {
      id: "group-1",
      areas: [
        { key: "trafficking-illegal-recruitment", title: "Trafficking-in-Persons / Illegal Recruitment" },
        { key: "cybercrime-online-fraud", title: "Cybercrime / Online Scam / Fraud" },
        { key: "illegal-gambling", title: "Illegal Gambling" },
        { key: "kidnapping-for-ransom", title: "Kidnapping-for-Ransom" },
        { key: "money-laundering", title: "Money Laundering" },
        { key: "tax-evasion", title: "Tax Evasion" },
      ],
    },
    {
      id: "group-2",
      areas: [
        { key: "environmental-crimes", title: "Environmental Crimes" },
        { key: "crimes-against-cultural-properties", title: "Crimes Against Cultural Properties" },
        { key: "smuggling", title: "Smuggling" },
        { key: "ipr-theft", title: "Intellectual Property Rights Theft" },
        { key: "economic-sabotage-food-security", title: "Economic Sabotage / Crimes Related to Food Security" },
        { key: "carnapping", title: "Carnapping" },
      ],
    },
    {
      id: "group-3",
      areas: [
        { key: "terrorism", title: "Terrorism" },
        { key: "drug-trafficking", title: "Drug Trafficking / Illegal Drugs" },
        { key: "gunrunning-private-armed-groups", title: "Gunrunning / Private Armed Groups" },
        { key: "insurgency", title: "Insurgency" },
        { key: "robbery", title: "Robbery" },
        { key: "graft-and-corruption", title: "Graft and Corruption" },
      ],
    },
  ];

  export default {
    name: "CrimeClusters",
    components: { Icon, EntryFormModal },
    data() {
      return {
        groups: CLUSTER_GROUPS,
        entries: [],
        loading: false,
        error: "",
        selected: null,
        showModal: false,
        editingEntry: null,
        searchQuery: "",
        searchDebounce: null,
      };
    },
    computed: {
      allAreas() {
        return CLUSTER_GROUPS.flatMap((g) => g.areas);
      },
      selectedEntries() {
        if (!this.selected) return [];
        return this.entries.filter((e) => e.subCategory === this.selected.key);
      },
    },
    methods: {
      countFor(key) {
        return this.entries.filter((e) => e.subCategory === key).length;
      },
      selectArea(area) {
        this.selected = area;
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
          const url = `/cases/entries/crime-clusters${queryString ? `?${queryString}` : ""}`;
          const res = await API.get(url);
          this.entries = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load crime cluster entries.";
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
        if (entry.subCategory) {
          const area = this.allAreas.find((a) => a.key === entry.subCategory);
          if (area) this.selected = area;
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
