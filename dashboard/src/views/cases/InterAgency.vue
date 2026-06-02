<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Case Management</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Inter-Agency Coordinations</h1>
        <p class="mt-1 text-xs text-gray-500 max-w-2xl">
          Joint operations, MOAs, intelligence-sharing and liaison activity with partner agencies.
        </p>
      </div>
      <div class="flex gap-2">
        <button v-if="activeTab === 'log'" @click="openCreate"
          class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Icon icon="mdi:plus" class="text-base" /> New Data Entry
        </button>
        <button v-else @click="openFolderCreate"
          class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Icon icon="mdi:folder-plus-outline" class="text-base" /> New Case Folder
        </button>
      </div>
    </header>

    <!-- Tabs -->
    <div class="border-b border-case-border">
      <div class="flex flex-wrap gap-1">
        <button v-for="t in tabs" :key="t.key" @click="activeTab = t.key" type="button"
          class="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors border-b-2 -mb-px flex items-center gap-2"
          :class="activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'">
          <Icon :icon="t.icon" /> {{ t.label }}
        </button>
      </div>
    </div>

    <!-- ============================== LOG TAB ============================== -->
    <template v-if="activeTab === 'log'">
      <EntryFormModal
        :open="showModal"
        category="inter-agency"
        context-label="Inter-Agency Coordinations"
        :category-options="[]"
        :entry="editingEntry"
        @close="closeModal"
        @saved="onEntrySaved"
        @deleted="onEntryDeleted" />

      <div class="flex items-center gap-3">
        <div class="relative flex-1 max-w-md">
          <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
          <input v-model="searchQuery" @input="onSearchInput" type="text"
            placeholder="Search coordinations by title, agency..."
            class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
        </div>
        <span v-if="searchQuery" class="text-[10px] text-gray-600">
          {{ entries.length }} match{{ entries.length === 1 ? "" : "es" }}
        </span>
      </div>

      <section class="bg-case-surface border border-case-border rounded-xl">
        <header class="flex items-center justify-between border-b border-case-border px-5 py-3">
          <h2 class="text-sm font-semibold text-white">Coordination Log</h2>
          <Icon icon="bi:three-dots-vertical" class="text-gray-700" />
        </header>
        <div class="p-5">
          <div v-if="loading" class="space-y-2">
            <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded-lg bg-case-elevated"></div>
          </div>
          <div v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</div>
          <div v-else-if="entries.length" class="space-y-2">
            <article v-for="entry in entries" :key="entry._id" @click="openEdit(entry)"
              class="rounded-lg border border-case-border bg-case-card p-4 hover:bg-case-elevated transition-colors cursor-pointer">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-semibold text-gray-200 truncate">{{ entry.title }}</p>
                    <Icon v-if="entry.attachments?.length" icon="mdi:paperclip" class="text-primary text-sm flex-shrink-0" />
                  </div>
                  <p class="text-[11px] text-gray-500 mt-1">
                    Lead: <span class="text-gray-400">{{ entry.leadAgency || "—" }}</span>
                    <span v-if="entry.coordinatingAgencies?.length" class="ml-2">
                      · with <span class="text-gray-400">{{ entry.coordinatingAgencies.join(", ") }}</span>
                    </span>
                  </p>
                  <p v-if="entry.description" class="text-[11px] text-gray-500 mt-2 line-clamp-2">{{ entry.description }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <span class="rounded-full bg-case-elevated px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">
                    {{ entry.status || "open" }}
                  </span>
                  <p class="mt-2 text-[11px] text-gray-600">{{ formatDate(entry.createdAt) }}</p>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="py-12 flex flex-col items-center justify-center text-center">
            <Icon icon="mdi:account-group-outline" class="text-3xl text-gray-700 mb-2" />
            <p class="text-xs text-gray-500">
              {{ searchQuery ? `No entries match "${searchQuery}".` : "No inter-agency coordinations recorded yet." }}
            </p>
          </div>
        </div>
      </section>
    </template>

    <!-- =========================== FOLDERS TAB ============================ -->
    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">

        <!-- LEFT: folder list -->
        <aside class="bg-case-surface border border-case-border rounded-xl flex flex-col min-h-[60vh]">
          <div class="border-b border-case-border p-4 space-y-3">
            <div class="relative">
              <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
              <input v-model="folderSearch" @input="onFolderSearchInput" type="text"
                placeholder="Search folders..."
                class="w-full rounded-md border border-case-border bg-case-card pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
            </div>
            <div class="flex items-center justify-between">
              <p class="text-[10px] uppercase tracking-[0.25em] text-gray-600">{{ folders.length }} folder{{ folders.length === 1 ? "" : "s" }}</p>
              <select v-model="folderStatusFilter" @change="loadFolders"
                class="rounded-md border border-case-border bg-case-card px-2 py-1 text-[10px] uppercase tracking-wide text-gray-300 focus:border-primary focus:outline-none">
                <option value="">All</option>
                <option v-for="s in FOLDER_STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            <div v-if="foldersLoading" class="space-y-2 p-2">
              <div v-for="i in 5" :key="i" class="h-14 animate-pulse rounded-md bg-case-elevated"></div>
            </div>
            <div v-else-if="!folders.length" class="py-10 text-center">
              <Icon icon="mdi:folder-outline" class="text-3xl text-gray-700 mb-2 mx-auto" />
              <p class="text-xs text-gray-500 px-4">{{ folderSearch ? "No folders match." : "Create a case folder to upload related files." }}</p>
              <button v-if="!folderSearch" @click="openFolderCreate" class="mt-3 text-xs text-primary hover:underline">Create the first folder</button>
            </div>
            <button v-for="f in folders" :key="f.id" @click="selectFolder(f)" type="button"
              class="w-full text-left rounded-md p-3 mb-1.5 border border-transparent hover:bg-case-card transition-colors"
              :class="selectedFolder?.id === f.id ? 'border-primary/40 bg-case-card' : ''">
              <div class="flex items-start gap-2.5">
                <Icon icon="mdi:folder" class="text-xl flex-shrink-0 mt-0.5"
                  :style="{ color: f.color || 'var(--folder-fallback-color, #D97706)' }" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-200 truncate">{{ f.name }}</p>
                  <p v-if="f.referenceNo" class="text-[10px] text-gray-600 font-mono truncate">{{ f.referenceNo }}</p>
                  <p class="text-[10px] text-gray-500 mt-0.5">
                    <Icon icon="mdi:file-multiple-outline" class="inline" /> {{ f.fileCount }} file{{ f.fileCount === 1 ? "" : "s" }}
                    <span class="ml-2 rounded-full bg-case-elevated px-1.5 py-px text-[9px] uppercase tracking-wide" :class="statusBadgeClass(f.status)">{{ f.status }}</span>
                  </p>
                </div>
              </div>
            </button>
          </div>
        </aside>

        <!-- RIGHT: folder detail -->
        <section class="bg-case-surface border border-case-border rounded-xl min-h-[60vh] flex flex-col">
          <div v-if="!selectedFolder" class="flex-1 flex flex-col items-center justify-center text-center p-10">
            <Icon icon="mdi:folder-search-outline" class="text-4xl text-gray-700 mb-3" />
            <p class="text-sm text-gray-400">Select a folder to view its files.</p>
            <p class="text-xs text-gray-600 mt-1">Each upload is automatically scanned (PDF + image OCR) and saved to the database.</p>
          </div>

          <template v-else>
            <header class="flex items-start justify-between gap-4 border-b border-case-border p-5">
              <div class="min-w-0">
                <p class="text-[10px] uppercase tracking-[0.25em] text-gray-600">Case Folder</p>
                <h2 class="mt-1 text-lg font-semibold text-white">{{ selectedFolder.name }}</h2>
                <p class="mt-1 text-xs text-gray-500">
                  <span v-if="selectedFolder.referenceNo" class="font-mono mr-2">{{ selectedFolder.referenceNo }}</span>
                  <span v-if="selectedFolder.leadAgency">Lead: <span class="text-gray-400">{{ selectedFolder.leadAgency }}</span></span>
                  <span v-if="selectedFolder.coordinatingAgencies?.length" class="ml-2">· with <span class="text-gray-400">{{ selectedFolder.coordinatingAgencies.join(", ") }}</span></span>
                </p>
                <p v-if="selectedFolder.description" class="mt-1 text-xs text-gray-500">{{ selectedFolder.description }}</p>
              </div>
              <div class="flex flex-col items-end gap-2 flex-shrink-0">
                <span class="rounded-full bg-case-elevated px-2 py-0.5 text-[10px] uppercase tracking-wide" :class="statusBadgeClass(selectedFolder.status)">{{ selectedFolder.status }}</span>
                <div class="flex gap-2">
                  <button @click="openFolderEdit(selectedFolder)" type="button"
                    class="rounded-md border border-case-border bg-case-card px-2.5 py-1.5 text-[11px] text-gray-300 hover:bg-case-elevated transition-colors flex items-center gap-1">
                    <Icon icon="mdi:pencil-outline" /> Edit
                  </button>
                  <button @click="confirmFolderDelete(selectedFolder)" type="button"
                    class="rounded-md border border-red-900/40 bg-red-950/20 px-2.5 py-1.5 text-[11px] text-red-400 hover:bg-red-950/40 transition-colors flex items-center gap-1">
                    <Icon icon="mdi:trash-can-outline" /> Delete
                  </button>
                </div>
              </div>
            </header>

            <!-- Drag/drop uploader -->
            <div class="p-5 border-b border-case-border">
              <div @dragover.prevent="dragOver = true" @dragleave.prevent="dragOver = false"
                @drop.prevent="onDrop"
                :class="dragOver ? 'border-primary bg-primary/5' : 'border-case-border bg-case-card'"
                class="rounded-lg border-2 border-dashed transition-colors p-5 flex flex-col items-center justify-center text-center">
                <Icon icon="mdi:cloud-upload-outline" class="text-3xl text-primary mb-2" />
                <p class="text-sm text-gray-300">Drop files here, or
                  <button @click="$refs.fileInput.click()" type="button" class="text-primary hover:underline">browse</button>
                </p>
                <p class="text-[10px] text-gray-600 mt-1">PDF, images, and documents up to 10 MB. PDFs and images are auto-scanned (OCR).</p>
                <input ref="fileInput" type="file" multiple class="hidden" @change="onFilesPicked" />
              </div>

              <!-- Upload queue -->
              <div v-if="uploadQueue.length" class="mt-4 space-y-2">
                <div v-for="(u, idx) in uploadQueue" :key="u.id"
                  class="rounded-md border border-case-border bg-case-card px-3 py-2 flex items-center gap-3 text-xs">
                  <Icon :icon="iconForFile(u.name)" class="text-base flex-shrink-0" :class="u.error ? 'text-red-400' : 'text-primary'" />
                  <div class="flex-1 min-w-0">
                    <p class="text-gray-200 truncate">{{ u.name }}</p>
                    <p class="text-[10px]" :class="u.error ? 'text-red-400' : 'text-gray-500'">
                      <span v-if="u.error">Failed: {{ u.error }}</span>
                      <span v-else-if="u.status === 'scanning'">Scanning content (OCR)...</span>
                      <span v-else-if="u.status === 'uploading'">Uploading...</span>
                      <span v-else-if="u.status === 'done'">Saved · {{ humanSize(u.size) }}</span>
                    </p>
                  </div>
                  <Icon v-if="u.status === 'scanning' || u.status === 'uploading'" icon="mdi:loading" class="text-base text-primary animate-spin" />
                  <Icon v-else-if="u.status === 'done'" icon="mdi:check-circle" class="text-base text-emerald-400" />
                  <button v-else-if="u.error" @click="uploadQueue.splice(idx, 1)" type="button" class="text-gray-500 hover:text-gray-300">
                    <Icon icon="mdi:close" />
                  </button>
                </div>
              </div>
            </div>

            <!-- File list -->
            <div class="flex-1 overflow-y-auto p-5 space-y-2">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-sm font-semibold text-gray-200">Files ({{ folderFiles.length }})</h3>
                <div class="relative flex-1 max-w-xs">
                  <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
                  <input v-model="fileSearch" @input="onFileSearchInput" type="text" placeholder="Search file content..."
                    class="w-full rounded-md border border-case-border bg-case-card pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div v-if="filesLoading" class="space-y-2">
                <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-md bg-case-elevated"></div>
              </div>
              <div v-else-if="!folderFiles.length" class="py-10 text-center">
                <Icon icon="mdi:file-search-outline" class="text-3xl text-gray-700 mb-2 mx-auto" />
                <p class="text-xs text-gray-500">{{ fileSearch ? "No files match the search." : "No files uploaded yet." }}</p>
              </div>

              <article v-for="file in folderFiles" :key="file.id"
                class="rounded-md border border-case-border bg-case-card hover:bg-case-elevated transition-colors">
                <div class="p-3 flex items-start gap-3">
                  <Icon :icon="iconForFile(file.originalName)" class="text-2xl text-primary flex-shrink-0 mt-0.5" />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <a :href="file.url" target="_blank" rel="noopener" class="text-sm font-medium text-gray-200 hover:text-primary truncate">{{ file.originalName }}</a>
                      <span class="rounded-full px-1.5 py-px text-[9px] uppercase tracking-wide" :class="extractionBadgeClass(file.extractionStatus)">
                        {{ extractionLabel(file.extractionStatus) }}
                      </span>
                    </div>
                    <p class="text-[10px] text-gray-500 mt-0.5">
                      {{ humanSize(file.size) }} · {{ formatDate(file.createdAt) }}
                      <span v-if="file.uploadedBy?.username"> · uploaded by {{ file.uploadedBy.username }}</span>
                    </p>
                    <p v-if="file.extractedTextPreview" class="mt-2 text-[11px] text-gray-400 line-clamp-2">
                      {{ file.extractedTextPreview }}
                    </p>
                    <p v-else-if="file.extractionStatus === 'failed'" class="mt-2 text-[10px] text-red-400">
                      {{ file.extractionError || "Scan failed." }}
                    </p>
                  </div>
                  <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <button v-if="file.extractedTextLength" @click="openTextViewer(file)" type="button"
                      class="text-[11px] text-primary hover:underline whitespace-nowrap">View text</button>
                    <button @click="confirmFileDelete(file)" type="button"
                      class="text-[11px] text-red-400 hover:underline">Delete</button>
                  </div>
                </div>
              </article>
            </div>
          </template>
        </section>
      </div>
    </template>

    <!-- Folder create/edit modal -->
    <Teleport to="body">
      <div v-if="showFolderModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeFolderModal">
        <div class="relative w-full max-w-xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ folderForm._id ? "Edit Folder" : "New Case Folder" }}</h2>
            <button @click="closeFolderModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Folder Name <span class="text-primary">*</span></label>
              <input v-model.trim="folderForm.name" type="text" placeholder="e.g. Joint Op vs. POGO Hub - Pasay"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Reference No.</label>
              <input v-model.trim="folderForm.referenceNo" type="text" placeholder="e.g. IAC-2026-014"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 font-mono focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Status</label>
              <select v-model="folderForm.status"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="s in FOLDER_STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Lead Agency</label>
              <input v-model.trim="folderForm.leadAgency" type="text"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Coordinating Agencies (comma-separated)</label>
              <input v-model="folderForm.coordinatingAgenciesText" type="text" placeholder="PNP, NBI, AMLC"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Description</label>
              <textarea v-model="folderForm.description" rows="3"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div v-if="folderError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ folderError }}</div>
          </div>
          <footer class="flex items-center justify-end gap-2 border-t border-case-border px-6 py-4">
            <button @click="closeFolderModal" type="button" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated transition-colors">Cancel</button>
            <button @click="submitFolder" type="button" :disabled="!folderForm.name?.trim() || folderSubmitting"
              class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              <Icon v-if="folderSubmitting" icon="mdi:loading" class="animate-spin" />
              <Icon v-else icon="mdi:content-save-outline" />
              {{ folderSubmitting ? "Saving..." : (folderForm._id ? "Update" : "Create") }}
            </button>
          </footer>
        </div>
      </div>
    </Teleport>

    <!-- Extracted text viewer modal -->
    <Teleport to="body">
      <div v-if="textViewer.open" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeTextViewer">
        <div class="relative w-full max-w-3xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-[0.25em] text-gray-600">Extracted Content</p>
              <h2 class="text-base font-semibold text-white truncate">{{ textViewer.fileName }}</h2>
            </div>
            <button @click="closeTextViewer" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6">
            <p v-if="textViewer.loading" class="text-xs text-gray-500">Loading extracted text...</p>
            <pre v-else-if="textViewer.text" class="whitespace-pre-wrap text-xs text-gray-300 max-h-[60vh] overflow-y-auto bg-case-card border border-case-border rounded-md p-4">{{ textViewer.text }}</pre>
            <p v-else class="text-xs text-gray-500">No extracted text available.</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";
  import { dialog } from "@/services/dialog";
  import EntryFormModal from "./components/EntryFormModal.vue";

  const FOLDER_STATUSES = ["open", "active", "archived", "closed"];

  function emptyFolderForm() {
    return {
      _id: null,
      name: "",
      referenceNo: "",
      description: "",
      leadAgency: "",
      coordinatingAgenciesText: "",
      status: "open",
    };
  }

  let queueId = 0;

  export default {
    name: "InterAgency",
    components: { Icon, EntryFormModal },
    data() {
      return {
        FOLDER_STATUSES,
        activeTab: "log",
        tabs: [
          { key: "log", label: "Coordination Log", icon: "mdi:format-list-bulleted" },
          { key: "folders", label: "Case Folders", icon: "mdi:folder-multiple-outline" },
        ],

        // Log
        entries: [],
        loading: false,
        error: "",
        showModal: false,
        editingEntry: null,
        searchQuery: "",
        searchDebounce: null,

        // Folders
        folders: [],
        foldersLoading: false,
        folderSearch: "",
        folderSearchDebounce: null,
        folderStatusFilter: "",
        selectedFolder: null,
        folderFiles: [],
        filesLoading: false,
        fileSearch: "",
        fileSearchDebounce: null,

        // Folder modal
        showFolderModal: false,
        folderForm: emptyFolderForm(),
        folderSubmitting: false,
        folderError: "",

        // Upload queue
        uploadQueue: [],
        dragOver: false,

        // Text viewer
        textViewer: { open: false, fileName: "", text: "", loading: false },
      };
    },
    watch: {
      activeTab(val) {
        if (val === "folders" && !this.folders.length) this.loadFolders();
      },
    },
    methods: {
      formatDate(d) {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      },
      humanSize(bytes) {
        const b = Number(bytes) || 0;
        if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / (1024 * 1024)).toFixed(1)} MB`;
      },
      iconForFile(name = "") {
        const ext = (name.split(".").pop() || "").toLowerCase();
        if (["pdf"].includes(ext)) return "mdi:file-pdf-box";
        if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff"].includes(ext)) return "mdi:file-image-outline";
        if (["doc", "docx"].includes(ext)) return "mdi:file-word-box";
        if (["xls", "xlsx", "csv"].includes(ext)) return "mdi:file-excel-box";
        if (["txt", "md"].includes(ext)) return "mdi:file-document-outline";
        return "mdi:file-outline";
      },
      statusBadgeClass(status) {
        const map = {
          open: "text-sky-400",
          active: "text-emerald-400",
          archived: "text-gray-500",
          closed: "text-gray-500",
        };
        return map[status] || "text-gray-400";
      },
      extractionBadgeClass(status) {
        const map = {
          completed: "bg-emerald-950/40 text-emerald-400",
          pending: "bg-amber-950/40 text-amber-400",
          failed: "bg-red-950/40 text-red-400",
          not_applicable: "bg-case-elevated text-gray-500",
        };
        return map[status] || "bg-case-elevated text-gray-400";
      },
      extractionLabel(status) {
        const map = { completed: "scanned", pending: "scanning", failed: "scan failed", not_applicable: "no scan" };
        return map[status] || status || "unknown";
      },

      // ===== LOG =====
      async load() {
        this.loading = true;
        this.error = "";
        try {
          const params = {};
          if (this.searchQuery.trim()) params.q = this.searchQuery.trim();
          const queryString = new URLSearchParams(params).toString();
          const url = `/cases/entries/inter-agency${queryString ? `?${queryString}` : ""}`;
          const res = await API.get(url);
          this.entries = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load inter-agency coordinations.";
        } finally {
          this.loading = false;
        }
      },
      onSearchInput() {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => this.load(), 300);
      },
      openCreate() { this.editingEntry = null; this.showModal = true; },
      openEdit(entry) { this.editingEntry = entry; this.showModal = true; },
      closeModal() { this.showModal = false; this.editingEntry = null; },
      onEntrySaved(entry) {
        if (!entry) { this.load(); return; }
        const idx = this.entries.findIndex((e) => e._id === entry._id);
        if (idx >= 0) this.entries.splice(idx, 1, entry);
        else this.entries.unshift(entry);
      },
      onEntryDeleted(id) { this.entries = this.entries.filter((e) => e._id !== id); },

      // ===== FOLDERS =====
      async loadFolders() {
        this.foldersLoading = true;
        try {
          const params = new URLSearchParams();
          if (this.folderSearch.trim()) params.set("q", this.folderSearch.trim());
          if (this.folderStatusFilter) params.set("status", this.folderStatusFilter);
          const res = await API.get(`/cases/folders/inter-agency${params.toString() ? `?${params}` : ""}`);
          this.folders = Array.isArray(res.data) ? res.data : [];
          if (this.selectedFolder) {
            const stillExists = this.folders.find((f) => f.id === this.selectedFolder.id);
            if (!stillExists) this.selectedFolder = null;
            else Object.assign(this.selectedFolder, stillExists);
          }
        } catch (err) {
          this.folders = [];
        } finally {
          this.foldersLoading = false;
        }
      },
      onFolderSearchInput() {
        clearTimeout(this.folderSearchDebounce);
        this.folderSearchDebounce = setTimeout(() => this.loadFolders(), 300);
      },
      async selectFolder(folder) {
        this.selectedFolder = folder;
        this.fileSearch = "";
        await this.loadFolderFiles();
      },
      async loadFolderFiles() {
        if (!this.selectedFolder) return;
        this.filesLoading = true;
        try {
          const params = new URLSearchParams();
          if (this.fileSearch.trim()) params.set("q", this.fileSearch.trim());
          const res = await API.get(`/cases/folders/id/${this.selectedFolder.id}${params.toString() ? `?${params}` : ""}`);
          this.folderFiles = Array.isArray(res.data?.files) ? res.data.files : [];
          if (res.data?.folder) Object.assign(this.selectedFolder, res.data.folder);
        } catch (err) {
          this.folderFiles = [];
        } finally {
          this.filesLoading = false;
        }
      },
      onFileSearchInput() {
        clearTimeout(this.fileSearchDebounce);
        this.fileSearchDebounce = setTimeout(() => this.loadFolderFiles(), 300);
      },

      openFolderCreate() {
        this.folderForm = emptyFolderForm();
        this.folderError = "";
        this.showFolderModal = true;
      },
      openFolderEdit(folder) {
        this.folderForm = {
          _id: folder.id,
          name: folder.name || "",
          referenceNo: folder.referenceNo || "",
          description: folder.description || "",
          leadAgency: folder.leadAgency || "",
          coordinatingAgenciesText: (folder.coordinatingAgencies || []).join(", "),
          status: folder.status || "open",
        };
        this.folderError = "";
        this.showFolderModal = true;
      },
      closeFolderModal() {
        if (this.folderSubmitting) return;
        this.showFolderModal = false;
      },
      async submitFolder() {
        if (!this.folderForm.name?.trim() || this.folderSubmitting) return;

        const isUpdate = Boolean(this.folderForm._id);
        if (isUpdate) {
          const ok = await dialog.confirm({
            title: "Update this folder?",
            description: "Save changes to this case folder?",
            details: this.folderForm.name,
            confirmText: "Save changes",
            confirmIcon: "mdi:content-save-outline",
            cancelText: "Keep editing",
            tone: "primary",
            icon: "mdi:folder-edit-outline",
          });
          if (!ok) return;
        }

        this.folderSubmitting = true;
        this.folderError = "";
        try {
          const payload = {
            name: this.folderForm.name,
            category: "inter-agency",
            referenceNo: this.folderForm.referenceNo,
            description: this.folderForm.description,
            leadAgency: this.folderForm.leadAgency,
            status: this.folderForm.status,
            coordinatingAgencies: this.folderForm.coordinatingAgenciesText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          };
          let res;
          if (isUpdate) {
            res = await API.put(`/cases/folders/id/${this.folderForm._id}`, payload);
          } else {
            res = await API.post("/cases/folders", payload);
          }
          const folder = res.data?.folder;
          if (folder) {
            const idx = this.folders.findIndex((f) => f.id === folder.id);
            if (idx >= 0) this.folders.splice(idx, 1, folder);
            else this.folders.unshift(folder);
            if (this.selectedFolder?.id === folder.id) Object.assign(this.selectedFolder, folder);
            else if (!isUpdate) this.selectedFolder = folder;
          }
          this.showFolderModal = false;
          dialog.success(isUpdate ? "Folder updated." : "Folder created.");
        } catch (err) {
          this.folderError = err.response?.data?.message || "Unable to save folder.";
        } finally {
          this.folderSubmitting = false;
        }
      },
      async confirmFolderDelete(folder) {
        if (!folder) return;
        const fileNote = folder.fileCount
          ? `\n\nThis will also remove ${folder.fileCount} uploaded file${folder.fileCount === 1 ? "" : "s"} and their extracted content.`
          : "";
        const ok = await dialog.confirm({
          title: "Delete this case folder?",
          description: `Folder and all uploaded contents will be permanently removed. This action cannot be undone.${fileNote}`,
          details: folder.name,
          confirmText: "Delete folder",
          confirmIcon: "mdi:folder-remove-outline",
          cancelText: "Keep folder",
          tone: "danger",
        });
        if (!ok) return;

        try {
          await API.delete(`/cases/folders/id/${folder.id}`);
          this.folders = this.folders.filter((f) => f.id !== folder.id);
          if (this.selectedFolder?.id === folder.id) this.selectedFolder = null;
          this.folderFiles = [];
          dialog.success(`Folder "${folder.name}" deleted.`);
        } catch (err) {
          dialog.error(err.response?.data?.message || "Unable to delete folder.");
        }
      },

      // ===== UPLOAD =====
      onFilesPicked(e) {
        const files = Array.from(e.target.files || []);
        this.queueAndUpload(files);
        if (this.$refs.fileInput) this.$refs.fileInput.value = "";
      },
      onDrop(e) {
        this.dragOver = false;
        const files = Array.from(e.dataTransfer?.files || []);
        this.queueAndUpload(files);
      },
      queueAndUpload(files) {
        if (!this.selectedFolder) return;
        for (const file of files) {
          if (file.size > 10 * 1024 * 1024) {
            this.uploadQueue.push({ id: ++queueId, name: file.name, size: file.size, status: "error", error: "File exceeds 10 MB." });
            continue;
          }
          this.uploadOne(file);
        }
      },
      async uploadOne(file) {
        const item = { id: ++queueId, name: file.name, size: file.size, status: "scanning", error: "" };
        this.uploadQueue.unshift(item);
        try {
          const base64 = await this.readAsBase64(file);
          item.status = "uploading";
          const res = await API.post(`/cases/folders/id/${this.selectedFolder.id}/files`, {
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            contentBase64: base64,
          });
          item.status = "done";
          if (res.data?.file) this.folderFiles.unshift(res.data.file);
          if (res.data?.folder) {
            Object.assign(this.selectedFolder, res.data.folder);
            const idx = this.folders.findIndex((f) => f.id === res.data.folder.id);
            if (idx >= 0) this.folders.splice(idx, 1, res.data.folder);
          }
        } catch (err) {
          item.status = "error";
          item.error = err.response?.data?.message || "Upload failed.";
        }
      },
      readAsBase64(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = String(reader.result || "");
            resolve(result.replace(/^data:[^;]+;base64,/i, ""));
          };
          reader.onerror = () => reject(new Error("Unable to read file."));
          reader.readAsDataURL(file);
        });
      },
      async confirmFileDelete(file) {
        if (!file || !this.selectedFolder) return;

        const ok = await dialog.confirm({
          title: "Delete this file?",
          description: "The file and its extracted content will be permanently removed from this case folder.",
          details: file.originalName,
          confirmText: "Delete file",
          confirmIcon: "mdi:trash-can-outline",
          cancelText: "Keep file",
          tone: "danger",
        });
        if (!ok) return;

        try {
          const res = await API.delete(`/cases/folders/id/${this.selectedFolder.id}/files/${file.id}`);
          this.folderFiles = this.folderFiles.filter((f) => f.id !== file.id);
          if (res.data?.folder) {
            Object.assign(this.selectedFolder, res.data.folder);
            const idx = this.folders.findIndex((f) => f.id === res.data.folder.id);
            if (idx >= 0) this.folders.splice(idx, 1, res.data.folder);
          }
          dialog.success("File deleted.");
        } catch (err) {
          dialog.error(err.response?.data?.message || "Unable to delete file.");
        }
      },

      async openTextViewer(file) {
        this.textViewer = { open: true, fileName: file.originalName, text: "", loading: true };
        try {
          const res = await API.get(`/cases/folders/id/${this.selectedFolder.id}/files/${file.id}/text`);
          this.textViewer.text = res.data?.extractedText || "";
        } catch (err) {
          this.textViewer.text = "";
        } finally {
          this.textViewer.loading = false;
        }
      },
      closeTextViewer() {
        this.textViewer = { open: false, fileName: "", text: "", loading: false };
      },
    },
    mounted() { this.load(); },
  };
</script>
