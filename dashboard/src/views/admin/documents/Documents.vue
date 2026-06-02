<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / Documents Tracking System</p>
      </div>
      <div class="rounded-2xl border border-case-border bg-case-surface px-5 py-3 text-right">
        <p class="text-xs uppercase tracking-[0.25em] text-gray-500">Time &amp; Date</p>
        <p class="mt-1 text-lg font-semibold text-white tabular-nums">{{ clockTime }}</p>
        <p class="text-xs text-gray-500">{{ clockDate }}</p>
      </div>
    </header>

    <div class="mb-8 grid gap-4" :class="canCreate && 'sm:grid-cols-2'">
      <button
        v-if="canCreate"
        type="button"
        class="group flex items-center justify-between rounded-2xl border border-case-border bg-case-surface p-5 text-left transition hover:border-primary/40 hover:bg-case-card"
        @click="$router.push('/admin/documents/new')"
      >
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-primary">Create</p>
          <p class="mt-1 text-lg font-semibold text-white">New Record</p>
          <p class="mt-1 text-xs text-gray-500">Encode a new routing record.</p>
        </div>
        <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon icon="mdi:plus-circle-outline" class="text-2xl" />
        </span>
      </button>

      <div class="rounded-2xl border border-case-border bg-case-surface p-5">
        <p class="text-xs uppercase tracking-[0.25em] text-primary">Search / Update</p>
        <p class="mt-1 text-sm text-gray-500">{{ canCreate ? "Find a record by control number, subject, or encoder." : "Showing only records you are tagged on." }}</p>
        <div class="mt-3 flex items-center rounded-xl border border-case-border bg-case-card px-3 py-2">
          <Icon icon="mdi:magnify" class="text-lg text-gray-500" />
          <input
            v-model="search"
            type="search"
            placeholder="Search records..."
            class="w-full bg-transparent px-2 py-1 text-sm text-gray-200 outline-none placeholder:text-gray-600"
            @input="onSearchInput"
          />
        </div>
      </div>
    </div>

    <section>
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">Latest Records</h2>
        <div class="inline-flex rounded-xl border border-case-border bg-case-surface p-1">
          <button
            v-for="tab in categoryTabs"
            :key="tab.value"
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors"
            :class="activeCategory === tab.value
              ? 'bg-primary/15 text-primary'
              : 'text-gray-500 hover:text-gray-300'"
            @click="setCategory(tab.value)"
          >
            <Icon :icon="tab.icon" class="text-base" />
            {{ tab.label }}
            <span
              class="ml-1 rounded-full px-2 py-0.5 text-[10px] tabular-nums"
              :class="activeCategory === tab.value
                ? 'bg-primary/25 text-primary'
                : 'bg-case-card text-gray-500'"
            >
              {{ counts[tab.value] || 0 }}
            </span>
          </button>
        </div>
        <button
          type="button"
          class="text-xs text-gray-500 hover:text-gray-300"
          @click="loadRecords"
        >
          Refresh
        </button>
      </div>

      <div v-if="errorMessage" class="mb-3 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
        {{ errorMessage }}
      </div>

      <div class="overflow-hidden rounded-2xl border border-case-border bg-case-surface">
        <table class="w-full text-left text-sm">
          <thead class="bg-case-elevated text-xs uppercase tracking-[0.2em] text-gray-500">
            <tr>
              <th class="px-4 py-3 font-medium">Encoder</th>
              <th class="px-4 py-3 font-medium">PAOCC Control No</th>
              <th class="px-4 py-3 font-medium">Category</th>
              <th class="px-4 py-3 font-medium">Subject</th>
              <th class="px-4 py-3 font-medium">From (Latest)</th>
              <th class="px-4 py-3 font-medium">To (Latest)</th>
              <th class="px-4 py-3 font-medium">Sender's Name</th>
              <th class="px-4 py-3 font-medium">Date</th>
              <th class="px-4 py-3 font-medium">File</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-case-border text-gray-300">
            <tr v-if="isLoading">
              <td colspan="10" class="px-4 py-6 text-center text-gray-500">Loading records...</td>
            </tr>
            <tr v-else-if="!records.length">
              <td colspan="10" class="px-4 py-6 text-center text-gray-500">
                No {{ activeCategory }} records yet.
              </td>
            </tr>
            <tr
              v-for="record in records"
              :key="record.id"
              class="hover:bg-case-card transition-colors"
            >
              <td class="px-4 py-3 text-gray-500">{{ record.encoder?.code || record.encoder?.username || '—' }}</td>
              <td class="px-4 py-3 font-medium text-white tabular-nums">{{ record.controlNumber }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                  :class="record.category === 'outgoing'
                    ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'"
                >
                  <Icon
                    :icon="record.category === 'outgoing' ? 'mdi:tray-arrow-up' : 'mdi:tray-arrow-down'"
                    class="text-sm"
                  />
                  {{ record.category === 'outgoing' ? 'Outgoing' : 'Incoming' }}
                </span>
              </td>
              <td class="px-4 py-3">{{ record.subject }}</td>
              <td class="px-4 py-3 text-gray-400">{{ latestLine(record).from || '—' }}</td>
              <td class="px-4 py-3 text-gray-400">{{ latestLine(record).to || '—' }}</td>
              <td class="px-4 py-3 text-gray-400">{{ latestLine(record).senderName || '—' }}</td>
              <td class="px-4 py-3 text-gray-400 tabular-nums">{{ formatDate(latestLine(record).date) }}</td>
              <td class="px-4 py-3">
                <a
                  v-if="record.attachedFile?.url"
                  :href="record.attachedFile.url"
                  target="_blank"
                  rel="noopener"
                  class="text-primary hover:underline"
                >
                  link
                </a>
                <span v-else class="text-gray-600">—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="inline-flex items-center gap-1">
                  <button
                    type="button"
                    class="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
                    @click="$router.push(`/admin/documents/${record.id}`)"
                  >
                    View
                  </button>
                  <button
                    v-if="canCreate"
                    type="button"
                    class="rounded-md bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="deletingId === record.id"
                    @click="confirmDelete(record)"
                  >
                    {{ deletingId === record.id ? "…" : "Delete" }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ConfirmationDialog
      :visible="confirmationDialog.visible"
      :title="confirmationDialog.title"
      :description="confirmationDialog.description"
      :confirm-text="confirmationDialog.confirmText"
      @cancel="closeConfirmationDialog(false)"
      @confirm="closeConfirmationDialog(true)"
    />
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";
  import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
  import { canEditModule } from "@/services/access";
  import {
    createConfirmationDialogState,
    resolveConfirmation,
  } from "@/helper/record-confirmation";

  export default {
    name: "AdminDocuments",
    components: { Icon, ConfirmationDialog },
    computed: {
      canCreate() {
        return canEditModule("admin");
      },
    },
    data() {
      return {
        records: [],
        counts: { incoming: 0, outgoing: 0 },
        activeCategory: "incoming",
        categoryTabs: [
          { value: "incoming", label: "Incoming", icon: "mdi:tray-arrow-down" },
          { value: "outgoing", label: "Outgoing", icon: "mdi:tray-arrow-up" },
        ],
        search: "",
        searchTimer: null,
        isLoading: false,
        errorMessage: "",
        clockTime: "",
        clockDate: "",
        clockTimer: null,
        deletingId: "",
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    methods: {
      openConfirmationDialog({ title, description, confirmText }) {
        this.confirmationDialog = {
          visible: true,
          title,
          description,
          confirmText,
        };
        return new Promise((resolve) => {
          this.confirmationResolver = resolve;
        });
      },
      closeConfirmationDialog(confirmed) {
        this.confirmationDialog = createConfirmationDialogState();
        resolveConfirmation(this.confirmationResolver, confirmed);
        this.confirmationResolver = null;
      },
      async confirmDelete(record) {
        const confirmed = await this.openConfirmationDialog({
          title: "Delete record?",
          description: `Record "${record.controlNumber}" will be permanently removed. This cannot be undone.`,
          confirmText: "Yes, delete",
        });
        if (!confirmed) return;
        this.deletingId = record.id;
        try {
          await API.delete(`/admin/documents/${record.id}`);
          await this.loadRecords();
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to delete record.";
        } finally {
          this.deletingId = "";
        }
      },
      async loadRecords() {
        this.isLoading = true;
        this.errorMessage = "";
        try {
          const params = new URLSearchParams();
          const q = this.search.trim();
          if (q) params.set("q", q);
          if (this.activeCategory) params.set("category", this.activeCategory);
          const qs = params.toString();
          const path = qs ? `/admin/documents?${qs}` : "/admin/documents";
          const res = await API.get(path);
          this.records = Array.isArray(res.data?.records) ? res.data.records : [];
          this.counts = {
            incoming: Number(res.data?.counts?.incoming) || 0,
            outgoing: Number(res.data?.counts?.outgoing) || 0,
          };
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to load records.";
        } finally {
          this.isLoading = false;
        }
      },
      setCategory(value) {
        if (this.activeCategory === value) return;
        this.activeCategory = value;
        this.loadRecords();
      },
      onSearchInput() {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.loadRecords(), 300);
      },
      latestLine(record) {
        const lines = record.lines || [];
        return lines[lines.length - 1] || {};
      },
      formatDate(value) {
        if (!value) return "—";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toISOString().slice(0, 10);
      },
      tickClock() {
        const now = new Date();
        this.clockTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        this.clockDate = now.toLocaleDateString([], { weekday: "short", year: "numeric", month: "short", day: "numeric" });
      },
    },
    mounted() {
      this.tickClock();
      this.clockTimer = setInterval(this.tickClock, 1000);
      this.loadRecords();
    },
    beforeUnmount() {
      clearInterval(this.clockTimer);
      clearTimeout(this.searchTimer);
    },
  };
</script>
