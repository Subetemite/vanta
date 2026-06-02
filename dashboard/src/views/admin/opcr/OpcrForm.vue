<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex items-center justify-between">
      <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / OPCR</p>
      <button type="button" class="rounded-xl border border-case-border bg-case-surface px-4 py-2 text-sm text-gray-300 hover:bg-case-card" @click="cancelBack">Back</button>
    </header>

    <h2 class="mb-4 inline-block rounded-md bg-primary/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.25em] text-primary">
      {{ isEditing ? "Edit OPCR" : "New OPCR" }}
    </h2>

    <form class="space-y-6" @submit.prevent="submit">
      <!-- Header section -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">Office &amp; Period</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Office <span class="text-primary">*</span></label>
            <input v-model="form.office" type="text" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" placeholder="e.g. Records Section" />
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Rating Period <span class="text-primary">*</span></label>
            <input v-model="form.ratingPeriod" type="text" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" placeholder="e.g. January-June 2026" />
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Period Start</label>
            <input v-model="form.periodStart" type="date" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Period End</label>
            <input v-model="form.periodEnd" type="date" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Status</label>
            <select v-model="form.status" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary">
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>
        <div class="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Prepared By</label>
            <input v-model="form.preparedBy" type="text" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Reviewed By</label>
            <input v-model="form.reviewedBy" type="text" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Approved By</label>
            <input v-model="form.approvedBy" type="text" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      <!-- Targets section -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <header class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">Targets &amp; Accomplishments</h3>
          <button type="button" class="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20" @click="addTarget">+ Add Row</button>
        </header>

        <div v-for="(t, idx) in form.targets" :key="idx" class="mb-4 rounded-xl border border-case-border bg-case-card p-4">
          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Row {{ idx + 1 }}</span>
            <span class="text-xs text-gray-500">Avg: <span class="font-semibold text-primary tabular-nums">{{ rowAverage(t).toFixed(2) }}</span></span>
            <button type="button" class="text-xs text-red-400 hover:underline" @click="removeTarget(idx)">Remove</button>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">MFO / Program</label><input v-model="t.mfoProgram" type="text" class="w-full rounded-xl border border-case-border bg-case-bg px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Success Indicator</label><input v-model="t.successIndicator" type="text" class="w-full rounded-xl border border-case-border bg-case-bg px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
          </div>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Target</label><textarea v-model="t.target" rows="2" class="w-full rounded-xl border border-case-border bg-case-bg px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"></textarea></div>
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Accomplishment</label><textarea v-model="t.accomplishment" rows="2" class="w-full rounded-xl border border-case-border bg-case-bg px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"></textarea></div>
          </div>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Quality (0-5)</label>
              <input v-model.number="t.quality" type="number" min="0" max="5" step="0.5" class="w-full rounded-xl border border-case-border bg-case-bg px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Efficiency (0-5)</label>
              <input v-model.number="t.efficiency" type="number" min="0" max="5" step="0.5" class="w-full rounded-xl border border-case-border bg-case-bg px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Timeliness (0-5)</label>
              <input v-model.number="t.timeliness" type="number" min="0" max="5" step="0.5" class="w-full rounded-xl border border-case-border bg-case-bg px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
            </div>
          </div>
          <div class="mt-3">
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Remarks</label>
            <input v-model="t.remarks" type="text" class="w-full rounded-xl border border-case-border bg-case-bg px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
        </div>

        <p v-if="!form.targets.length" class="rounded-xl border border-dashed border-case-border px-4 py-6 text-center text-xs text-gray-600">
          No target rows added yet. Click "+ Add Row" to start.
        </p>

        <div v-if="form.targets.length" class="mt-4 flex items-center justify-between rounded-xl border border-case-border bg-case-card px-4 py-3">
          <span class="text-xs uppercase tracking-[0.2em] text-gray-500">Overall Office Rating</span>
          <span class="text-lg font-semibold text-primary tabular-nums">{{ overallRating.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Attached file -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <label class="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Attached OPCR Document</label>
        <div class="flex items-center gap-3">
          <input ref="fileInput" type="file" class="hidden" @change="handleFileSelect" />
          <button type="button" class="rounded-xl border border-case-border bg-case-card px-3 py-1.5 text-xs text-gray-300 hover:bg-case-elevated" @click="$refs.fileInput.click()">{{ uploadedFile ? 'Replace file' : 'Choose file' }}</button>
          <p v-if="uploadedFile" class="truncate text-xs text-gray-400">{{ uploadedFile.originalName }}</p>
          <p v-else class="text-xs text-gray-600">No file chosen.</p>
        </div>
        <p v-if="isUploading" class="mt-2 text-xs text-primary">Uploading...</p>
        <p v-if="uploadError" class="mt-2 text-xs text-red-400">{{ uploadError }}</p>
      </div>

      <div v-if="errorMessage" class="rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{{ errorMessage }}</div>

      <div class="flex justify-end">
        <button type="submit" class="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50" :disabled="isSubmitting || isUploading">
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
  import API from "@/services/api";
  import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
  import { createConfirmationDialogState, resolveConfirmation } from "@/helper/record-confirmation";

  function emptyTarget() {
    return { mfoProgram: "", successIndicator: "", target: "", accomplishment: "", quality: 0, efficiency: 0, timeliness: 0, remarks: "" };
  }

  function emptyForm() {
    return {
      office: "",
      ratingPeriod: "",
      periodStart: "",
      periodEnd: "",
      status: "Draft",
      preparedBy: "",
      reviewedBy: "",
      approvedBy: "",
      targets: [],
    };
  }

  export default {
    name: "AdminOpcrForm",
    components: { ConfirmationDialog },
    data() {
      return {
        form: emptyForm(),
        statusOptions: ["Draft", "Submitted", "Approved"],
        uploadedFile: null,
        isUploading: false,
        uploadError: "",
        isSubmitting: false,
        errorMessage: "",
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    computed: {
      recordId() { return this.$route.params.id || null; },
      isEditing() { return Boolean(this.recordId); },
      overallRating() {
        const rated = this.form.targets.map((t) => this.rowAverage(t)).filter((r) => r > 0);
        if (!rated.length) return 0;
        return rated.reduce((a, b) => a + b, 0) / rated.length;
      },
    },
    methods: {
      rowAverage(t) {
        const ratings = [Number(t.quality) || 0, Number(t.efficiency) || 0, Number(t.timeliness) || 0].filter((r) => r > 0);
        if (!ratings.length) return 0;
        return ratings.reduce((a, b) => a + b, 0) / ratings.length;
      },
      addTarget() { this.form.targets.push(emptyTarget()); },
      removeTarget(idx) { this.form.targets.splice(idx, 1); },
      cancelBack() {
        if (this.isEditing) this.$router.push(`/admin/opcr/${this.recordId}`);
        else this.$router.push("/admin/opcr");
      },
      openConfirmationDialog(p) { this.confirmationDialog = { visible: true, ...p }; return new Promise((r) => { this.confirmationResolver = r; }); },
      closeConfirmationDialog(c) { this.confirmationDialog = createConfirmationDialogState(); resolveConfirmation(this.confirmationResolver, c); this.confirmationResolver = null; },
      async loadRecord() {
        if (!this.isEditing) return;
        try {
          const res = await API.get(`/admin/opcr/${this.recordId}`);
          const r = res.data?.record;
          if (!r) { this.errorMessage = "OPCR not found."; return; }
          this.form = {
            office: r.office || "",
            ratingPeriod: r.ratingPeriod || "",
            periodStart: r.periodStart ? String(r.periodStart).slice(0, 10) : "",
            periodEnd: r.periodEnd ? String(r.periodEnd).slice(0, 10) : "",
            status: r.status || "Draft",
            preparedBy: r.preparedBy || "",
            reviewedBy: r.reviewedBy || "",
            approvedBy: r.approvedBy || "",
            targets: (r.targets || []).map((t) => ({
              mfoProgram: t.mfoProgram || "",
              successIndicator: t.successIndicator || "",
              target: t.target || "",
              accomplishment: t.accomplishment || "",
              quality: Number(t.quality) || 0,
              efficiency: Number(t.efficiency) || 0,
              timeliness: Number(t.timeliness) || 0,
              remarks: t.remarks || "",
            })),
          };
          if (r.attachedFile?.id) {
            this.uploadedFile = { id: r.attachedFile.id, originalName: r.attachedFile.originalName, url: r.attachedFile.url, mimeType: r.attachedFile.mimeType, size: r.attachedFile.size };
          }
        } catch (err) { this.errorMessage = err.response?.data?.message || "Unable to load OPCR."; }
      },
      fileToBase64(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); }); },
      async handleFileSelect(event) {
        const [file] = event.target.files || [];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { this.uploadError = "5 MB max."; event.target.value = ""; return; }
        this.uploadError = ""; this.isUploading = true;
        try {
          const base64 = await this.fileToBase64(file);
          const res = await API.post("/files", { fileName: file.name, mimeType: file.type, contentBase64: base64 });
          const f = res.data?.file;
          if (!f?.id) throw new Error("Upload returned no file id.");
          this.uploadedFile = { id: f.id, originalName: f.originalName, url: f.url, mimeType: f.mimeType, size: f.size };
        } catch (err) { this.uploadError = err.response?.data?.message || err.message || "Upload failed."; }
        finally { this.isUploading = false; event.target.value = ""; }
      },
      async submit() {
        this.errorMessage = "";
        const confirmed = await this.openConfirmationDialog(
          this.isEditing
            ? { title: "Update OPCR?", description: `Apply your changes to "${this.form.office} — ${this.form.ratingPeriod}".`, confirmText: "Yes, update" }
            : { title: "Save new OPCR?", description: `Create OPCR for "${this.form.office} — ${this.form.ratingPeriod}".`, confirmText: "Yes, save" }
        );
        if (!confirmed) return;
        this.isSubmitting = true;
        const payload = { ...this.form, attachedFile: this.uploadedFile };
        try {
          if (this.isEditing) {
            await API.put(`/admin/opcr/${this.recordId}`, payload);
            this.$router.push(`/admin/opcr/${this.recordId}`);
          } else {
            const res = await API.post("/admin/opcr", payload);
            const newId = res.data?.record?.id;
            this.$router.push(newId ? `/admin/opcr/${newId}` : "/admin/opcr");
          }
        } catch (err) { this.errorMessage = err.response?.data?.message || "Unable to save OPCR."; }
        finally { this.isSubmitting = false; }
      },
    },
    mounted() { this.loadRecord(); },
  };
</script>
