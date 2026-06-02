<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex items-center justify-between">
      <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / Documents Tracking System</p>
      <button
        type="button"
        class="rounded-xl border border-case-border bg-case-surface px-4 py-2 text-sm text-gray-300 hover:bg-case-card"
        @click="$router.push('/admin/documents')"
      >
        Back
      </button>
    </header>

    <h2 class="mb-4 inline-block rounded-md bg-primary/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.25em] text-primary">
      {{ isEditing ? "Edit Routing Slip" : "New Routing Slip" }}
    </h2>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <!-- Title bar: ROUTING SLIP + PAOCC Control No. -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.4em] text-primary">Routing Slip</p>
            <h3 class="mt-1 text-lg font-semibold text-white">Document Routing</h3>
          </div>
          <div class="sm:w-1/2">
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
              PAOCC Control No <span class="text-primary">*</span>
            </label>
            <input
              v-model.trim="form.controlNumber"
              type="text"
              required
              class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
              placeholder="e.g. 20260427-0001"
            />
          </div>
        </div>

        <div class="mt-4">
          <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
            Document Category <span class="text-primary">*</span>
          </label>
          <div class="inline-flex rounded-xl border border-case-border bg-case-card p-1">
            <button
              v-for="opt in categoryOptions"
              :key="opt.value"
              type="button"
              class="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
              :class="form.category === opt.value
                ? 'bg-primary/15 text-primary'
                : 'text-gray-500 hover:text-gray-300'"
              @click="form.category = opt.value"
            >
              <Icon :icon="opt.icon" class="text-base" />
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="mt-4">
          <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
            Subject <span class="text-primary">*</span>
          </label>
          <input
            v-model.trim="form.subject"
            type="text"
            required
            class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
            placeholder="e.g. TWG MEETING"
          />
        </div>
      </div>

      <!-- Routing rows + action panel -->
      <div class="grid gap-5 lg:grid-cols-[2fr,1fr]">
        <!-- Routing table (5 rows) -->
        <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">Routing Lines</h3>
            <p class="text-[10px] text-gray-500">Pick employees from the dropdown or type freely.</p>
          </div>

          <div class="overflow-x-visible">
            <table class="w-full min-w-[680px] table-fixed text-left text-sm">
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
                  v-for="(line, idx) in form.lines"
                  :key="idx"
                  class="border-b border-case-border/60 transition-colors"
                  :class="focusedIdx === idx ? 'bg-primary/5' : 'hover:bg-case-card'"
                  @click="focusRow(idx)"
                >
                  <td class="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide"
                      :class="focusedIdx === idx ? 'text-primary' : 'text-gray-600'">
                    {{ idx + 1 }}
                  </td>
                  <td class="px-2 py-1.5 align-top">
                    <EmployeeCombobox
                      :model-value="line.from"
                      :employee-id="line.fromEmployeeId"
                      :options="employeeOptions"
                      @focus="focusRow(idx)"
                      @update:model-value="(v) => onFromValue(idx, v)"
                      @update:employee-id="(v) => (line.fromEmployeeId = v)"
                    />
                  </td>
                  <td class="px-2 py-1.5 align-top">
                    <EmployeeCombobox
                      :model-value="line.to"
                      :employee-id="line.toEmployeeId"
                      :options="employeeOptions"
                      @focus="focusRow(idx)"
                      @update:model-value="(v) => onToValue(idx, v)"
                      @update:employee-id="(v) => (line.toEmployeeId = v)"
                    />
                  </td>
                  <td class="px-2 py-1.5 text-center">
                    <span
                      class="inline-flex min-h-7 min-w-7 items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-tight tabular-nums"
                      :class="line.actionRequested.length
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-case-border bg-case-card text-gray-600'"
                    >
                      {{ actionCodes(line.actionRequested) || '—' }}
                    </span>
                  </td>
                  <td class="px-2 py-1.5">
                    <input
                      v-model="line.date"
                      @focus="focusRow(idx)"
                      type="date"
                      class="w-full rounded-md border border-case-border bg-case-card px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-primary"
                    />
                  </td>
                  <td class="px-2 py-1.5">
                    <input
                      v-model.trim="line.senderName"
                      @focus="focusRow(idx)"
                      @input="onSenderInput(idx)"
                      type="text"
                      placeholder="Defaults to From"
                      class="w-full rounded-md border border-case-border bg-case-card px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-primary"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="employeeOptions.length === 0" class="mt-3 text-[11px] text-gray-600">
            No employee directory loaded — From/To accept free text only.
          </p>
        </div>

        <!-- Action Requested checkbox panel (multi-select) -->
        <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">Action Requested</h3>
            <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Row {{ focusedIdx + 1 }} · {{ form.lines[focusedIdx].actionRequested.length }} selected
            </span>
          </div>
          <p class="mb-2 text-[10px] text-gray-500">Tick all actions that apply to this routing line.</p>
          <div class="space-y-1.5">
            <label
              v-for="opt in actionOptions"
              :key="opt"
              class="flex cursor-pointer items-center gap-2.5 rounded-md border border-transparent px-2.5 py-1.5 text-xs transition-colors hover:border-case-border hover:bg-case-card"
              :class="form.lines[focusedIdx].actionRequested.includes(opt) ? 'border-primary/40 bg-primary/5' : ''"
            >
              <input
                type="checkbox"
                :value="opt"
                v-model="form.lines[focusedIdx].actionRequested"
                class="h-3.5 w-3.5 accent-primary"
              />
              <span class="text-gray-300">{{ opt }}</span>
            </label>
          </div>
          <button
            type="button"
            class="mt-3 w-full rounded-md border border-case-border bg-case-card px-3 py-1.5 text-[11px] text-gray-400 transition-colors hover:bg-case-elevated hover:text-gray-200"
            @click="form.lines[focusedIdx].actionRequested = []"
          >
            Clear selection
          </button>
        </div>
      </div>

      <!-- Additional Remarks: comments thread -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-gray-300">Additional Remarks</p>
          <span class="text-[11px] text-gray-500">{{ existingComments.length }} comment<span v-if="existingComments.length !== 1">s</span></span>
        </div>

        <div v-if="existingComments.length" class="mb-4 space-y-2">
          <div
            v-for="(c, i) in existingComments"
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

        <label class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-500">
          {{ existingComments.length ? "Add a new comment" : "Comment" }}
        </label>
        <textarea
          v-model="form.newComment"
          rows="4"
          class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
          :placeholder="`Will be posted as ${currentAuthorName}.`"
        ></textarea>
        <p class="mt-1 text-[11px] text-gray-600">Leave blank if no new remark.</p>
      </div>

      <!-- Attached file -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <label class="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
          Attached File
        </label>
        <div class="flex items-center gap-3">
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            @change="handleFileSelect"
          />
          <button
            type="button"
            class="rounded-xl border border-case-border bg-case-card px-4 py-2 text-sm text-gray-300 hover:bg-case-elevated"
            @click="$refs.fileInput.click()"
          >
            {{ uploadedFile ? 'Replace file' : 'Choose file' }}
          </button>
          <p v-if="uploadedFile" class="truncate text-xs text-gray-400">
            {{ uploadedFile.originalName }} ({{ formatBytes(uploadedFile.size) }})
          </p>
          <p v-else class="text-xs text-gray-600">No file chosen.</p>
        </div>
        <p v-if="isUploading" class="mt-2 text-xs text-primary">Uploading...</p>
        <p v-if="uploadError" class="mt-2 text-xs text-red-400">{{ uploadError }}</p>
      </div>

      <div v-if="errorMessage" class="rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
        {{ errorMessage }}
      </div>

      <div class="flex justify-end">
        <button
          type="submit"
          class="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isSubmitting || isUploading"
        >
          {{ isSubmitting ? "Submitting..." : (isEditing ? "SAVE" : "SUBMIT") }}
        </button>
      </div>
    </form>

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
  import EmployeeCombobox from "@/components/EmployeeCombobox.vue";
  import {
    createConfirmationDialogState,
    resolveConfirmation,
  } from "@/helper/record-confirmation";

  const CATEGORY_OPTIONS = [
    { value: "incoming", label: "Incoming", icon: "mdi:tray-arrow-down" },
    { value: "outgoing", label: "Outgoing", icon: "mdi:tray-arrow-up" },
  ];
  const VALID_CATEGORIES = CATEGORY_OPTIONS.map((c) => c.value);

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
    return {
      from: "",
      fromEmployeeId: "",
      to: "",
      toEmployeeId: "",
      actionRequested: [],
      date: "",
      senderName: "",
      senderManuallyEdited: false,
    };
  }

  function normalizeActions(value) {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return ACTION_OPTIONS.filter((opt) => list.includes(opt));
  }

  function emptyLines() {
    return Array.from({ length: MAX_LINES }, () => emptyLine());
  }

  function isLineFilled(line) {
    return Boolean(
      (line.from || "").trim() ||
      (line.to || "").trim() ||
      (line.date || "").trim() ||
      (line.senderName || "").trim() ||
      (Array.isArray(line.actionRequested) && line.actionRequested.length)
    );
  }

  export default {
    name: "AdminDocumentsNew",
    components: { ConfirmationDialog, EmployeeCombobox, Icon },
    data() {
      return {
        form: {
          controlNumber: "",
          category: "incoming",
          subject: "",
          lines: emptyLines(),
          newComment: "",
        },
        existingComments: [],
        actionOptions: ACTION_OPTIONS,
        categoryOptions: CATEGORY_OPTIONS,
        focusedIdx: 0,
        employeeOptions: [],
        uploadedFile: null,
        isUploading: false,
        uploadError: "",
        isSubmitting: false,
        errorMessage: "",
        isLoading: false,
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    computed: {
      recordId() {
        return this.$route.params.id || null;
      },
      isEditing() {
        return Boolean(this.recordId);
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
        const list = Array.isArray(value) ? value : value ? [value] : [];
        return list
          .map((v) => {
            const match = String(v).match(/^(\d{2})/);
            return match ? match[1] : "";
          })
          .filter(Boolean)
          .join(", ");
      },
      focusRow(idx) {
        if (idx < 0 || idx >= this.form.lines.length) return;
        this.focusedIdx = idx;
      },
      onFromValue(idx, value) {
        const line = this.form.lines[idx];
        line.from = value;
        if (!line.senderManuallyEdited) {
          line.senderName = value;
        }
      },
      onToValue(idx, value) {
        this.form.lines[idx].to = value;
      },
      onSenderInput(idx) {
        this.form.lines[idx].senderManuallyEdited = true;
      },
      formatTimestamp(value) {
        if (!value) return "";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
      },
      async loadEmployees() {
        try {
          const res = await API.get("/admin/hris/employees");
          const list = Array.isArray(res.data?.employees) ? res.data.employees : [];
          this.employeeOptions = list.map((e) => ({
            id: e.id,
            employeeId: e.employeeId || "",
            label: e.employeeId
              ? `${e.fullName} (${e.employeeId})`
              : e.fullName,
            position: e.position || "",
          }));
        } catch {
          this.employeeOptions = [];
        }
      },
      async loadRecord() {
        if (!this.isEditing) return;
        this.isLoading = true;
        this.errorMessage = "";
        try {
          const res = await API.get(`/admin/documents/${this.recordId}`);
          const r = res.data?.record;
          if (!r) {
            this.errorMessage = "Record not found.";
            return;
          }
          this.form.controlNumber = r.controlNumber || "";
          this.form.category = VALID_CATEGORIES.includes(r.category) ? r.category : "incoming";
          this.form.subject = r.subject || "";
          this.existingComments = Array.isArray(r.comments) ? r.comments : [];
          const loaded = (r.lines || []).map((l) => ({
            from: l.from || "",
            fromEmployeeId: l.fromEmployeeId || "",
            to: l.to || "",
            toEmployeeId: l.toEmployeeId || "",
            actionRequested: normalizeActions(l.actionRequested),
            date: l.date ? String(l.date).slice(0, 10) : "",
            senderName: l.senderName || "",
            senderManuallyEdited: Boolean(l.senderName && l.senderName !== l.from),
          }));
          const padded = emptyLines();
          loaded.slice(0, MAX_LINES).forEach((line, i) => { padded[i] = line; });
          this.form.lines = padded;
          this.focusedIdx = 0;
          if (r.attachedFile?.id) {
            this.uploadedFile = {
              id: r.attachedFile.id,
              originalName: r.attachedFile.originalName || "",
              url: r.attachedFile.url || "",
              mimeType: r.attachedFile.mimeType || "",
              size: Number(r.attachedFile.size) || 0,
            };
          }
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to load record.";
        } finally {
          this.isLoading = false;
        }
      },
      formatBytes(bytes) {
        if (!bytes) return "0 B";
        const units = ["B", "KB", "MB", "GB"];
        let i = 0;
        let n = bytes;
        while (n >= 1024 && i < units.length - 1) {
          n /= 1024;
          i++;
        }
        return `${n.toFixed(1)} ${units[i]}`;
      },
      async handleFileSelect(event) {
        const [file] = event.target.files || [];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
          this.uploadError = "Please choose a file 5 MB or smaller.";
          event.target.value = "";
          return;
        }

        this.uploadError = "";
        this.isUploading = true;

        try {
          const base64 = await this.fileToBase64(file);
          const res = await API.post("/files", {
            fileName: file.name,
            mimeType: file.type,
            contentBase64: base64,
          });
          const f = res.data?.file;
          if (!f?.id) throw new Error("Upload returned no file id.");
          this.uploadedFile = {
            id: f.id,
            originalName: f.originalName,
            url: f.url,
            mimeType: f.mimeType,
            size: f.size,
          };
        } catch (err) {
          this.uploadError = err.response?.data?.message || err.message || "Upload failed.";
        } finally {
          this.isUploading = false;
          event.target.value = "";
        }
      },
      fileToBase64(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
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
      async handleSubmit() {
        this.errorMessage = "";

        const filledLines = this.form.lines.filter(isLineFilled);
        if (!filledLines.length) {
          this.errorMessage = "At least one routing line is required.";
          return;
        }

        for (const [i, line] of filledLines.entries()) {
          if (!line.from || !line.to || !line.date || !line.senderName) {
            this.errorMessage = `Line ${i + 1}: From, To, Date, and Sender's Name are required.`;
            return;
          }
          if (!line.actionRequested.length) {
            this.errorMessage = `Line ${i + 1}: Tick at least one Action Requested in the panel.`;
            return;
          }
        }

        const controlNo = this.form.controlNumber || "(no control no.)";
        const confirmed = await this.openConfirmationDialog(
          this.isEditing
            ? {
                title: "Update record?",
                description: `This will apply your changes to record "${controlNo}".`,
                confirmText: "Yes, update",
              }
            : {
                title: "Save new record?",
                description: `This will save "${controlNo}" as a new routing record.`,
                confirmText: "Yes, save",
              }
        );
        if (!confirmed) return;

        this.isSubmitting = true;

        const payload = {
          controlNumber: this.form.controlNumber,
          category: VALID_CATEGORIES.includes(this.form.category) ? this.form.category : "incoming",
          subject: this.form.subject,
          comment: (this.form.newComment || "").trim() || undefined,
          lines: filledLines.map((line) => ({
            from: line.from,
            fromEmployeeId: line.fromEmployeeId,
            to: line.to,
            toEmployeeId: line.toEmployeeId,
            actionRequested: normalizeActions(line.actionRequested),
            date: line.date,
            senderName: line.senderName,
          })),
          attachedFile: this.uploadedFile,
        };

        try {
          if (this.isEditing) {
            await API.put(`/admin/documents/${this.recordId}`, payload);
            this.$router.push(`/admin/documents/${this.recordId}`);
          } else {
            await API.post("/admin/documents", payload);
            this.$router.push("/admin/documents");
          }
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to save the record.";
        } finally {
          this.isSubmitting = false;
        }
      },
    },
    mounted() {
      this.loadEmployees();
      this.loadRecord();
    },
  };
</script>
