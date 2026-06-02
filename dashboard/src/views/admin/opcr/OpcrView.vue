<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex items-center justify-between">
      <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / OPCR</p>
      <div class="flex items-center gap-2">
        <button type="button" class="rounded-xl bg-blue-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600" :disabled="!record" @click="$router.push(`/admin/opcr/${recordId}/edit`)">EDIT</button>
        <button type="button" class="rounded-xl bg-red-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50" :disabled="!record || isDeleting" @click="deleteRecord">{{ isDeleting ? "Deleting..." : "DELETE" }}</button>
        <button type="button" class="rounded-xl bg-emerald-600/80 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600" @click="$router.push('/admin/opcr')">BACK</button>
      </div>
    </header>

    <h2 class="mb-4 inline-block rounded-md bg-blue-600/20 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">View OPCR</h2>

    <div v-if="errorMessage" class="mb-4 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{{ errorMessage }}</div>

    <div v-if="record" class="space-y-6">
      <!-- Header card -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-6">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-semibold text-white">{{ record.office }}</h1>
          <span :class="statusBadge(record.status)" class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]">{{ record.status }}</span>
        </div>
        <p class="mt-1 text-sm text-gray-400">Rating Period: <span class="text-gray-200">{{ record.ratingPeriod }}</span></p>

        <div class="mt-5 grid gap-3 border-t border-case-border pt-5 sm:grid-cols-3">
          <div><p class="text-xs uppercase tracking-[0.2em] text-gray-500">Period Start</p><p class="mt-1 text-sm text-gray-200 tabular-nums">{{ formatDate(record.periodStart) }}</p></div>
          <div><p class="text-xs uppercase tracking-[0.2em] text-gray-500">Period End</p><p class="mt-1 text-sm text-gray-200 tabular-nums">{{ formatDate(record.periodEnd) }}</p></div>
          <div><p class="text-xs uppercase tracking-[0.2em] text-gray-500">Approved At</p><p class="mt-1 text-sm text-gray-200 tabular-nums">{{ formatDate(record.approvedAt) }}</p></div>
          <div><p class="text-xs uppercase tracking-[0.2em] text-gray-500">Prepared By</p><p class="mt-1 text-sm text-gray-200">{{ record.preparedBy || '—' }}</p></div>
          <div><p class="text-xs uppercase tracking-[0.2em] text-gray-500">Reviewed By</p><p class="mt-1 text-sm text-gray-200">{{ record.reviewedBy || '—' }}</p></div>
          <div><p class="text-xs uppercase tracking-[0.2em] text-gray-500">Approved By</p><p class="mt-1 text-sm text-gray-200">{{ record.approvedBy || '—' }}</p></div>
        </div>

        <div class="mt-5 flex items-center justify-between rounded-xl border border-case-border bg-case-card px-4 py-3">
          <span class="text-xs uppercase tracking-[0.2em] text-gray-500">Overall Office Rating</span>
          <span class="text-xl font-semibold text-primary tabular-nums">{{ record.overallRating ? record.overallRating.toFixed(2) : '—' }}</span>
        </div>
      </div>

      <!-- Targets -->
      <div class="overflow-hidden rounded-2xl border border-case-border bg-case-surface">
        <table class="w-full text-left text-sm">
          <thead class="bg-case-elevated text-xs uppercase tracking-[0.2em] text-gray-500">
            <tr>
              <th class="px-3 py-2 font-medium">#</th>
              <th class="px-3 py-2 font-medium">MFO / Program</th>
              <th class="px-3 py-2 font-medium">Success Indicator</th>
              <th class="px-3 py-2 font-medium">Target</th>
              <th class="px-3 py-2 font-medium">Accomplishment</th>
              <th class="px-3 py-2 font-medium">Q</th>
              <th class="px-3 py-2 font-medium">E</th>
              <th class="px-3 py-2 font-medium">T</th>
              <th class="px-3 py-2 font-medium">Avg</th>
              <th class="px-3 py-2 font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-case-border text-gray-300">
            <tr v-if="!record.targets?.length"><td colspan="10" class="px-4 py-6 text-center text-gray-500">No targets recorded.</td></tr>
            <tr v-for="(t, idx) in record.targets" :key="idx" class="align-top">
              <td class="px-3 py-2 text-gray-500">{{ idx + 1 }}</td>
              <td class="px-3 py-2">{{ t.mfoProgram || '—' }}</td>
              <td class="px-3 py-2">{{ t.successIndicator || '—' }}</td>
              <td class="px-3 py-2 text-gray-400">{{ t.target || '—' }}</td>
              <td class="px-3 py-2 text-gray-400">{{ t.accomplishment || '—' }}</td>
              <td class="px-3 py-2 tabular-nums">{{ t.quality || '—' }}</td>
              <td class="px-3 py-2 tabular-nums">{{ t.efficiency || '—' }}</td>
              <td class="px-3 py-2 tabular-nums">{{ t.timeliness || '—' }}</td>
              <td class="px-3 py-2 font-semibold text-primary tabular-nums">{{ t.averageRating ? t.averageRating.toFixed(2) : '—' }}</td>
              <td class="px-3 py-2 text-gray-400">{{ t.remarks || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="record.attachedFile?.url" class="rounded-2xl border border-case-border bg-case-surface p-5">
        <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Attached OPCR Document</p>
        <a :href="record.attachedFile.url" target="_blank" rel="noopener" class="mt-1 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <Icon icon="mdi:paperclip" class="text-base" />
          {{ record.attachedFile.originalName }}
        </a>
      </div>
    </div>

    <div v-else-if="!errorMessage" class="rounded-2xl border border-case-border bg-case-surface p-10 text-center text-sm text-gray-500">Loading...</div>

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
  import { createConfirmationDialogState, resolveConfirmation } from "@/helper/record-confirmation";

  export default {
    name: "AdminOpcrView",
    components: { Icon, ConfirmationDialog },
    data() {
      return {
        record: null,
        errorMessage: "",
        isDeleting: false,
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    computed: { recordId() { return this.$route.params.id; } },
    methods: {
      formatDate(v) { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10); },
      statusBadge(s) {
        const map = { Draft: "bg-gray-500/15 text-gray-300", Submitted: "bg-amber-500/15 text-amber-300", Approved: "bg-emerald-500/15 text-emerald-300" };
        return map[s] || "bg-gray-500/15 text-gray-300";
      },
      openConfirmationDialog(p) { this.confirmationDialog = { visible: true, ...p }; return new Promise((r) => { this.confirmationResolver = r; }); },
      closeConfirmationDialog(c) { this.confirmationDialog = createConfirmationDialogState(); resolveConfirmation(this.confirmationResolver, c); this.confirmationResolver = null; },
      async loadRecord() {
        this.errorMessage = "";
        try {
          const res = await API.get(`/admin/opcr/${this.recordId}`);
          this.record = res.data?.record || null;
          if (!this.record) this.errorMessage = "OPCR not found.";
        } catch (err) { this.errorMessage = err.response?.data?.message || "Unable to load OPCR."; }
      },
      async deleteRecord() {
        if (!this.record) return;
        const confirmed = await this.openConfirmationDialog({
          title: "Delete OPCR?",
          description: `OPCR for "${this.record.office} — ${this.record.ratingPeriod}" will be permanently removed.`,
          confirmText: "Yes, delete",
        });
        if (!confirmed) return;
        this.isDeleting = true;
        try {
          await API.delete(`/admin/opcr/${this.recordId}`);
          this.$router.push("/admin/opcr");
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to delete OPCR.";
          this.isDeleting = false;
        }
      },
    },
    mounted() { this.loadRecord(); },
  };
</script>
