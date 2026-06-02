<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / DTR / Operations</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Official Operations</h1>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="rounded-xl border border-case-border bg-case-surface px-4 py-2 text-sm text-gray-300 hover:bg-case-card" @click="$router.push('/admin/dtr')">Back</button>
        <button type="button" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500" @click="openForm()">+ Add Operation</button>
      </div>
    </header>

    <div class="mb-5 flex items-center rounded-xl border border-case-border bg-case-surface px-3 py-2">
      <Icon icon="mdi:magnify" class="text-lg text-gray-500" />
      <input v-model="search" type="search" placeholder="Search by name, reference order, assignee..." class="w-full bg-transparent px-2 py-1 text-sm text-gray-200 outline-none placeholder:text-gray-600" @input="onSearch" />
    </div>

    <div v-if="errorMessage" class="mb-3 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{{ errorMessage }}</div>

    <div class="overflow-hidden rounded-2xl border border-case-border bg-case-surface">
      <table class="w-full text-left text-sm">
        <thead class="bg-case-elevated text-xs uppercase tracking-[0.2em] text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">Operation</th>
            <th class="px-4 py-3 font-medium">Ref. Order</th>
            <th class="px-4 py-3 font-medium">From</th>
            <th class="px-4 py-3 font-medium">To</th>
            <th class="px-4 py-3 font-medium">Location</th>
            <th class="px-4 py-3 font-medium">Assignees</th>
            <th class="px-4 py-3 font-medium">File</th>
            <th class="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-case-border text-gray-300">
          <tr v-if="isLoading"><td colspan="8" class="px-4 py-6 text-center text-gray-500">Loading...</td></tr>
          <tr v-else-if="!operations.length"><td colspan="8" class="px-4 py-6 text-center text-gray-500">No operations yet.</td></tr>
          <tr v-for="o in operations" :key="o.id" class="hover:bg-case-card">
            <td class="px-4 py-2 font-medium text-white">{{ o.operationName }}</td>
            <td class="px-4 py-2 text-gray-400">{{ o.referenceOrder || '—' }}</td>
            <td class="px-4 py-2 text-gray-400 tabular-nums">{{ formatDate(o.startDate) }}</td>
            <td class="px-4 py-2 text-gray-400 tabular-nums">{{ formatDate(o.endDate) }}</td>
            <td class="px-4 py-2 text-gray-400">{{ o.location || '—' }}</td>
            <td class="px-4 py-2 text-gray-400">{{ assigneeSummary(o.assignees) }}</td>
            <td class="px-4 py-2"><a v-if="o.attachedFile?.url" :href="o.attachedFile.url" target="_blank" rel="noopener" class="text-primary hover:underline">link</a><span v-else class="text-gray-600">—</span></td>
            <td class="px-4 py-2 text-right">
              <div class="inline-flex items-center gap-1">
                <button type="button" class="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20" @click="openForm(o)">Edit</button>
                <button type="button" class="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/20" @click="confirmDelete(o)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="form.visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" @click.self="closeForm">
      <div class="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border border-case-border bg-case-surface p-6 shadow-2xl shadow-black/60">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{{ form.editingId ? "Edit Operation" : "New Operation" }}</p>
        <form class="mt-5 space-y-4" @submit.prevent="submit">
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Operation Name <span class="text-primary">*</span></label>
            <input v-model="form.operationName" type="text" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Reference Order</label><input v-model="form.referenceOrder" type="text" placeholder="e.g. SO-2026-001" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Location</label><input v-model="form.location" type="text" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Start Date <span class="text-primary">*</span></label><input v-model="form.startDate" type="date" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">End Date <span class="text-primary">*</span></label><input v-model="form.endDate" type="date" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Description</label>
            <textarea v-model="form.description" rows="3" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"></textarea>
          </div>
          <div>
            <div class="mb-1 flex items-center justify-between">
              <label class="block text-xs uppercase tracking-[0.2em] text-gray-500">Assignees</label>
              <button type="button" class="text-xs text-primary hover:underline" @click="addAssignee">+ Add</button>
            </div>
            <div v-for="(a, idx) in form.assignees" :key="idx" class="mb-2 flex items-center gap-2">
              <select v-model="a.employee" class="flex-1 rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary">
                <option value="">Select employee...</option>
                <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.fullName }} ({{ e.employeeId }})</option>
              </select>
              <input v-model="a.role" type="text" placeholder="Role" class="w-40 rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
              <button type="button" class="text-xs text-red-400 hover:underline" @click="form.assignees.splice(idx,1)">Remove</button>
            </div>
            <p v-if="!form.assignees.length" class="text-xs text-gray-600">No assignees added yet.</p>
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Attached File</label>
            <div class="flex items-center gap-3">
              <input ref="fileInput" type="file" class="hidden" @change="handleFileSelect" />
              <button type="button" class="rounded-xl border border-case-border bg-case-card px-3 py-1.5 text-xs text-gray-300 hover:bg-case-elevated" @click="$refs.fileInput.click()">{{ form.attachedFile ? 'Replace' : 'Choose file' }}</button>
              <p v-if="form.attachedFile" class="truncate text-xs text-gray-400">{{ form.attachedFile.originalName }}</p>
              <p v-else class="text-xs text-gray-600">No file chosen.</p>
            </div>
            <p v-if="form.isUploading" class="mt-1 text-xs text-primary">Uploading...</p>
            <p v-if="form.uploadError" class="mt-1 text-xs text-red-400">{{ form.uploadError }}</p>
          </div>
          <div v-if="form.error" class="rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">{{ form.error }}</div>
          <div class="flex justify-end gap-2">
            <button type="button" class="rounded-xl border border-case-border px-4 py-2 text-sm text-gray-400 hover:bg-case-elevated" @click="closeForm">Cancel</button>
            <button type="submit" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:opacity-50" :disabled="form.isSubmitting || form.isUploading">{{ form.isSubmitting ? "Saving..." : (form.editingId ? "Save" : "Add") }}</button>
          </div>
        </form>
      </div>
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
  import { createConfirmationDialogState, resolveConfirmation } from "@/helper/record-confirmation";

  function emptyForm() {
    return { visible: false, editingId: "", operationName: "", referenceOrder: "", description: "", startDate: "", endDate: "", location: "", assignees: [], attachedFile: null, isUploading: false, uploadError: "", isSubmitting: false, error: "" };
  }

  export default {
    name: "AdminDtrOperations",
    components: { Icon, ConfirmationDialog },
    data() {
      return {
        operations: [],
        employees: [],
        search: "",
        searchTimer: null,
        isLoading: false,
        errorMessage: "",
        form: emptyForm(),
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    methods: {
      formatDate(v) { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0,10); },
      assigneeSummary(arr) { if (!Array.isArray(arr) || !arr.length) return "—"; if (arr.length === 1) return arr[0].fullNameSnapshot; return `${arr[0].fullNameSnapshot} +${arr.length - 1}`; },
      openConfirmationDialog(p) { this.confirmationDialog = { visible: true, ...p }; return new Promise((r) => { this.confirmationResolver = r; }); },
      closeConfirmationDialog(c) { this.confirmationDialog = createConfirmationDialogState(); resolveConfirmation(this.confirmationResolver, c); this.confirmationResolver = null; },
      onSearch() { clearTimeout(this.searchTimer); this.searchTimer = setTimeout(() => this.loadOps(), 300); },
      async loadEmployees() { try { const res = await API.get("/admin/hris/employees"); this.employees = res.data?.employees || []; } catch { this.employees = []; } },
      async loadOps() {
        this.isLoading = true; this.errorMessage = "";
        try {
          const path = this.search.trim() ? `/admin/dtr/operations?q=${encodeURIComponent(this.search.trim())}` : "/admin/dtr/operations";
          const res = await API.get(path);
          this.operations = res.data?.operations || [];
        } catch (err) { this.errorMessage = err.response?.data?.message || "Unable to load operations."; }
        finally { this.isLoading = false; }
      },
      addAssignee() { this.form.assignees.push({ employee: "", role: "" }); },
      openForm(op = null) {
        this.form = emptyForm();
        this.form.visible = true;
        if (op) {
          this.form.editingId = op.id;
          this.form.operationName = op.operationName;
          this.form.referenceOrder = op.referenceOrder || "";
          this.form.description = op.description || "";
          this.form.startDate = this.formatDate(op.startDate);
          this.form.endDate = this.formatDate(op.endDate);
          this.form.location = op.location || "";
          this.form.assignees = (op.assignees || []).map((a) => ({ employee: String(a.employee || ""), role: a.role || "" }));
          if (op.attachedFile?.id) this.form.attachedFile = { ...op.attachedFile };
        }
      },
      closeForm() { this.form = emptyForm(); },
      fileToBase64(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); }); },
      async handleFileSelect(event) {
        const [file] = event.target.files || [];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { this.form.uploadError = "5 MB max."; event.target.value = ""; return; }
        this.form.uploadError = ""; this.form.isUploading = true;
        try {
          const base64 = await this.fileToBase64(file);
          const res = await API.post("/files", { fileName: file.name, mimeType: file.type, contentBase64: base64 });
          const f = res.data?.file;
          if (!f?.id) throw new Error("Upload returned no file id.");
          this.form.attachedFile = { id: f.id, originalName: f.originalName, url: f.url, mimeType: f.mimeType, size: f.size };
        } catch (err) { this.form.uploadError = err.response?.data?.message || err.message || "Upload failed."; }
        finally { this.form.isUploading = false; event.target.value = ""; }
      },
      async submit() {
        this.form.error = "";
        const isEdit = Boolean(this.form.editingId);
        const confirmed = await this.openConfirmationDialog(
          isEdit
            ? { title: "Update operation?", description: `Apply your changes to "${this.form.operationName}".`, confirmText: "Yes, update" }
            : { title: "Save operation?", description: `Save new official operation "${this.form.operationName}".`, confirmText: "Yes, save" }
        );
        if (!confirmed) return;
        this.form.isSubmitting = true;
        const payload = {
          operationName: this.form.operationName, referenceOrder: this.form.referenceOrder, description: this.form.description,
          startDate: this.form.startDate, endDate: this.form.endDate, location: this.form.location,
          assignees: this.form.assignees.filter(a => a.employee).map(a => ({ employee: a.employee, role: a.role })),
          attachedFile: this.form.attachedFile,
        };
        try {
          if (isEdit) await API.put(`/admin/dtr/operations/${this.form.editingId}`, payload);
          else await API.post("/admin/dtr/operations", payload);
          this.closeForm(); await this.loadOps();
        } catch (err) { this.form.error = err.response?.data?.message || "Unable to save the operation."; }
        finally { this.form.isSubmitting = false; }
      },
      async confirmDelete(op) {
        const confirmed = await this.openConfirmationDialog({ title: "Delete operation?", description: `Operation "${op.operationName}" will be permanently removed.`, confirmText: "Yes, delete" });
        if (!confirmed) return;
        try { await API.delete(`/admin/dtr/operations/${op.id}`); await this.loadOps(); }
        catch (err) { this.errorMessage = err.response?.data?.message || "Unable to delete operation."; }
      },
    },
    mounted() { this.loadEmployees(); this.loadOps(); },
    beforeUnmount() { clearTimeout(this.searchTimer); },
  };
</script>
