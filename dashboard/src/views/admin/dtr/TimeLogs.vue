<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / DTR / Time Logs</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Daily Time Record</h1>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="rounded-xl border border-case-border bg-case-surface px-4 py-2 text-sm text-gray-300 hover:bg-case-card" @click="$router.push('/admin/dtr')">
          Back
        </button>
        <button type="button" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500" @click="openForm()">
          + Add Time Log
        </button>
      </div>
    </header>

    <div class="mb-5 grid gap-3 sm:grid-cols-3">
      <select v-model="filters.employee" class="rounded-xl border border-case-border bg-case-surface px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" @change="loadLogs">
        <option value="">All Employees</option>
        <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.fullName }} ({{ e.employeeId }})</option>
      </select>
      <input v-model="filters.from" type="date" class="rounded-xl border border-case-border bg-case-surface px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" @change="loadLogs" />
      <input v-model="filters.to" type="date" class="rounded-xl border border-case-border bg-case-surface px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" @change="loadLogs" />
    </div>

    <div v-if="errorMessage" class="mb-3 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
      {{ errorMessage }}
    </div>

    <div class="overflow-hidden rounded-2xl border border-case-border bg-case-surface">
      <table class="w-full text-left text-sm">
        <thead class="bg-case-elevated text-xs uppercase tracking-[0.2em] text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">Date</th>
            <th class="px-4 py-3 font-medium">Employee</th>
            <th class="px-4 py-3 font-medium">AM In</th>
            <th class="px-4 py-3 font-medium">AM Out</th>
            <th class="px-4 py-3 font-medium">PM In</th>
            <th class="px-4 py-3 font-medium">PM Out</th>
            <th class="px-4 py-3 font-medium">Hours</th>
            <th class="px-4 py-3 font-medium">Remarks</th>
            <th class="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-case-border text-gray-300">
          <tr v-if="isLoading">
            <td colspan="9" class="px-4 py-6 text-center text-gray-500">Loading...</td>
          </tr>
          <tr v-else-if="!logs.length">
            <td colspan="9" class="px-4 py-6 text-center text-gray-500">No time logs yet.</td>
          </tr>
          <tr v-for="log in logs" :key="log.id" class="hover:bg-case-card">
            <td class="px-4 py-2 text-gray-200 tabular-nums">{{ formatDate(log.date) }}</td>
            <td class="px-4 py-2">{{ log.employeeName }} <span class="text-xs text-gray-500">({{ log.employeeId }})</span></td>
            <td class="px-4 py-2 text-gray-400 tabular-nums">{{ formatTime(log.amIn) }}</td>
            <td class="px-4 py-2 text-gray-400 tabular-nums">{{ formatTime(log.amOut) }}</td>
            <td class="px-4 py-2 text-gray-400 tabular-nums">{{ formatTime(log.pmIn) }}</td>
            <td class="px-4 py-2 text-gray-400 tabular-nums">{{ formatTime(log.pmOut) }}</td>
            <td class="px-4 py-2 font-semibold text-primary tabular-nums">{{ log.totalHours.toFixed(2) }}</td>
            <td class="px-4 py-2 text-gray-400">{{ log.remarks || '—' }}</td>
            <td class="px-4 py-2 text-right">
              <div class="inline-flex items-center gap-1">
                <button type="button" class="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20" @click="openForm(log)">Edit</button>
                <button type="button" class="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/20" @click="confirmDelete(log)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Form modal -->
    <div v-if="form.visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" @click.self="closeForm">
      <div class="w-full max-w-lg rounded-2xl border border-case-border bg-case-surface p-6 shadow-2xl shadow-black/60">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{{ form.editingId ? "Edit Time Log" : "Add Time Log" }}</p>
        <form class="mt-5 space-y-4" @submit.prevent="submit">
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Employee <span class="text-primary">*</span></label>
            <select v-model="form.employee" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary">
              <option value="">Select employee...</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.fullName }} ({{ e.employeeId }})</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Date <span class="text-primary">*</span></label>
            <input v-model="form.date" type="date" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">AM In</label><input v-model="form.amIn" type="time" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">AM Out</label><input v-model="form.amOut" type="time" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">PM In</label><input v-model="form.pmIn" type="time" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">PM Out</label><input v-model="form.pmOut" type="time" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Remarks</label>
            <input v-model="form.remarks" type="text" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div v-if="form.error" class="rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">{{ form.error }}</div>
          <div class="flex justify-end gap-2">
            <button type="button" class="rounded-xl border border-case-border px-4 py-2 text-sm text-gray-400 hover:bg-case-elevated" @click="closeForm">Cancel</button>
            <button type="submit" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:opacity-50" :disabled="form.isSubmitting">
              {{ form.isSubmitting ? "Saving..." : (form.editingId ? "Save" : "Add") }}
            </button>
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

  function emptyForm() {
    return { visible: false, editingId: "", employee: "", date: "", amIn: "", amOut: "", pmIn: "", pmOut: "", remarks: "", isSubmitting: false, error: "" };
  }

  export default {
    name: "AdminDtrTimeLogs",
    components: { ConfirmationDialog },
    data() {
      return {
        logs: [],
        employees: [],
        filters: { employee: "", from: "", to: "" },
        isLoading: false,
        errorMessage: "",
        form: emptyForm(),
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    methods: {
      formatDate(value) {
        if (!value) return "—";
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
      },
      formatTime(value) {
        if (!value) return "—";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toISOString().slice(11, 16);
      },
      openConfirmationDialog(payload) {
        this.confirmationDialog = { visible: true, ...payload };
        return new Promise((resolve) => { this.confirmationResolver = resolve; });
      },
      closeConfirmationDialog(confirmed) {
        this.confirmationDialog = createConfirmationDialogState();
        resolveConfirmation(this.confirmationResolver, confirmed);
        this.confirmationResolver = null;
      },
      async loadEmployees() {
        try {
          const res = await API.get("/admin/hris/employees");
          this.employees = Array.isArray(res.data?.employees) ? res.data.employees : [];
        } catch { this.employees = []; }
      },
      async loadLogs() {
        this.isLoading = true;
        this.errorMessage = "";
        try {
          const params = new URLSearchParams();
          if (this.filters.employee) params.set("employee", this.filters.employee);
          if (this.filters.from) params.set("from", this.filters.from);
          if (this.filters.to) params.set("to", this.filters.to);
          const qs = params.toString();
          const res = await API.get(`/admin/dtr/time-logs${qs ? `?${qs}` : ""}`);
          this.logs = Array.isArray(res.data?.logs) ? res.data.logs : [];
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to load time logs.";
        } finally {
          this.isLoading = false;
        }
      },
      openForm(log = null) {
        this.form = emptyForm();
        this.form.visible = true;
        if (log) {
          this.form.editingId = log.id;
          this.form.employee = String(log.employee || "");
          this.form.date = this.formatDate(log.date);
          this.form.amIn = log.amIn ? this.formatTime(log.amIn) : "";
          this.form.amOut = log.amOut ? this.formatTime(log.amOut) : "";
          this.form.pmIn = log.pmIn ? this.formatTime(log.pmIn) : "";
          this.form.pmOut = log.pmOut ? this.formatTime(log.pmOut) : "";
          this.form.remarks = log.remarks || "";
        }
      },
      closeForm() { this.form = emptyForm(); },
      async submit() {
        this.form.error = "";
        const isEdit = Boolean(this.form.editingId);
        const confirmed = await this.openConfirmationDialog(
          isEdit
            ? { title: "Update time log?", description: "Apply your changes to this time log.", confirmText: "Yes, update" }
            : { title: "Save time log?", description: "Add this time log entry.", confirmText: "Yes, save" }
        );
        if (!confirmed) return;
        this.form.isSubmitting = true;
        const payload = {
          employee: this.form.employee,
          date: this.form.date,
          amIn: this.form.amIn,
          amOut: this.form.amOut,
          pmIn: this.form.pmIn,
          pmOut: this.form.pmOut,
          remarks: this.form.remarks,
        };
        try {
          if (isEdit) await API.put(`/admin/dtr/time-logs/${this.form.editingId}`, payload);
          else await API.post("/admin/dtr/time-logs", payload);
          this.closeForm();
          await this.loadLogs();
        } catch (err) {
          this.form.error = err.response?.data?.message || "Unable to save the time log.";
        } finally {
          this.form.isSubmitting = false;
        }
      },
      async confirmDelete(log) {
        const confirmed = await this.openConfirmationDialog({
          title: "Delete time log?",
          description: `Time log for ${log.employeeName} on ${this.formatDate(log.date)} will be permanently removed.`,
          confirmText: "Yes, delete",
        });
        if (!confirmed) return;
        try {
          await API.delete(`/admin/dtr/time-logs/${log.id}`);
          await this.loadLogs();
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to delete time log.";
        }
      },
    },
    mounted() {
      this.loadEmployees();
      this.loadLogs();
    },
  };
</script>
