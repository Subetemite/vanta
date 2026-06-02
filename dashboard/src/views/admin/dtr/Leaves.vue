<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / DTR / Leaves</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Leave of Absence</h1>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="rounded-xl border border-case-border bg-case-surface px-4 py-2 text-sm text-gray-300 hover:bg-case-card" @click="$router.push('/admin/dtr')">Back</button>
        <button type="button" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500" @click="openForm()">+ Add Leave</button>
      </div>
    </header>

    <div class="mb-5 grid gap-3 sm:grid-cols-2">
      <select v-model="filters.employee" class="rounded-xl border border-case-border bg-case-surface px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" @change="loadLeaves">
        <option value="">All Employees</option>
        <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.fullName }} ({{ e.employeeId }})</option>
      </select>
      <select v-model="filters.status" class="rounded-xl border border-case-border bg-case-surface px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" @change="loadLeaves">
        <option value="">All Statuses</option>
        <option v-for="s in leaveStatus" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div v-if="errorMessage" class="mb-3 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{{ errorMessage }}</div>

    <div class="overflow-hidden rounded-2xl border border-case-border bg-case-surface">
      <table class="w-full text-left text-sm">
        <thead class="bg-case-elevated text-xs uppercase tracking-[0.2em] text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">Employee</th>
            <th class="px-4 py-3 font-medium">Leave Type</th>
            <th class="px-4 py-3 font-medium">From</th>
            <th class="px-4 py-3 font-medium">To</th>
            <th class="px-4 py-3 font-medium">Days</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">File</th>
            <th class="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-case-border text-gray-300">
          <tr v-if="isLoading"><td colspan="8" class="px-4 py-6 text-center text-gray-500">Loading...</td></tr>
          <tr v-else-if="!leaves.length"><td colspan="8" class="px-4 py-6 text-center text-gray-500">No leaves yet.</td></tr>
          <tr v-for="l in leaves" :key="l.id" class="hover:bg-case-card">
            <td class="px-4 py-2">{{ l.employeeName }} <span class="text-xs text-gray-500">({{ l.employeeId }})</span></td>
            <td class="px-4 py-2">{{ l.leaveType }}</td>
            <td class="px-4 py-2 text-gray-400 tabular-nums">{{ formatDate(l.startDate) }}</td>
            <td class="px-4 py-2 text-gray-400 tabular-nums">{{ formatDate(l.endDate) }}</td>
            <td class="px-4 py-2 tabular-nums">{{ l.numberOfDays }}</td>
            <td class="px-4 py-2"><span :class="statusBadge(l.status)" class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]">{{ l.status }}</span></td>
            <td class="px-4 py-2"><a v-if="l.attachedFile?.url" :href="l.attachedFile.url" target="_blank" rel="noopener" class="text-primary hover:underline">link</a><span v-else class="text-gray-600">—</span></td>
            <td class="px-4 py-2 text-right">
              <div class="inline-flex items-center gap-1">
                <button type="button" class="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20" @click="openForm(l)">Edit</button>
                <button type="button" class="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/20" @click="confirmDelete(l)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="form.visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" @click.self="closeForm">
      <div class="w-full max-w-lg rounded-2xl border border-case-border bg-case-surface p-6 shadow-2xl shadow-black/60">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{{ form.editingId ? "Edit Leave" : "Add Leave" }}</p>
        <form class="mt-5 space-y-4" @submit.prevent="submit">
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Employee <span class="text-primary">*</span></label>
            <select v-model="form.employee" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary">
              <option value="">Select employee...</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.fullName }} ({{ e.employeeId }})</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Leave Type <span class="text-primary">*</span></label>
            <select v-model="form.leaveType" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary">
              <option v-for="t in leaveTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Start Date <span class="text-primary">*</span></label><input v-model="form.startDate" type="date" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">End Date <span class="text-primary">*</span></label><input v-model="form.endDate" type="date" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Status</label>
            <select v-model="form.status" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary">
              <option v-for="s in leaveStatus" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Reason</label>
            <textarea v-model="form.reason" rows="2" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"></textarea>
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Attached Form</label>
            <div class="flex items-center gap-3">
              <input ref="fileInput" type="file" class="hidden" @change="handleFileSelect" />
              <button type="button" class="rounded-xl border border-case-border bg-case-card px-3 py-1.5 text-xs text-gray-300 hover:bg-case-elevated" @click="$refs.fileInput.click()">{{ form.attachedFile ? 'Replace file' : 'Choose file' }}</button>
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
  import API from "@/services/api";
  import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
  import { createConfirmationDialogState, resolveConfirmation } from "@/helper/record-confirmation";

  const LEAVE_TYPES = [
    "Vacation Leave","Sick Leave","Mandatory/Forced Leave","Special Privilege Leave",
    "Maternity Leave","Paternity Leave","Solo Parent Leave","Study Leave","10-Day VAWC Leave",
    "Rehabilitation Leave","Special Leave Benefit for Women","Adoption Leave","Special Emergency Leave","Other",
  ];
  const LEAVE_STATUS = ["Pending","Approved","Rejected","Cancelled"];

  function emptyForm() {
    return { visible: false, editingId: "", employee: "", leaveType: LEAVE_TYPES[0], startDate: "", endDate: "", status: "Pending", reason: "", attachedFile: null, isUploading: false, uploadError: "", isSubmitting: false, error: "" };
  }

  export default {
    name: "AdminDtrLeaves",
    components: { ConfirmationDialog },
    data() {
      return {
        leaves: [],
        employees: [],
        leaveTypes: LEAVE_TYPES,
        leaveStatus: LEAVE_STATUS,
        filters: { employee: "", status: "" },
        isLoading: false,
        errorMessage: "",
        form: emptyForm(),
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    methods: {
      formatDate(value) { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10); },
      statusBadge(status) {
        const map = { Pending: "bg-amber-500/15 text-amber-300", Approved: "bg-emerald-500/15 text-emerald-300", Rejected: "bg-red-500/15 text-red-300", Cancelled: "bg-gray-500/15 text-gray-300" };
        return map[status] || "bg-gray-500/15 text-gray-300";
      },
      openConfirmationDialog(payload) { this.confirmationDialog = { visible: true, ...payload }; return new Promise((r) => { this.confirmationResolver = r; }); },
      closeConfirmationDialog(c) { this.confirmationDialog = createConfirmationDialogState(); resolveConfirmation(this.confirmationResolver, c); this.confirmationResolver = null; },
      async loadEmployees() { try { const res = await API.get("/admin/hris/employees"); this.employees = res.data?.employees || []; } catch { this.employees = []; } },
      async loadLeaves() {
        this.isLoading = true; this.errorMessage = "";
        try {
          const params = new URLSearchParams();
          if (this.filters.employee) params.set("employee", this.filters.employee);
          if (this.filters.status) params.set("status", this.filters.status);
          const qs = params.toString();
          const res = await API.get(`/admin/dtr/leaves${qs ? `?${qs}` : ""}`);
          this.leaves = Array.isArray(res.data?.leaves) ? res.data.leaves : [];
        } catch (err) { this.errorMessage = err.response?.data?.message || "Unable to load leaves."; }
        finally { this.isLoading = false; }
      },
      openForm(leave = null) {
        this.form = emptyForm();
        this.form.visible = true;
        if (leave) {
          this.form.editingId = leave.id;
          this.form.employee = String(leave.employee || "");
          this.form.leaveType = leave.leaveType;
          this.form.startDate = this.formatDate(leave.startDate);
          this.form.endDate = this.formatDate(leave.endDate);
          this.form.status = leave.status;
          this.form.reason = leave.reason || "";
          if (leave.attachedFile?.id) {
            this.form.attachedFile = { id: leave.attachedFile.id, originalName: leave.attachedFile.originalName, url: leave.attachedFile.url, mimeType: leave.attachedFile.mimeType, size: leave.attachedFile.size };
          }
        }
      },
      closeForm() { this.form = emptyForm(); },
      fileToBase64(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); }); },
      async handleFileSelect(event) {
        const [file] = event.target.files || [];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { this.form.uploadError = "Please choose a file 5 MB or smaller."; event.target.value = ""; return; }
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
            ? { title: "Update leave?", description: "Apply your changes to this leave record.", confirmText: "Yes, update" }
            : { title: "Save leave?", description: "Add this leave of absence record.", confirmText: "Yes, save" }
        );
        if (!confirmed) return;
        this.form.isSubmitting = true;
        const payload = {
          employee: this.form.employee, leaveType: this.form.leaveType,
          startDate: this.form.startDate, endDate: this.form.endDate,
          status: this.form.status, reason: this.form.reason,
          attachedFile: this.form.attachedFile,
        };
        try {
          if (isEdit) await API.put(`/admin/dtr/leaves/${this.form.editingId}`, payload);
          else await API.post("/admin/dtr/leaves", payload);
          this.closeForm();
          await this.loadLeaves();
        } catch (err) { this.form.error = err.response?.data?.message || "Unable to save the leave."; }
        finally { this.form.isSubmitting = false; }
      },
      async confirmDelete(leave) {
        const confirmed = await this.openConfirmationDialog({
          title: "Delete leave?",
          description: `Leave record for ${leave.employeeName} (${leave.leaveType}) will be permanently removed.`,
          confirmText: "Yes, delete",
        });
        if (!confirmed) return;
        try {
          await API.delete(`/admin/dtr/leaves/${leave.id}`);
          await this.loadLeaves();
        } catch (err) { this.errorMessage = err.response?.data?.message || "Unable to delete leave."; }
      },
    },
    mounted() { this.loadEmployees(); this.loadLeaves(); },
  };
</script>
