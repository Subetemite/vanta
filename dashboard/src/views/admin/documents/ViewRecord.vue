<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex items-center justify-between">
      <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / Documents Tracking System</p>
      <div class="flex items-center gap-2">
        <button
          v-if="canEdit"
          type="button"
          class="rounded-xl bg-blue-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
          :disabled="!record"
          @click="editRecord"
        >
          EDIT
        </button>
        <button
          v-if="canDelete"
          type="button"
          class="rounded-xl bg-red-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!record || isDeleting"
          @click="deleteRecord"
        >
          {{ isDeleting ? "Deleting..." : "DELETE" }}
        </button>
        <button
          type="button"
          class="rounded-xl bg-emerald-600/80 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          @click="$router.push('/admin/documents')"
        >
          BACK
        </button>
      </div>
    </header>

    <h2 class="mb-4 inline-block rounded-md bg-blue-600/20 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
      View Routing Slip
    </h2>

    <div v-if="errorMessage" class="mb-4 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
      {{ errorMessage }}
    </div>

    <div v-if="record" class="space-y-5">
      <!-- Title bar: ROUTING SLIP + PAOCC Control No. -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.4em] text-primary">Routing Slip</p>
            <div class="mt-1 flex flex-wrap items-center gap-3">
              <h3 class="text-lg font-semibold text-white">Document Routing</h3>
              <span
                class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
                :class="categoryBadgeClass"
              >
                <Icon :icon="categoryIcon" class="text-sm" />
                {{ categoryLabel }}
              </span>
            </div>
            <p v-if="record.encoder?.code || record.encoder?.username" class="mt-1 text-[11px] text-gray-500">
              Encoded by <span class="text-gray-300">{{ record.encoder?.code || record.encoder?.username }}</span>
            </p>
          </div>
          <div class="sm:w-1/2">
            <p class="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-gray-500">PAOCC Control No</p>
            <p class="rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm font-semibold text-white tabular-nums">
              {{ record.controlNumber }}
            </p>
          </div>
        </div>
        <div class="mt-4">
          <p class="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Subject</p>
          <p class="rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-white">
            {{ record.subject }}
          </p>
        </div>
      </div>

      <!-- Routing rows + action panel -->
      <div class="grid gap-5 lg:grid-cols-[2fr,1fr]">
        <!-- Routing table -->
        <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">Routing Lines</h3>
            <p class="text-[10px] text-gray-500">Click a row to view its action.</p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[640px] table-fixed text-left text-sm">
              <thead>
                <tr class="border-b border-case-border text-[10px] uppercase tracking-[0.18em] text-gray-500">
                  <th class="w-8 px-2 py-2 font-medium"></th>
                  <th class="px-2 py-2 font-medium">From</th>
                  <th class="px-2 py-2 font-medium">To</th>
                  <th class="w-28 px-2 py-2 text-center font-medium">Action</th>
                  <th class="w-32 px-2 py-2 font-medium">Date</th>
                  <th class="px-2 py-2 font-medium">Sender's Name</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(line, idx) in displayLines"
                  :key="idx"
                  class="border-b border-case-border/60 cursor-pointer transition-colors"
                  :class="focusedIdx === idx ? 'bg-primary/5' : 'hover:bg-case-card'"
                  @click="focusRow(idx)"
                >
                  <td class="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide"
                      :class="focusedIdx === idx ? 'text-primary' : 'text-gray-600'">
                    {{ idx + 1 }}
                  </td>
                  <td class="px-2 py-2 text-xs text-gray-300">{{ line.from || '—' }}</td>
                  <td class="px-2 py-2 text-xs text-gray-300">{{ line.to || '—' }}</td>
                  <td class="px-2 py-2 text-center">
                    <span
                      class="inline-flex min-h-7 min-w-7 items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-tight tabular-nums"
                      :class="lineActions(line).length
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-case-border bg-case-card text-gray-600'"
                    >
                      {{ actionCodes(line.actionRequested) || '—' }}
                    </span>
                  </td>
                  <td class="px-2 py-2 text-xs text-gray-400 tabular-nums">{{ formatDate(line.date) }}</td>
                  <td class="px-2 py-2 text-xs text-gray-300">{{ line.senderName || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Action Requested checkbox panel (read-only, multi-select) -->
        <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">Action Requested</h3>
            <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Row {{ focusedIdx + 1 }} · {{ focusedActions.length }} selected
            </span>
          </div>
          <div class="space-y-1.5">
            <label
              v-for="opt in actionOptions"
              :key="opt"
              class="flex cursor-default items-center gap-2.5 rounded-md border border-transparent px-2.5 py-1.5 text-xs"
              :class="focusedActions.includes(opt) ? 'border-primary/40 bg-primary/5' : ''"
            >
              <input
                type="checkbox"
                :value="opt"
                :checked="focusedActions.includes(opt)"
                disabled
                class="h-3.5 w-3.5 accent-primary"
              />
              <span :class="focusedActions.includes(opt) ? 'text-primary' : 'text-gray-400'">{{ opt }}</span>
            </label>
          </div>
          <p v-if="!focusedActions.length" class="mt-3 text-[11px] text-gray-600">No action set on this row.</p>
        </div>
      </div>

      <!-- Additional Remarks (comments thread) -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-gray-300">Additional Remarks</p>
          <span class="text-[11px] text-gray-500">
            {{ comments.length }} comment<span v-if="comments.length !== 1">s</span>
          </span>
        </div>

        <div v-if="comments.length" class="space-y-2">
          <div
            v-for="(c, i) in comments"
            :key="i"
            class="rounded-xl border border-case-border bg-case-card px-3 py-2"
          >
            <div class="flex items-center justify-between gap-2 text-[11px]">
              <span class="font-semibold text-primary">{{ c.author || "Unknown" }}</span>
              <span class="text-gray-600 tabular-nums">{{ formatTimestamp(c.createdAt) }}</span>
            </div>
            <p class="mt-1 whitespace-pre-line text-sm text-gray-200">{{ c.text }}</p>
          </div>
        </div>
        <p v-else class="rounded-xl border border-dashed border-case-border px-3 py-4 text-center text-xs text-gray-600">
          No remarks have been added yet.
        </p>

        <div v-if="canEdit" class="mt-4 border-t border-case-border pt-4">
          <label class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-500">
            Add a comment
          </label>
          <textarea
            v-model="newComment"
            rows="3"
            class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
            :placeholder="`Posting as ${currentAuthorName}.`"
          ></textarea>
          <div v-if="commentError" class="mt-2 text-xs text-red-400">{{ commentError }}</div>
          <div class="mt-2 flex justify-end">
            <button
              type="button"
              class="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!newComment.trim() || isPostingComment"
              @click="postComment"
            >
              {{ isPostingComment ? "Posting..." : "Post comment" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Attached file -->
      <div v-if="record.attachedFile?.url" class="rounded-2xl border border-case-border bg-case-surface p-5">
        <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Attached File</p>
        <a
          :href="record.attachedFile.url"
          target="_blank"
          rel="noopener"
          class="mt-1 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Icon icon="mdi:paperclip" class="text-base" />
          {{ record.attachedFile.originalName }}
        </a>
      </div>
    </div>

    <div v-else-if="!errorMessage" class="rounded-2xl border border-case-border bg-case-surface p-10 text-center text-sm text-gray-500">
      Loading record...
    </div>

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

  const ACTION_OPTIONS = [
    "01 – Approval",
    "02 – Signature",
    "03 – Appropriate Action",
    "04 – Comment/Recommendation",
    "05 – For Study",
    "06 – Reply Direct to Writer",
    "07 – Retype/Redraft",
    "08 – Attn to HWI",
    "09 – Pls see me",
    "10 – Calendar/Remind me",
    "11 – Dispatch",
    "12 – Dissemination",
    "13 – Notation/Information",
    "14 – File",
  ];

  const MAX_LINES = 5;

  function emptyLine() {
    return { from: "", to: "", actionRequested: [], date: null, senderName: "" };
  }

  function normalizeActions(value) {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return ACTION_OPTIONS.filter((opt) => list.includes(opt));
  }

  export default {
    name: "AdminDocumentsView",
    components: { Icon, ConfirmationDialog },
    data() {
      return {
        record: null,
        errorMessage: "",
        isDeleting: false,
        focusedIdx: 0,
        actionOptions: ACTION_OPTIONS,
        newComment: "",
        commentError: "",
        isPostingComment: false,
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    computed: {
      displayLines() {
        const lines = Array.isArray(this.record?.lines) ? this.record.lines.slice(0, MAX_LINES) : [];
        const padded = Array.from({ length: MAX_LINES }, () => emptyLine());
        lines.forEach((l, i) => { padded[i] = l; });
        return padded;
      },
      focusedActions() {
        return normalizeActions(this.displayLines[this.focusedIdx]?.actionRequested);
      },
      comments() {
        return Array.isArray(this.record?.comments) ? this.record.comments : [];
      },
      currentEmployeeId() {
        try {
          return JSON.parse(localStorage.getItem("auth_user") || "null")?.employee?.employeeId || "";
        } catch {
          return "";
        }
      },
      categoryLabel() {
        return this.record?.category === "outgoing" ? "Outgoing" : "Incoming";
      },
      categoryIcon() {
        return this.record?.category === "outgoing" ? "mdi:tray-arrow-up" : "mdi:tray-arrow-down";
      },
      categoryBadgeClass() {
        return this.record?.category === "outgoing"
          ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
      },
      isTaggedHere() {
        const empId = this.currentEmployeeId;
        if (!empId || !this.record?.lines) return false;
        return this.record.lines.some(
          (l) => l.toEmployeeId === empId || l.fromEmployeeId === empId
        );
      },
      canEdit() {
        return canEditModule("admin") || this.isTaggedHere;
      },
      canDelete() {
        return canEditModule("admin");
      },
      currentAuthorName() {
        try {
          const u = JSON.parse(localStorage.getItem("auth_user") || "null");
          if (!u) return "current user";
          const parts = [u.employee?.firstName, u.employee?.lastName].filter(Boolean).join(" ").trim();
          return parts || u.username || u.email || "current user";
        } catch {
          return "current user";
        }
      },
    },
    methods: {
      actionCodes(value) {
        return normalizeActions(value)
          .map((v) => {
            const match = String(v).match(/^(\d{2})/);
            return match ? match[1] : "";
          })
          .filter(Boolean)
          .join(", ");
      },
      lineActions(line) {
        return normalizeActions(line?.actionRequested);
      },
      focusRow(idx) {
        if (idx < 0 || idx >= MAX_LINES) return;
        this.focusedIdx = idx;
      },
      openConfirmationDialog({ title, description, confirmText }) {
        this.confirmationDialog = { visible: true, title, description, confirmText };
        return new Promise((resolve) => {
          this.confirmationResolver = resolve;
        });
      },
      closeConfirmationDialog(confirmed) {
        this.confirmationDialog = createConfirmationDialogState();
        resolveConfirmation(this.confirmationResolver, confirmed);
        this.confirmationResolver = null;
      },
      async loadRecord() {
        this.errorMessage = "";
        try {
          const res = await API.get(`/admin/documents/${this.$route.params.id}`);
          this.record = res.data?.record || null;
          if (!this.record) this.errorMessage = "Record not found.";
          this.focusedIdx = 0;
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to load record.";
        }
      },
      editRecord() {
        this.$router.push(`/admin/documents/${this.$route.params.id}/edit`);
      },
      async deleteRecord() {
        if (!this.record) return;
        const confirmed = await this.openConfirmationDialog({
          title: "Delete record?",
          description: `Record "${this.record.controlNumber}" will be permanently removed. This cannot be undone.`,
          confirmText: "Yes, delete",
        });
        if (!confirmed) return;
        this.isDeleting = true;
        try {
          await API.delete(`/admin/documents/${this.$route.params.id}`);
          this.$router.push("/admin/documents");
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to delete record.";
          this.isDeleting = false;
        }
      },
      formatDate(value) {
        if (!value) return "—";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toISOString().slice(0, 10);
      },
      formatTimestamp(value) {
        if (!value) return "";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
      },
      async postComment() {
        const text = this.newComment.trim();
        if (!text || this.isPostingComment) return;
        this.isPostingComment = true;
        this.commentError = "";
        try {
          const res = await API.post(`/admin/documents/${this.$route.params.id}/comments`, { text });
          this.record = res.data?.record || this.record;
          this.newComment = "";
        } catch (err) {
          this.commentError = err.response?.data?.message || "Unable to add comment.";
        } finally {
          this.isPostingComment = false;
        }
      },
    },
    mounted() {
      this.loadRecord();
    },
  };
</script>
