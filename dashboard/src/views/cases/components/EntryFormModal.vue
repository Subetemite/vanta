<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4"
      @click.self="close">

      <div class="relative w-full max-w-2xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">

        <!-- Header -->
        <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">{{ contextLabel }}</p>
            <h2 class="mt-1 text-lg font-semibold text-white">
              {{ isEditing ? "Edit Data Entry" : "New Data Entry" }}
            </h2>
          </div>
          <button @click="close" class="text-gray-500 hover:text-gray-200 transition-colors">
            <Icon icon="mdi:close" class="text-xl" />
          </button>
        </header>

        <!-- Body -->
        <div class="p-6 space-y-5">

          <!-- Category select -->
          <div v-if="categoryOptions.length">
            <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">
              Category <span class="text-primary">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="opt in categoryOptions"
                :key="opt.key"
                type="button"
                @click="form.subCategory = opt.key"
                class="rounded-lg border px-3 py-2.5 text-left text-xs transition-colors flex items-center gap-2"
                :class="form.subCategory === opt.key
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-case-border bg-case-card text-gray-300 hover:bg-case-elevated'">
                <Icon v-if="opt.icon" :icon="opt.icon" class="text-base flex-shrink-0" />
                <span class="truncate font-medium">{{ opt.title }}</span>
              </button>
            </div>
          </div>

          <!-- Scan / Upload -->
          <div>
            <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">
              Scan Document (PDF or Image)
            </label>
            <div
              class="rounded-lg border-2 border-dashed border-case-border bg-case-card p-5 transition-colors hover:border-primary/40"
              :class="{ 'border-primary/60 bg-primary/5': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onDrop">

              <div v-if="!file && !existingAttachment" class="text-center">
                <Icon icon="mdi:cloud-upload-outline" class="text-3xl text-gray-600 mx-auto" />
                <p class="text-xs text-gray-500 mt-2">Drop a PDF or image here, or</p>
                <div class="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    @click="$refs.fileInput.click()"
                    class="rounded-md border border-case-border bg-case-surface px-3 py-1.5 text-[11px] font-semibold text-gray-200 hover:bg-case-elevated transition-colors flex items-center gap-1.5">
                    <Icon icon="mdi:folder-open-outline" class="text-sm" /> Choose file
                  </button>
                  <button
                    type="button"
                    @click="$refs.cameraInput.click()"
                    class="rounded-md border border-case-border bg-case-surface px-3 py-1.5 text-[11px] font-semibold text-gray-200 hover:bg-case-elevated transition-colors flex items-center gap-1.5">
                    <Icon icon="mdi:camera-outline" class="text-sm" /> Scan with camera
                  </button>
                </div>
                <p class="text-[10px] text-gray-600 mt-3">PDFs &amp; images supported · max 5 MB · OCR + field analysis run automatically</p>
              </div>

              <div v-else class="flex items-start gap-3">
                <div class="flex-shrink-0">
                  <img v-if="previewUrl" :src="previewUrl" class="h-16 w-16 object-cover rounded-md border border-case-border" />
                  <div v-else class="h-16 w-16 rounded-md border border-case-border bg-case-elevated flex items-center justify-center">
                    <Icon icon="mdi:file-pdf-box" class="text-3xl text-primary" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-200 truncate">{{ file?.name || existingAttachment?.fileName || "Attached file" }}</p>
                  <p class="text-[11px] text-gray-500 mt-0.5">
                    <span v-if="file">{{ formatBytes(file.size) }} · {{ file.type || "unknown type" }}</span>
                    <a v-else-if="existingAttachment?.fileUrl" :href="existingAttachment.fileUrl" target="_blank" class="text-primary hover:underline">View attached file</a>
                  </p>
                  <div v-if="scanStatus === 'scanning'" class="mt-2 flex items-center gap-2 text-[11px] text-primary">
                    <Icon icon="mdi:loading" class="animate-spin" /> Scanning &amp; analyzing fields...
                  </div>
                  <div v-else-if="scanStatus === 'completed'" class="mt-2 flex items-center gap-2 text-[11px] text-emerald-400">
                    <Icon icon="mdi:check-circle-outline" />
                    Scan complete — {{ analyzedFieldCount }} field{{ analyzedFieldCount === 1 ? "" : "s" }} auto-filled
                  </div>
                  <div v-else-if="scanStatus === 'failed'" class="mt-2 flex items-center gap-2 text-[11px] text-red-400">
                    <Icon icon="mdi:alert-circle-outline" /> {{ scanError || "Scan failed" }}
                  </div>
                </div>
                <button
                  type="button"
                  @click="clearFile"
                  class="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0">
                  <Icon icon="mdi:close" class="text-base" />
                </button>
              </div>
              <input ref="fileInput" type="file" accept="application/pdf,image/*" class="hidden" @change="onFilePicked" />
              <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onFilePicked" />
            </div>

            <!-- Analyzed fields chips + document type + confidence -->
            <div v-if="appliedFields.length || organized" class="mt-3 flex flex-wrap items-center gap-1.5">
              <span v-if="organized?.documentType && organized.documentType !== 'unknown'"
                class="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-400 uppercase tracking-wide">
                {{ organized.documentType.replace(/-/g, " ") }}
              </span>
              <span v-if="organized?.confidence != null"
                class="rounded-full bg-case-elevated border border-case-border px-2 py-0.5 text-[10px] text-gray-400">
                {{ Math.round(organized.confidence * 100) }}% confidence
              </span>
              <span v-if="appliedFields.length" class="text-[10px] uppercase tracking-[0.2em] text-gray-600 ml-1">
                Auto-filled:
              </span>
              <span
                v-for="key in appliedFields"
                :key="key"
                class="rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[10px] text-primary">
                {{ fieldLabel(key) }}
              </span>
            </div>
          </div>

          <!-- Structured entities preview -->
          <div v-if="organized && hasEntities" class="rounded-lg bg-case-card border border-case-border overflow-hidden">
            <button
              type="button"
              @click="showEntities = !showEntities"
              class="w-full px-4 py-2.5 flex items-center justify-between hover:bg-case-elevated transition-colors">
              <div class="flex items-center gap-2">
                <Icon icon="mdi:database-outline" class="text-primary text-base" />
                <p class="text-xs font-semibold text-gray-200">Structured Data</p>
                <span class="text-[10px] text-gray-500">{{ entityCount }} entities detected</span>
              </div>
              <Icon :icon="showEntities ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="text-gray-500 text-base" />
            </button>
            <div v-if="showEntities" class="px-4 py-3 border-t border-case-border space-y-3 max-h-72 overflow-y-auto">
              <div v-if="organized.entities.persons?.length">
                <p class="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Persons</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="(p, i) in organized.entities.persons.slice(0, 8)" :key="i"
                    class="rounded-md bg-case-elevated px-2 py-0.5 text-[11px] text-gray-300">
                    {{ p.full || p.name }}
                  </span>
                </div>
              </div>
              <div v-if="organized.entities.organizations?.length">
                <p class="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Agencies / Organizations</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="(org, i) in organized.entities.organizations" :key="i"
                    class="rounded-md bg-case-elevated px-2 py-0.5 text-[11px] text-gray-300">
                    {{ org }}
                  </span>
                </div>
              </div>
              <div v-if="organized.entities.locations?.length">
                <p class="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Locations</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="(loc, i) in organized.entities.locations" :key="i"
                    class="rounded-md bg-case-elevated px-2 py-0.5 text-[11px] text-gray-300">
                    {{ loc }}
                  </span>
                </div>
              </div>
              <div v-if="organized.entities.dates?.length">
                <p class="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Dates</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="(d, i) in organized.entities.dates" :key="i"
                    class="rounded-md bg-case-elevated px-2 py-0.5 text-[11px] text-gray-300">
                    {{ d.date }}
                  </span>
                </div>
              </div>
              <div v-if="organized.entities.monetary?.length">
                <p class="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Monetary Values</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="(m, i) in organized.entities.monetary" :key="i"
                    class="rounded-md bg-case-elevated px-2 py-0.5 text-[11px] text-emerald-300">
                    {{ m.currency }} {{ m.amount.toLocaleString() }}
                  </span>
                </div>
              </div>
              <div v-if="organized.entities.ids?.length">
                <p class="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Identifiers</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="(id, i) in organized.entities.ids" :key="i"
                    class="rounded-md bg-case-elevated px-2 py-0.5 text-[11px] text-gray-300">
                    <span class="text-gray-500">{{ id.type }}:</span> {{ id.value }}
                  </span>
                </div>
              </div>
              <div v-if="organized.actionItems?.length">
                <p class="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Action Items</p>
                <ul class="text-[11px] text-gray-400 space-y-1 list-disc list-inside">
                  <li v-for="(item, i) in organized.actionItems.slice(0, 6)" :key="i" class="line-clamp-2">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">
              Title <span class="text-primary">*</span>
            </label>
            <input
              v-model.trim="form.title"
              type="text"
              placeholder="e.g. Apprehension report — Manila Pier 4"
              class="w-full rounded-md border border-case-border bg-case-card px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Reference No.</label>
              <input
                v-model.trim="form.referenceNo"
                type="text"
                placeholder="e.g. ES-2026-0001"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Lead Agency</label>
              <input
                v-model.trim="form.leadAgency"
                type="text"
                placeholder="e.g. PNP-CIDG"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Location</label>
              <input
                v-model.trim="form.location"
                type="text"
                placeholder="e.g. Quezon City"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Occurred At</label>
              <input
                v-model="form.occurredAt"
                type="date"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2.5 text-sm text-gray-200 focus:border-primary focus:outline-none transition-colors" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Status</label>
              <select
                v-model="form.status"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2.5 text-sm text-gray-200 focus:border-primary focus:outline-none transition-colors">
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Priority</label>
              <select
                v-model="form.priority"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2.5 text-sm text-gray-200 focus:border-primary focus:outline-none transition-colors">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">
              Description / Notes
            </label>
            <textarea
              v-model="form.description"
              rows="5"
              placeholder="Auto-filled from scanned document. You can edit before saving."
              class="w-full rounded-md border border-case-border bg-case-card px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors resize-y"></textarea>
          </div>

          <div v-if="extractedTextSnippet" class="rounded-md bg-case-card border border-case-border p-3">
            <div class="flex items-center justify-between mb-1">
              <p class="text-[10px] uppercase tracking-[0.2em] text-gray-500">Extracted text</p>
              <button type="button" @click="showExtractedText = !showExtractedText" class="text-[10px] text-primary hover:underline">
                {{ showExtractedText ? "Hide" : "Show" }}
              </button>
            </div>
            <pre v-if="showExtractedText" class="text-[11px] text-gray-400 whitespace-pre-wrap max-h-40 overflow-y-auto">{{ extractedTextSnippet }}</pre>
          </div>

          <div v-if="submitError" class="rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">
            {{ submitError }}
          </div>
        </div>

        <!-- Footer -->
        <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
          <button
            v-if="isEditing"
            type="button"
            @click="confirmDelete"
            :disabled="submitting"
            class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-50 flex items-center gap-2">
            <Icon icon="mdi:trash-can-outline" /> Delete
          </button>
          <span v-else></span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="close"
              class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated transition-colors">
              Cancel
            </button>
            <button
              type="button"
              :disabled="!canSubmit"
              @click="submit"
              class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <Icon v-if="submitting" icon="mdi:loading" class="animate-spin" />
              <Icon v-else :icon="isEditing ? 'mdi:content-save-edit-outline' : 'mdi:content-save-outline'" />
              {{ submitting ? "Saving..." : (isEditing ? "Update Entry" : "Save Entry") }}
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";
  import { dialog } from "@/services/dialog";

  function emptyForm() {
    return {
      subCategory: "",
      title: "",
      referenceNo: "",
      leadAgency: "",
      location: "",
      occurredAt: "",
      status: "open",
      priority: "normal",
      description: "",
      tags: [],
    };
  }

  const FIELD_LABELS = {
    title: "title",
    referenceNo: "ref no",
    leadAgency: "agency",
    location: "location",
    occurredAt: "date",
    status: "status",
    priority: "priority",
    description: "description",
    tags: "tags",
  };

  function toDateInput(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }

  export default {
    name: "EntryFormModal",
    components: { Icon },
    props: {
      open: { type: Boolean, default: false },
      category: { type: String, required: true },
      contextLabel: { type: String, default: "Case Management" },
      categoryOptions: { type: Array, default: () => [] },
      defaultSubCategory: { type: String, default: "" },
      entry: { type: Object, default: null }, // pass entry to enable edit mode
    },
    emits: ["close", "saved", "deleted"],
    data() {
      return {
        form: emptyForm(),
        file: null,
        previewUrl: "",
        uploadedFile: null,
        existingAttachment: null,
        scanStatus: "idle",
        scanError: "",
        appliedFields: [],
        extractedText: "",
        cleanedText: "",
        organized: null,
        showExtractedText: false,
        showEntities: true,
        isDragging: false,
        submitting: false,
        submitError: "",
      };
    },
    computed: {
      isEditing() {
        return Boolean(this.entry?._id);
      },
      canSubmit() {
        if (this.submitting) return false;
        if (!this.form.title.trim()) return false;
        if (this.categoryOptions.length && !this.form.subCategory) return false;
        return true;
      },
      analyzedFieldCount() {
        return this.appliedFields.length;
      },
      extractedTextSnippet() {
        return this.cleanedText || (this.extractedText ? this.extractedText.slice(0, 1500) : "");
      },
      hasEntities() {
        const e = this.organized?.entities;
        if (!e) return false;
        return Boolean(
          e.persons?.length ||
          e.organizations?.length ||
          e.locations?.length ||
          e.dates?.length ||
          e.monetary?.length ||
          e.ids?.length ||
          this.organized?.actionItems?.length
        );
      },
      entityCount() {
        const e = this.organized?.entities;
        if (!e) return 0;
        return (
          (e.persons?.length || 0) +
          (e.organizations?.length || 0) +
          (e.locations?.length || 0) +
          (e.dates?.length || 0) +
          (e.monetary?.length || 0) +
          (e.ids?.length || 0)
        );
      },
    },
    watch: {
      open(value) {
        if (value) this.reset();
      },
      entry() {
        if (this.open) this.reset();
      },
    },
    methods: {
      fieldLabel(key) {
        return FIELD_LABELS[key] || key;
      },
      reset() {
        this.submitting = false;
        this.submitError = "";
        this.appliedFields = [];
        this.extractedText = "";
        this.cleanedText = "";
        this.organized = null;
        this.showExtractedText = false;
        this.showEntities = true;
        this.scanStatus = "idle";
        this.scanError = "";
        this.uploadedFile = null;
        this.file = null;
        this.previewUrl = "";

        if (this.isEditing) {
          this.form = {
            ...emptyForm(),
            ...this.entry,
            occurredAt: toDateInput(this.entry.occurredAt),
            tags: Array.isArray(this.entry.tags) ? this.entry.tags : [],
          };
          this.existingAttachment = this.entry.attachments?.[0] || null;
        } else {
          this.form = emptyForm();
          this.form.subCategory = this.defaultSubCategory || this.categoryOptions[0]?.key || "";
          this.existingAttachment = null;
        }
      },
      close() {
        if (this.submitting) return;
        this.$emit("close");
      },
      formatBytes(bytes) {
        if (!bytes) return "0 B";
        const units = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
      },
      clearFile() {
        if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
        this.file = null;
        this.previewUrl = "";
        this.uploadedFile = null;
        this.existingAttachment = null;
        this.scanStatus = "idle";
        this.scanError = "";
        this.appliedFields = [];
        this.extractedText = "";
        this.cleanedText = "";
        this.organized = null;
        if (this.$refs.fileInput) this.$refs.fileInput.value = "";
        if (this.$refs.cameraInput) this.$refs.cameraInput.value = "";
      },
      onFilePicked(event) {
        const file = event.target.files?.[0];
        if (file) this.handleFile(file);
      },
      onDrop(event) {
        this.isDragging = false;
        const file = event.dataTransfer?.files?.[0];
        if (file) this.handleFile(file);
      },
      async handleFile(file) {
        if (file.size > 5 * 1024 * 1024) {
          this.scanStatus = "failed";
          this.scanError = "File exceeds 5 MB limit.";
          return;
        }
        this.file = file;
        this.previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
        this.existingAttachment = null;
        await this.scanFile(file);
      },
      async scanFile(file) {
        this.scanStatus = "scanning";
        this.scanError = "";
        try {
          const base64 = await this.toBase64(file);
          const res = await API.post("/files", {
            fileName: file.name,
            mimeType: file.type,
            contentBase64: base64,
          });
          this.uploadedFile = res.data?.file || null;
          this.extractedText = this.uploadedFile?.extractedText || this.uploadedFile?.extractedTextPreview || "";
          this.cleanedText = this.uploadedFile?.cleanedText || "";
          this.organized = this.uploadedFile?.organized || null;
          this.applyAnalyzedFields(this.organized?.suggestedFields || this.uploadedFile?.analyzedFields || {});
          this.scanStatus = this.uploadedFile?.extractionStatus === "failed" ? "failed" : "completed";
          if (this.scanStatus === "failed") {
            this.scanError = this.uploadedFile?.extractionError || "OCR failed";
          }
        } catch (err) {
          this.scanStatus = "failed";
          this.scanError = err.response?.data?.message || "Unable to scan the document.";
        }
      },
      applyAnalyzedFields(fields) {
        const applied = [];
        const isEmpty = (v) => v == null || v === "" || (Array.isArray(v) && v.length === 0);

        for (const [key, value] of Object.entries(fields)) {
          if (key === "coordinatingAgencies") continue; // skip multi-agency for now
          if (key === "occurredAt" || key === "reportedAt") {
            const dateStr = toDateInput(value);
            if (dateStr && isEmpty(this.form.occurredAt)) {
              this.form.occurredAt = dateStr;
              if (!applied.includes("occurredAt")) applied.push("occurredAt");
            }
            continue;
          }
          if (key === "tags" && Array.isArray(value) && value.length) {
            const merged = Array.from(new Set([...(this.form.tags || []), ...value]));
            this.form.tags = merged;
            applied.push("tags");
            continue;
          }
          if (Object.prototype.hasOwnProperty.call(this.form, key) && isEmpty(this.form[key])) {
            this.form[key] = value;
            applied.push(key);
          }
        }

        // Fold extracted text into description if empty
        if (this.extractedText && isEmpty(this.form.description)) {
          this.form.description = this.extractedText.slice(0, 2000);
          if (!applied.includes("description")) applied.push("description");
        }

        this.appliedFields = applied;
      },
      toBase64(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            resolve(String(dataUrl).split(",")[1] || "");
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      },
      buildPayload() {
        const payload = { ...this.form };
        // Convert occurredAt back to ISO if set
        if (payload.occurredAt) {
          const d = new Date(payload.occurredAt);
          payload.occurredAt = isNaN(d.getTime()) ? null : d.toISOString();
        } else {
          payload.occurredAt = null;
        }

        // Attachments: prefer freshly uploaded, fall back to existing
        let attachments = [];
        if (this.uploadedFile) {
          attachments = [{
            fileName: this.uploadedFile.originalName,
            fileUrl: this.uploadedFile.url,
            mimeType: this.uploadedFile.mimeType,
            size: this.uploadedFile.size,
          }];
        } else if (this.existingAttachment) {
          attachments = [this.existingAttachment];
        }
        payload.attachments = attachments;

        return payload;
      },
      async submit() {
        if (!this.canSubmit) return;

        // Confirmation prompt for updates (creating goes through directly).
        if (this.isEditing) {
          const ok = await dialog.confirm({
            title: "Update this entry?",
            description: `Save changes to "${this.form.title || this.entry?.title || "this entry"}"?`,
            confirmText: "Save changes",
            confirmIcon: "mdi:content-save-outline",
            cancelText: "Keep editing",
            tone: "primary",
            icon: "mdi:pencil-outline",
          });
          if (!ok) return;
        }

        this.submitting = true;
        this.submitError = "";
        try {
          const payload = this.buildPayload();
          let res;
          if (this.isEditing) {
            res = await API.put(`/cases/entries/${this.category}/${this.entry._id}`, payload);
          } else {
            res = await API.post(`/cases/entries/${this.category}`, payload);
          }
          this.$emit("saved", res.data?.entry);
          this.$emit("close");
          dialog.success(this.isEditing ? "Entry updated successfully." : "Entry created successfully.");
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to save the entry.";
        } finally {
          this.submitting = false;
        }
      },
      async confirmDelete() {
        if (!this.isEditing) return;

        const ok = await dialog.confirm({
          title: "Delete this entry?",
          description: "This action cannot be undone. Any uploaded attachments tied to this entry will also be removed.",
          details: this.entry?.title || "",
          confirmText: "Delete",
          confirmIcon: "mdi:trash-can-outline",
          cancelText: "Keep entry",
          tone: "danger",
        });
        if (!ok) return;

        this.submitting = true;
        this.submitError = "";
        try {
          await API.delete(`/cases/entries/${this.category}/${this.entry._id}`);
          this.$emit("deleted", this.entry._id);
          this.$emit("close");
          dialog.success("Entry deleted.");
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to delete the entry.";
          dialog.error(this.submitError);
        } finally {
          this.submitting = false;
        }
      },
    },
    beforeUnmount() {
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    },
  };
</script>
