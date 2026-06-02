<template>
  <div class="min-h-screen bg-case-bg overflow-x-hidden">
    <div class="mx-auto max-w-[1800px]">
      <div class="overflow-hidden lg:grid lg:grid-cols-[0.95fr_1.25fr] lg:min-h-screen">
        <section class="bg-case-surface border-b lg:border-b-0 lg:border-r border-case-border px-8 py-10 sm:px-10 lg:px-12">
            <p class="text-sm font-semibold uppercase tracking-[0.35em] text-primary">
              Operations
            </p>

            <div class="mt-8">
              <label for="operationSearch" class="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100/80">
                Search
              </label>
              <input
                id="operationSearch"
                v-model.trim="operationSearch"
                type="text"
                class="mt-3 w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 placeholder:text-gray-600 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Search by ID, code name, type, commander, or city"
              />
            </div>

            <div class="operations-scrollbar mt-8 max-h-[34rem] overflow-y-auto pr-1">
              <div
                v-if="isLoadingOperations"
                class="rounded-xl border border-case-border bg-case-card p-5 text-sm text-gray-500"
              >
                Loading operations...
              </div>
              <div
                v-else-if="operationsError"
                class="rounded-xl border border-red-900/50 bg-red-950/30 p-5 text-sm text-red-400"
              >
                {{ operationsError }}
              </div>
              <div
                v-else-if="!filteredOperations.length"
                class="rounded-xl border border-case-border bg-case-card p-5 text-sm text-gray-500"
              >
                No matching operations found.
              </div>
              <div
                v-for="operation in filteredOperations"
                :key="operation._id"
                class="mt-4 rounded-xl border p-4 transition cursor-pointer first:mt-0"
                :class="selectedOperationId === operation._id ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' : 'border-case-border bg-case-card hover:bg-case-elevated'"
                role="button"
                tabindex="0"
                @click="selectOperation(operation)"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0 text-sm">
                    <p class="truncate font-semibold text-gray-200">
                      {{ operation.operationCodeName || "Unnamed operation" }}
                    </p>
                    <p class="mt-1 text-gray-500">{{ operation.operationId || "Pending ID" }}</p>
                    <p class="mt-1 text-gray-500">{{ formatOperationMeta(operation) }}</p>
                  </div>
                  <span class="rounded-full bg-case-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    {{ operation.operationType || "Type" }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section class="bg-case-bg px-6 py-8 sm:px-8 lg:px-10">
            <div class="mb-8">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Operation Entry
              </p>
              <h2 class="mt-3 text-2xl font-semibold text-white">
                {{ isEditing ? "Edit operation" : "Operation details" }}
              </h2>
              <p class="mt-2 text-sm leading-7 text-gray-500">
                {{ isEditing ? "Update the selected operation and save the latest mission details." : "Create a new operation record." }}
              </p>
              <div v-if="isEditing" class="mt-4 flex flex-wrap items-center gap-3">
                <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Editing selected operation
                </span>
                <button
                  type="button"
                  class="rounded-full border border-case-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 transition hover:bg-case-elevated hover:text-gray-200"
                  @click="resetFormState"
                >
                  New operation
                </button>
              </div>
            </div>

            <form class="space-y-8" @submit.prevent="handleSubmit">
              <div
                ref="messageBanner"
                v-if="message.text"
                :class="message.type === 'success' ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400' : 'border-red-900/50 bg-red-950/30 text-red-400'"
                class="rounded-xl border px-4 py-3 text-sm"
              >
                {{ message.text }}
              </div>

              <FormSection
                title="Operation Profile"
                badge-text="Required"
                badge-class="bg-primary/10 text-primary"
              >
                <div class="grid gap-5 sm:grid-cols-2">
                  <FormField label="Operation ID" for-id="operationId">
                    <input
                      id="operationId"
                      v-model.trim="form.operationId"
                      type="text"
                      :class="fieldClass"
                      placeholder="OP-2026-001"
                    />
                  </FormField>

                  <FormField label="Operation Code Name" for-id="operationCodeName">
                    <input
                      id="operationCodeName"
                      v-model.trim="form.operationCodeName"
                      type="text"
                      :class="fieldClass"
                      placeholder="Silent Falcon"
                    />
                  </FormField>

                  <FormField label="Operation Type" for-id="operationType">
                    <select
                      id="operationType"
                      v-model="form.operationType"
                      :class="fieldClass"
                    >
                      <option disabled value="">Select operation type</option>
                      <option
                        v-for="operationType in selectOptions.operationType"
                        :key="operationType"
                        :value="operationType"
                      >
                        {{ operationType }}
                      </option>
                    </select>
                  </FormField>

                  <FormField label="City / District" for-id="cityDistrict">
                    <input
                      id="cityDistrict"
                      v-model.trim="form.cityDistrict"
                      type="text"
                      :class="fieldClass"
                      placeholder="Quezon City District 2"
                    />
                  </FormField>

                  <FormField label="Objective" for-id="objective" wrapper-class="sm:col-span-2">
                    <textarea
                      id="objective"
                      v-model.trim="form.objective"
                      rows="3"
                      :class="fieldClass"
                      placeholder="State the mission objective and expected result"
                    />
                  </FormField>
                </div>
              </FormSection>

              <FormSection
                title="Date and Location"
                badge-text="Timeline"
                badge-class="bg-case-elevated text-gray-400"
              >
                <div class="grid gap-5 sm:grid-cols-2">
                  <FormField label="Planned Date / Time" for-id="plannedDateTime">
                    <input
                      id="plannedDateTime"
                      v-model="form.plannedDateTime"
                      type="datetime-local"
                      :class="fieldClass"
                    />
                  </FormField>

                  <FormField label="Actual Date / Time" for-id="actualDateTime">
                    <input
                      id="actualDateTime"
                      v-model="form.actualDateTime"
                      type="datetime-local"
                      :class="fieldClass"
                    />
                  </FormField>

                  <FormField label="Full Address" for-id="fullAddress" wrapper-class="sm:col-span-2">
                    <textarea
                      id="fullAddress"
                      v-model.trim="form.fullAddress"
                      rows="3"
                      :class="fieldClass"
                      placeholder="House number, street, barangay, city, province"
                    />
                  </FormField>
                </div>
              </FormSection>

              <FormSection
                title="Command Structure"
                badge-text="Leadership"
                badge-class="bg-cyan-900/20 text-cyan-400"
              >
                <div class="grid gap-5 sm:grid-cols-2">
                  <FormField label="Operation Commander" for-id="operationCommander">
                    <input
                      id="operationCommander"
                      v-model.trim="form.operationCommander"
                      type="text"
                      :class="fieldClass"
                      placeholder="Chief Insp. Maria Santos"
                    />
                  </FormField>

                  <FormField label="Team Leader" for-id="teamLeader">
                    <input
                      id="teamLeader"
                      v-model.trim="form.teamLeader"
                      type="text"
                      :class="fieldClass"
                      placeholder="SPO2 Juan Dela Cruz"
                    />
                  </FormField>
                </div>
              </FormSection>

              <button
                type="submit"
                class="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? "Saving operation..." : "Save operation" }}
              </button>
            </form>
          </section>
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
  import { nextTick } from "vue";
  import API from "@/services/api";
  import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
  import FormField from "@/components/FormField.vue";
  import FormSection from "@/components/FormSection.vue";
  import { createOperationConfirmationDialog } from "@/helper/operation-confirmation";
  import {
    createFormFromOperation,
    createInitialForm,
    fieldClass,
    selectOptions,
  } from "@/helper/operation-form";
  import { formatOperationMeta } from "@/helper/operation-meta";
  import {
    createConfirmationDialogState,
    resolveConfirmation,
  } from "@/helper/record-confirmation";

  export default {
    name: "OperationRegistration",
    components: {
      ConfirmationDialog,
      FormField,
      FormSection,
    },
    data() {
      return {
        form: createInitialForm(),
        selectedOperationId: "",
        isSubmitting: false,
        operations: [],
        operationSearch: "",
        isLoadingOperations: false,
        operationsError: "",
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
        fieldClass,
        selectOptions,
        message: {
          type: "",
          text: "",
        },
      };
    },
    computed: {
      isEditing() {
        return Boolean(this.selectedOperationId);
      },
      filteredOperations() {
        const keyword = this.operationSearch.toLowerCase();

        if (!keyword) {
          return this.operations;
        }

        return this.operations.filter((operation) => {
          const haystack = [
            operation.operationId,
            operation.operationCodeName,
            operation.operationType,
            operation.operationCommander,
            operation.teamLeader,
            operation.cityDistrict,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(keyword);
        });
      },
    },
    methods: {
      async setMessage(type, text) {
        this.message = { type, text };
        await nextTick();
        this.$refs.messageBanner?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      },
      async loadOperations() {
        this.isLoadingOperations = true;
        this.operationsError = "";

        try {
          const response = await API.get("/cases/operations");
          this.operations = Array.isArray(response.data) ? response.data : [];
        } catch (error) {
          this.operationsError =
            error.response?.data?.message ||
            "Unable to load operations right now.";
        } finally {
          this.isLoadingOperations = false;
        }
      },
      formatOperationMeta,
      selectOperation(operation, options = {}) {
        const { preserveMessage = false } = options;
        if (!preserveMessage) {
          this.message = { type: "", text: "" };
        }
        this.selectedOperationId = operation._id;
        this.form = createFormFromOperation(operation);
      },
      resetFormState(options = {}) {
        const { preserveMessage = false } = options;
        this.selectedOperationId = "";
        this.form = createInitialForm();
        if (!preserveMessage) {
          this.message = { type: "", text: "" };
        }
      },
      openConfirmationDialog() {
        this.confirmationDialog = createOperationConfirmationDialog(this.isEditing);

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
        this.message = { type: "", text: "" };

        if (
          !this.form.operationId ||
          !this.form.operationCodeName ||
          !this.form.operationType
        ) {
          await this.setMessage(
            "error",
            "Operation ID, operation code name, and operation type are required."
          );
          return;
        }

        const confirmed = await this.openConfirmationDialog();
        if (!confirmed) {
          return;
        }

        this.isSubmitting = true;

        try {
          const response = this.isEditing
            ? await API.put(`/cases/operations/${this.selectedOperationId}`, this.form)
            : await API.post("/cases/operations", this.form);

          const successMessage =
            response.data.message ||
            (this.isEditing
              ? "Operation updated successfully."
              : "Operation registration saved successfully.");

          await this.loadOperations();
          if (this.isEditing && response.data.operation) {
            this.selectOperation(response.data.operation, { preserveMessage: true });
          } else {
            this.resetFormState({ preserveMessage: true });
          }

          await this.setMessage("success", successMessage);
        } catch (error) {
          await this.setMessage(
            "error",
            error.response?.data?.message ||
              "Unable to save the operation right now."
          );
        } finally {
          this.isSubmitting = false;
        }
      },
    },
    mounted() {
      this.loadOperations();
    },
  };
</script>

<style scoped>
  .operations-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(217, 119, 6, 0.4) rgba(28, 31, 40, 0.6);
  }
  .operations-scrollbar::-webkit-scrollbar { width: 6px; }
  .operations-scrollbar::-webkit-scrollbar-track { background: #1c1f28; border-radius: 9999px; }
  .operations-scrollbar::-webkit-scrollbar-thumb { background: rgba(217, 119, 6, 0.5); border-radius: 9999px; }
  .operations-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(217, 119, 6, 0.8); }
</style>
