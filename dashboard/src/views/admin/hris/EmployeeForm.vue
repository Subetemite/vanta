<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex items-center justify-between">
      <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / HRIS</p>
      <button
        type="button"
        class="rounded-xl border border-case-border bg-case-surface px-4 py-2 text-sm text-gray-300 hover:bg-case-card"
        @click="$router.push(isEditing ? `/admin/hris/${employeeId}` : '/admin/hris')"
      >
        Back
      </button>
    </header>

    <h2 class="mb-4 inline-block rounded-md bg-primary/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.25em] text-primary">
      {{ isEditing ? "Edit Employee" : "New Employee" }}
    </h2>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">Identification</h3>
        <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div class="flex flex-col items-center gap-2 sm:w-40">
            <label class="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Profile Picture</label>
            <div class="relative h-32 w-32 overflow-hidden rounded-2xl border border-case-border bg-case-card">
              <img
                v-if="form.profilePicture?.url"
                :src="form.profilePicture.url"
                :alt="form.firstName || 'Profile'"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-600">
                <Icon icon="mdi:account-outline" class="text-4xl" />
                <span class="text-[10px] uppercase tracking-wider">No photo</span>
              </div>
              <span v-if="isUploadingPicture" class="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-primary">Uploading...</span>
            </div>
            <input ref="pictureInput" type="file" accept="image/*" class="hidden" @change="handlePictureSelect" />
            <div class="flex flex-wrap justify-center gap-1.5">
              <button type="button" class="rounded-md border border-case-border bg-case-card px-2.5 py-1 text-[11px] text-gray-300 hover:bg-case-elevated" @click="$refs.pictureInput.click()">
                {{ form.profilePicture?.url ? "Replace" : "Upload" }}
              </button>
              <button v-if="form.profilePicture?.url" type="button" class="rounded-md border border-red-900/40 bg-red-950/20 px-2.5 py-1 text-[11px] text-red-400 hover:bg-red-950/40" @click="form.profilePicture = null">
                Remove
              </button>
            </div>
            <p v-if="pictureError" class="text-center text-[11px] text-red-400">{{ pictureError }}</p>
          </div>

          <div class="grid flex-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
                Employee ID <span class="text-primary">*</span>
              </label>
              <input
                v-model="form.employeeId"
                type="text"
                required
                class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
                placeholder="e.g. EMP-2026-001"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Status</label>
              <select
                v-model="form.status"
                class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
              >
                <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">Personal Details</h3>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">First Name <span class="text-primary">*</span></label>
            <input v-model="form.firstName" type="text" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Middle Name</label>
            <input v-model="form.middleName" type="text" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Last Name <span class="text-primary">*</span></label>
            <input v-model="form.lastName" type="text" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Suffix</label>
            <input v-model="form.suffix" type="text" placeholder="Jr., Sr., III" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Birth Date</label>
            <input v-model="form.birthDate" type="date" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Email</label>
            <input v-model="form.email" type="email" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Contact No.</label>
            <input v-model="form.contactNumber" type="text" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div class="sm:col-span-2 lg:col-span-4">
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Address</label>
            <input v-model="form.address" type="text" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">Employment</h3>
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Position</label>
            <input v-model="form.position" type="text" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Department</label>
            <input v-model="form.department" type="text" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Date Hired</label>
            <input v-model="form.dateHired" type="date" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">First Related Relative</h3>
          <p class="text-[11px] text-gray-500">Primary contact in case of emergency.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Full Name</label>
            <input
              v-model="form.firstRelative.name"
              type="text"
              class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
              placeholder="e.g. Maria Dela Cruz"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Relationship</label>
            <select
              v-model="form.firstRelative.relationship"
              class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
            >
              <option value="">— Select —</option>
              <option v-for="opt in relationshipOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Contact No.</label>
            <input
              v-model="form.firstRelative.contactNumber"
              type="text"
              class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
              placeholder="e.g. 0917-XXX-XXXX"
            />
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-case-border bg-case-surface p-5 sm:p-6">
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">Notes</h3>
        <textarea
          v-model="form.notes"
          rows="3"
          class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
          placeholder="Any internal notes about this employee."
        ></textarea>
      </div>

      <div v-if="errorMessage" class="rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
        {{ errorMessage }}
      </div>

      <div class="flex justify-end">
        <button
          type="submit"
          class="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isSubmitting"
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
  import {
    createConfirmationDialogState,
    resolveConfirmation,
  } from "@/helper/record-confirmation";

  function emptyRelative() {
    return { name: "", relationship: "", contactNumber: "" };
  }

  function emptyForm() {
    return {
      employeeId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      birthDate: "",
      email: "",
      contactNumber: "",
      address: "",
      position: "",
      department: "",
      dateHired: "",
      status: "Active",
      notes: "",
      profilePicture: null,
      firstRelative: emptyRelative(),
    };
  }

  export default {
    name: "AdminHrisEmployeeForm",
    components: { Icon, ConfirmationDialog },
    data() {
      return {
        form: emptyForm(),
        statusOptions: ["Active", "On Leave", "Resigned", "Retired", "Terminated"],
        relationshipOptions: [
          "Spouse",
          "Father",
          "Mother",
          "Son",
          "Daughter",
          "Brother",
          "Sister",
          "Grandfather",
          "Grandmother",
          "Guardian",
          "Other",
        ],
        isSubmitting: false,
        errorMessage: "",
        isUploadingPicture: false,
        pictureError: "",
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    computed: {
      employeeId() {
        return this.$route.params.id || null;
      },
      isEditing() {
        return Boolean(this.employeeId);
      },
    },
    methods: {
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
        if (!this.isEditing) return;
        try {
          const res = await API.get(`/admin/hris/employees/${this.employeeId}`);
          const e = res.data?.employee;
          if (!e) {
            this.errorMessage = "Employee not found.";
            return;
          }
          const firstRelative = Array.isArray(e.relatives) && e.relatives[0]
            ? { ...emptyRelative(), ...e.relatives[0] }
            : emptyRelative();
          this.form = {
            employeeId: e.employeeId || "",
            firstName: e.firstName || "",
            middleName: e.middleName || "",
            lastName: e.lastName || "",
            suffix: e.suffix || "",
            birthDate: e.birthDate ? String(e.birthDate).slice(0, 10) : "",
            email: e.email || "",
            contactNumber: e.contactNumber || "",
            address: e.address || "",
            position: e.position || "",
            department: e.department || "",
            dateHired: e.dateHired ? String(e.dateHired).slice(0, 10) : "",
            status: e.status || "Active",
            notes: e.notes || "",
            profilePicture: e.profilePicture && e.profilePicture.id ? { ...e.profilePicture } : null,
            firstRelative,
          };
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to load employee.";
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
      async handlePictureSelect(event) {
        const [file] = event.target.files || [];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          this.pictureError = "Please choose an image file.";
          event.target.value = "";
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          this.pictureError = "Image must be 5 MB or smaller.";
          event.target.value = "";
          return;
        }
        this.pictureError = "";
        this.isUploadingPicture = true;
        try {
          const base64 = await this.fileToBase64(file);
          const res = await API.post("/files", {
            fileName: file.name,
            mimeType: file.type,
            contentBase64: base64,
          });
          const f = res.data?.file;
          if (!f?.id) throw new Error("Upload returned no file id.");
          this.form.profilePicture = {
            id: f.id,
            originalName: f.originalName,
            url: f.url,
            mimeType: f.mimeType,
            size: f.size,
          };
        } catch (err) {
          this.pictureError = err.response?.data?.message || err.message || "Upload failed.";
        } finally {
          this.isUploadingPicture = false;
          event.target.value = "";
        }
      },
      buildPayload() {
        const r = this.form.firstRelative || emptyRelative();
        const hasRelative = Boolean((r.name || "").trim() || (r.relationship || "").trim() || (r.contactNumber || "").trim());
        return {
          employeeId: this.form.employeeId,
          firstName: this.form.firstName,
          middleName: this.form.middleName,
          lastName: this.form.lastName,
          suffix: this.form.suffix,
          birthDate: this.form.birthDate || null,
          email: this.form.email,
          contactNumber: this.form.contactNumber,
          address: this.form.address,
          position: this.form.position,
          department: this.form.department,
          dateHired: this.form.dateHired || null,
          status: this.form.status,
          notes: this.form.notes,
          profilePicture: this.form.profilePicture,
          relatives: hasRelative ? [{ name: r.name.trim(), relationship: r.relationship.trim(), contactNumber: r.contactNumber.trim() }] : [],
        };
      },
      async handleSubmit() {
        this.errorMessage = "";

        const fullName = `${this.form.firstName} ${this.form.lastName}`.trim();
        const confirmed = await this.openConfirmationDialog(
          this.isEditing
            ? {
                title: "Update employee?",
                description: `This will apply your changes to ${fullName}.`,
                confirmText: "Yes, update",
              }
            : {
                title: "Save new employee?",
                description: `This will create a new employee record for ${fullName}.`,
                confirmText: "Yes, save",
              }
        );
        if (!confirmed) return;

        this.isSubmitting = true;
        try {
          const payload = this.buildPayload();
          if (this.isEditing) {
            await API.put(`/admin/hris/employees/${this.employeeId}`, payload);
            this.$router.push(`/admin/hris/${this.employeeId}`);
          } else {
            const res = await API.post("/admin/hris/employees", payload);
            const newId = res.data?.employee?.id;
            this.$router.push(newId ? `/admin/hris/${newId}` : "/admin/hris");
          }
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to save the employee.";
        } finally {
          this.isSubmitting = false;
        }
      },
    },
    mounted() {
      this.loadEmployee();
    },
  };
</script>
