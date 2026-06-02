<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex items-center justify-between">
      <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / HRIS</p>
      <div class="flex items-center gap-2">
        <span v-if="!canEdit" class="rounded-full border border-case-border bg-case-elevated px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          Read-only
        </span>
        <button
          v-if="canEdit"
          type="button"
          class="rounded-xl bg-blue-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
          :disabled="!employee"
          @click="$router.push(`/admin/hris/${employeeId}/edit`)"
        >
          EDIT
        </button>
        <button
          v-if="canEdit"
          type="button"
          class="rounded-xl bg-red-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!employee || isDeleting"
          @click="deleteEmployee"
        >
          {{ isDeleting ? "Deleting..." : "DELETE" }}
        </button>
        <button
          type="button"
          class="rounded-xl bg-emerald-600/80 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          @click="$router.push('/admin/hris')"
        >
          BACK
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="mb-4 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
      {{ errorMessage }}
    </div>

    <div v-if="employee" class="space-y-6">
      <!-- Profile card -->
      <div class="rounded-2xl border border-case-border bg-case-surface p-6">
        <div class="flex items-start gap-5">
          <div class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-case-border bg-primary/15">
            <img
              v-if="employee.profilePicture?.url"
              :src="employee.profilePicture.url"
              :alt="employee.fullName"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
              {{ initials }}
            </div>
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-2xl font-semibold text-white">{{ employee.fullName }}</h1>
              <span :class="statusBadgeClass(employee.status)" class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]">
                {{ employee.status }}
              </span>
            </div>
            <p class="mt-1 text-sm text-gray-400">
              {{ employee.position || '—' }}<span v-if="employee.department"> · {{ employee.department }}</span>
            </p>
            <p class="mt-1 text-xs text-gray-500 tabular-nums">{{ employee.employeeId }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 border-t border-case-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Date Hired</p>
            <p class="mt-1 text-sm text-gray-200 tabular-nums">{{ formatDate(employee.dateHired) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Birth Date</p>
            <p class="mt-1 text-sm text-gray-200 tabular-nums">{{ formatDate(employee.birthDate) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Age</p>
            <p class="mt-1 text-sm text-gray-200 tabular-nums">{{ age !== null ? `${age} years` : '—' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Email</p>
            <p class="mt-1 truncate text-sm text-gray-200">{{ employee.email || '—' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Contact</p>
            <p class="mt-1 text-sm text-gray-200">{{ employee.contactNumber || '—' }}</p>
          </div>
          <div class="sm:col-span-2 lg:col-span-3">
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Address</p>
            <p class="mt-1 text-sm text-gray-200">{{ employee.address || '—' }}</p>
          </div>
          <div v-if="employee.notes" class="sm:col-span-2 lg:col-span-4">
            <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Notes</p>
            <p class="mt-1 whitespace-pre-line text-sm text-gray-300">{{ employee.notes }}</p>
          </div>
        </div>

        <div v-if="employee.relatives && employee.relatives.length" class="mt-5 border-t border-case-border pt-5">
          <p class="text-xs uppercase tracking-[0.2em] text-gray-500">First Related Relative</p>
          <div class="mt-2 grid gap-3 sm:grid-cols-3">
            <div>
              <p class="text-[10px] uppercase tracking-[0.2em] text-gray-600">Name</p>
              <p class="mt-1 text-sm text-gray-200">{{ employee.relatives[0].name || '—' }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-[0.2em] text-gray-600">Relationship</p>
              <p class="mt-1 text-sm text-gray-200">{{ employee.relatives[0].relationship || '—' }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-[0.2em] text-gray-600">Contact No.</p>
              <p class="mt-1 text-sm text-gray-200">{{ employee.relatives[0].contactNumber || '—' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents per category -->
      <div
        v-for="category in categories"
        :key="category.key"
        class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6"
      >
        <header class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-white">{{ category.label }}</h2>
            <p class="text-xs text-gray-500">{{ documentsByCategory(category.key).length }} document(s)</p>
          </div>
          <button
            v-if="canEdit"
            type="button"
            class="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
            @click="openDocumentForm(category.key)"
          >
            + Add Document
          </button>
        </header>

        <div v-if="documentsByCategory(category.key).length" class="overflow-hidden rounded-xl border border-case-border">
          <table class="w-full text-left text-sm">
            <thead class="bg-case-elevated text-xs uppercase tracking-[0.2em] text-gray-500">
              <tr>
                <th class="px-4 py-2 font-medium">Title</th>
                <th class="px-4 py-2 font-medium">Date</th>
                <th class="px-4 py-2 font-medium">Description</th>
                <th class="px-4 py-2 font-medium">File</th>
                <th class="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-case-border text-gray-300">
              <tr v-for="doc in documentsByCategory(category.key)" :key="doc.id">
                <td class="px-4 py-2 font-medium text-gray-200">{{ doc.title }}</td>
                <td class="px-4 py-2 text-gray-400 tabular-nums">{{ formatDate(doc.documentDate) }}</td>
                <td class="px-4 py-2 text-gray-400">{{ doc.description || '—' }}</td>
                <td class="px-4 py-2">
                  <a
                    v-if="doc.attachedFile?.url"
                    :href="doc.attachedFile.url"
                    target="_blank"
                    rel="noopener"
                    class="text-primary hover:underline"
                  >
                    open
                  </a>
                  <span v-else class="text-gray-600">—</span>
                </td>
                <td class="px-4 py-2 text-right">
                  <div class="inline-flex items-center gap-1">
                    <button
                      v-if="canEdit"
                      type="button"
                      class="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20"
                      @click="openDocumentForm(category.key, doc)"
                    >
                      Edit
                    </button>
                    <button
                      v-if="canEdit"
                      type="button"
                      class="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
                      @click="confirmDeleteDocument(doc)"
                    >
                      Delete
                    </button>
                    <span v-else class="text-[11px] text-gray-600">—</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="rounded-xl border border-dashed border-case-border px-4 py-6 text-center text-xs text-gray-600">
          No documents in this category yet.
        </p>
      </div>
    </div>

    <div v-else-if="!errorMessage" class="rounded-2xl border border-case-border bg-case-surface p-10 text-center text-sm text-gray-500">
      Loading employee...
    </div>

    <!-- Document add/edit modal -->
    <div
      v-if="documentForm.visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      @click.self="closeDocumentForm"
    >
      <div class="w-full max-w-lg rounded-2xl border border-case-border bg-case-surface p-6 shadow-2xl shadow-black/60">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {{ documentForm.editingId ? "Edit document" : "Add document" }}
        </p>
        <h3 class="mt-2 text-xl font-semibold text-white">{{ categoryLabelFor(documentForm.category) }}</h3>

        <form class="mt-5 space-y-4" @submit.prevent="submitDocument">
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
              Title <span class="text-primary">*</span>
            </label>
            <input
              v-model="documentForm.title"
              type="text"
              required
              class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
              placeholder="e.g. SALN 2025"
            />
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Document Date</label>
              <input
                v-model="documentForm.documentDate"
                type="date"
                class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Category</label>
              <select
                v-model="documentForm.category"
                class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
              >
                <option v-for="c in categories" :key="c.key" :value="c.key">{{ c.label }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Description</label>
            <textarea
              v-model="documentForm.description"
              rows="2"
              class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
              placeholder="Optional notes (rating, period, awarding body, etc.)"
            ></textarea>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Attached File</label>
            <div class="flex items-center gap-3">
              <input ref="fileInput" type="file" class="hidden" @change="handleFileSelect" />
              <button
                type="button"
                class="rounded-xl border border-case-border bg-case-card px-3 py-1.5 text-xs text-gray-300 hover:bg-case-elevated"
                @click="$refs.fileInput.click()"
              >
                {{ documentForm.attachedFile ? 'Replace file' : 'Choose file' }}
              </button>
              <p v-if="documentForm.attachedFile" class="truncate text-xs text-gray-400">
                {{ documentForm.attachedFile.originalName }}
              </p>
              <p v-else class="text-xs text-gray-600">No file chosen.</p>
            </div>
            <p v-if="documentForm.isUploading" class="mt-1 text-xs text-primary">Uploading...</p>
            <p v-if="documentForm.uploadError" class="mt-1 text-xs text-red-400">{{ documentForm.uploadError }}</p>
          </div>

          <div v-if="documentForm.error" class="rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">
            {{ documentForm.error }}
          </div>

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="rounded-xl border border-case-border px-4 py-2 text-sm text-gray-400 hover:bg-case-elevated"
              @click="closeDocumentForm"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:opacity-50"
              :disabled="documentForm.isSubmitting || documentForm.isUploading"
            >
              {{ documentForm.isSubmitting ? "Saving..." : (documentForm.editingId ? "Save" : "Add") }}
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
  import { canEditModule } from "@/services/access";
  import {
    createConfirmationDialogState,
    resolveConfirmation,
  } from "@/helper/record-confirmation";

  const CATEGORIES = [
    { key: "201_FILE", label: "201 File" },
    { key: "SALN", label: "SALN" },
    { key: "BIR_2316", label: "BIR 2316" },
    { key: "PDS", label: "Personal Data Sheet (PDS)" },
    { key: "IPCR", label: "IPCR" },
    { key: "OTHER_PERSONAL", label: "Other Personal Documents" },
    { key: "TRAINING_CERT", label: "Training Certificates" },
    { key: "COMMENDATION", label: "Commendations" },
  ];

  function emptyDocumentForm() {
    return {
      visible: false,
      editingId: "",
      category: CATEGORIES[0].key,
      title: "",
      documentDate: "",
      description: "",
      attachedFile: null,
      isUploading: false,
      uploadError: "",
      isSubmitting: false,
      error: "",
    };
  }

  export default {
    name: "AdminHrisProfile",
    components: { ConfirmationDialog },
    data() {
      return {
        employee: null,
        documents: [],
        errorMessage: "",
        isDeleting: false,
        categories: CATEGORIES,
        documentForm: emptyDocumentForm(),
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    computed: {
      employeeId() {
        return this.$route.params.id;
      },
      canEdit() {
        return canEditModule("admin");
      },
      initials() {
        if (!this.employee) return "?";
        const a = (this.employee.firstName || " ").charAt(0);
        const b = (this.employee.lastName || " ").charAt(0);
        return `${a}${b}`.toUpperCase();
      },
      age() {
        if (!this.employee?.birthDate) return null;
        const birth = new Date(this.employee.birthDate);
        if (Number.isNaN(birth.getTime())) return null;
        const now = new Date();
        let years = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years -= 1;
        return years >= 0 ? years : null;
      },
    },
    methods: {
      formatDate(value) {
        if (!value) return "—";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toISOString().slice(0, 10);
      },
      statusBadgeClass(status) {
        const map = {
          Active: "bg-emerald-500/15 text-emerald-300",
          "On Leave": "bg-amber-500/15 text-amber-300",
          Resigned: "bg-gray-500/15 text-gray-300",
          Retired: "bg-blue-500/15 text-blue-300",
          Terminated: "bg-red-500/15 text-red-300",
        };
        return map[status] || "bg-gray-500/15 text-gray-300";
      },
      categoryLabelFor(key) {
        return CATEGORIES.find((c) => c.key === key)?.label || key;
      },
      documentsByCategory(key) {
        return this.documents.filter((d) => d.category === key);
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
      async loadEmployee() {
        this.errorMessage = "";
        try {
          const res = await API.get(`/admin/hris/employees/${this.employeeId}`);
          this.employee = res.data?.employee || null;
          this.documents = Array.isArray(res.data?.documents) ? res.data.documents : [];
          if (!this.employee) this.errorMessage = "Employee not found.";
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to load employee.";
        }
      },
      async deleteEmployee() {
        if (!this.employee) return;
        const confirmed = await this.openConfirmationDialog({
          title: "Delete employee?",
          description: `Employee "${this.employee.fullName}" and ALL related documents will be permanently removed. This cannot be undone.`,
          confirmText: "Yes, delete",
        });
        if (!confirmed) return;
        this.isDeleting = true;
        try {
          await API.delete(`/admin/hris/employees/${this.employeeId}`);
          this.$router.push("/admin/hris");
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to delete employee.";
          this.isDeleting = false;
        }
      },
      openDocumentForm(category, doc = null) {
        this.documentForm = emptyDocumentForm();
        this.documentForm.visible = true;
        this.documentForm.category = category;
        if (doc) {
          this.documentForm.editingId = doc.id;
          this.documentForm.title = doc.title || "";
          this.documentForm.documentDate = doc.documentDate ? String(doc.documentDate).slice(0, 10) : "";
          this.documentForm.description = doc.description || "";
          if (doc.attachedFile?.id) {
            this.documentForm.attachedFile = {
              id: doc.attachedFile.id,
              originalName: doc.attachedFile.originalName || "",
              url: doc.attachedFile.url || "",
              mimeType: doc.attachedFile.mimeType || "",
              size: Number(doc.attachedFile.size) || 0,
            };
          }
        }
      },
      closeDocumentForm() {
        this.documentForm = emptyDocumentForm();
      },
      fileToBase64(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      },
      async handleFileSelect(event) {
        const [file] = event.target.files || [];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          this.documentForm.uploadError = "Please choose a file 5 MB or smaller.";
          event.target.value = "";
          return;
        }
        this.documentForm.uploadError = "";
        this.documentForm.isUploading = true;
        try {
          const base64 = await this.fileToBase64(file);
          const res = await API.post("/files", {
            fileName: file.name,
            mimeType: file.type,
            contentBase64: base64,
          });
          const f = res.data?.file;
          if (!f?.id) throw new Error("Upload returned no file id.");
          this.documentForm.attachedFile = {
            id: f.id,
            originalName: f.originalName,
            url: f.url,
            mimeType: f.mimeType,
            size: f.size,
          };
        } catch (err) {
          this.documentForm.uploadError = err.response?.data?.message || err.message || "Upload failed.";
        } finally {
          this.documentForm.isUploading = false;
          event.target.value = "";
        }
      },
      async submitDocument() {
        this.documentForm.error = "";

        const isEdit = Boolean(this.documentForm.editingId);
        const confirmed = await this.openConfirmationDialog(
          isEdit
            ? {
                title: "Update document?",
                description: `Apply your changes to "${this.documentForm.title}".`,
                confirmText: "Yes, update",
              }
            : {
                title: "Add document?",
                description: `Add "${this.documentForm.title}" to ${this.categoryLabelFor(this.documentForm.category)}.`,
                confirmText: "Yes, add",
              }
        );
        if (!confirmed) return;

        this.documentForm.isSubmitting = true;
        const payload = {
          category: this.documentForm.category,
          title: this.documentForm.title,
          documentDate: this.documentForm.documentDate || null,
          description: this.documentForm.description,
          attachedFile: this.documentForm.attachedFile,
        };

        try {
          if (isEdit) {
            await API.put(
              `/admin/hris/employees/${this.employeeId}/documents/${this.documentForm.editingId}`,
              payload
            );
          } else {
            await API.post(`/admin/hris/employees/${this.employeeId}/documents`, payload);
          }
          this.closeDocumentForm();
          await this.loadEmployee();
        } catch (err) {
          this.documentForm.error = err.response?.data?.message || "Unable to save the document.";
        } finally {
          this.documentForm.isSubmitting = false;
        }
      },
      async confirmDeleteDocument(doc) {
        const confirmed = await this.openConfirmationDialog({
          title: "Delete document?",
          description: `Document "${doc.title}" will be permanently removed. This cannot be undone.`,
          confirmText: "Yes, delete",
        });
        if (!confirmed) return;
        try {
          await API.delete(`/admin/hris/employees/${this.employeeId}/documents/${doc.id}`);
          await this.loadEmployee();
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to delete document.";
        }
      },
    },
    mounted() {
      this.loadEmployee();
    },
  };
</script>
