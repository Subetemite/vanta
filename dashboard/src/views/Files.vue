<template>
  <div class="p-4">
    <div
      class="rounded-md border bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Files
          </p>
          <h1 class="mt-2 text-2xl font-semibold text-gray-800 dark:text-gray-100">
            File Management
          </h1>
          <p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Upload a file from this page and it will be saved on the API server
            with metadata stored in the database.
          </p>
        </div>
        <span
          class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:bg-gray-700 dark:text-gray-300"
        >
          Server Uploads
        </span>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div
          class="rounded-md border border-dashed border-gray-300 p-5 dark:border-gray-600"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Upload File
              </h2>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Accepted limit: 5 MB. The file is sent to the server and saved
                under the API uploads folder.
              </p>
            </div>
            <span
              class="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700"
            >
              API Save
            </span>
          </div>

          <div class="mt-5 rounded-md bg-gray-50 p-4 dark:bg-gray-900/50">
            <div
              class="cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition"
              :class="
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
              "
              @click="triggerFilePicker"
              @dragenter.prevent="setDragOver(true)"
              @dragover.prevent="setDragOver(true)"
              @dragleave.prevent="setDragOver(false)"
              @drop.prevent="handleFileDrop"
            >
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Drag and drop a file here
              </p>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                or click to browse from your device
              </p>
              <p class="mt-3 text-xs uppercase tracking-[0.18em] text-gray-400">
                Maximum file size: 5 MB
              </p>
            </div>

            <input
              ref="fileInput"
              type="file"
              class="hidden"
              @change="handleFileChange"
            />

            <button
              type="button"
              class="mt-4 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              @click="triggerFilePicker"
            >
              Browse Files
            </button>

            <div
              v-if="selectedFile"
              class="mt-4 rounded-md border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <p class="font-semibold text-gray-800 dark:text-gray-100">
                {{ selectedFile.name }}
              </p>
              <p class="mt-1 text-gray-500 dark:text-gray-400">
                {{ formatFileSize(selectedFile.size) }} |
                {{ selectedFile.type || "Unknown type" }}
              </p>
            </div>

            <p
              v-if="statusMessage"
              class="mt-4 text-sm"
              :class="statusType === 'error' ? 'text-red-500' : 'text-emerald-600'"
            >
              {{ statusMessage }}
            </p>

            <div class="mt-5 flex gap-3">
              <button
                type="button"
                class="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!selectedFile || isUploading"
                @click="uploadSelectedFile"
              >
                {{ isUploading ? "Uploading..." : "Upload to Server" }}
              </button>
              <button
                type="button"
                class="rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                :disabled="isUploading"
                @click="clearSelection"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        <div
          class="rounded-md border border-gray-200 p-5 dark:border-gray-700"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Extracted PDF Data
              </h2>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Search results from indexed PDF text will appear here.
              </p>
            </div>
            <button
              type="button"
              class="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-600 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              :disabled="isLoadingFiles"
              @click="loadFiles"
            >
              Refresh
            </button>
          </div>

          <div
            v-if="!activeSearchQuery && !searchContextFiles.length"
            class="mt-5 rounded-md bg-gray-50 p-5 text-sm text-gray-500 dark:bg-gray-900/50 dark:text-gray-400"
          >
            Type in the search bar below to pull matching content from extracted
            PDF text.
          </div>
          <div
            v-else-if="activeSearchQuery && !searchContextFiles.length && isLoadingFiles"
            class="mt-5 rounded-md bg-gray-50 p-5 text-sm text-gray-500 dark:bg-gray-900/50 dark:text-gray-400"
          >
            Searching indexed PDF text...
          </div>
          <div
            v-else-if="activeSearchQuery && !searchMatchCount && !searchContextFiles.length"
            class="mt-5 rounded-md bg-gray-50 p-5 text-sm text-gray-500 dark:bg-gray-900/50 dark:text-gray-400"
          >
            No extracted PDF text matched "{{ activeSearchQuery }}".
          </div>
          <div v-else class="mt-5 grid gap-4">
            <div class="rounded-md bg-gray-50 p-4 dark:bg-gray-900/50">
              <p class="text-xs uppercase tracking-[0.18em] text-gray-400">
                Search Query
              </p>
              <p class="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                {{ activeSearchQuery }}
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ searchMatchCount }} matching file{{ searchMatchCount === 1 ? "" : "s" }}
              </p>
              <p
                v-if="isLoadingFiles"
                class="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
              >
                Updating results...
              </p>
            </div>
            <div class="rounded-md bg-gray-50 p-4 dark:bg-gray-900/50">
              <p class="text-xs uppercase tracking-[0.18em] text-gray-400">
                Top Matching File
              </p>
              <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                {{ searchSummaryFile?.originalName || "No matching file" }}
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ searchSummaryFile ? formatDate(searchSummaryFile.createdAt) : "Waiting for result" }}
              </p>
            </div>
            <div class="rounded-md bg-gray-50 p-4 dark:bg-gray-900/50">
              <p class="text-xs uppercase tracking-[0.18em] text-gray-400">
                Extracted Text Preview
              </p>
              <p class="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                {{ getSummaryPreview(searchSummaryFile) }}
              </p>
            </div>
            <div
              v-if="searchContextFiles.length"
              class="rounded-md bg-gray-50 p-4 dark:bg-gray-900/50"
            >
              <p class="text-xs uppercase tracking-[0.18em] text-gray-400">
                Matching Document Context
              </p>
              <div class="mt-3 space-y-3">
                <div
                  v-for="file in searchContextFiles"
                  :key="`context-${file.id}`"
                  class="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {{ file.originalName }}
                  </p>
                  <p class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    {{ getSummaryPreview(file) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 rounded-md border border-gray-200 p-5 dark:border-gray-700">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Saved Files
            </h2>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Files listed here have already been written to the server.
            </p>
          </div>
          <div class="w-full max-w-sm">
            <input
              v-model.trim="searchQuery"
              type="text"
              placeholder="Search PDF text or file name"
              class="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              @input="handleSearchInput"
            />
          </div>
        </div>

        <div
          v-if="isLoadingFiles"
          class="mt-5 rounded-md bg-gray-50 px-4 py-6 text-sm text-gray-500 dark:bg-gray-900/50 dark:text-gray-400"
        >
          Loading uploaded files...
        </div>
        <div
          v-else-if="filesError"
          class="mt-5 rounded-md bg-red-50 px-4 py-6 text-sm text-red-500"
        >
          {{ filesError }}
        </div>
        <div
          v-else-if="!uploadedFiles.length"
          class="mt-5 rounded-md bg-gray-50 px-4 py-6 text-sm text-gray-500 dark:bg-gray-900/50 dark:text-gray-400"
        >
          No files have been uploaded yet.
        </div>
        <div v-else class="mt-5 overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr class="text-left text-xs uppercase tracking-[0.18em] text-gray-400">
                <th class="px-3 py-3 font-semibold">File</th>
                <th class="px-3 py-3 font-semibold">Size</th>
                <th class="px-3 py-3 font-semibold">Uploaded By</th>
                <th class="px-3 py-3 font-semibold">Index</th>
                <th class="px-3 py-3 font-semibold">Date</th>
                <th class="px-3 py-3 font-semibold">Open</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="file in uploadedFiles"
                :key="file.id"
                class="text-sm text-gray-700 dark:text-gray-200"
              >
                <td class="px-3 py-4">
                  <p class="font-semibold">{{ file.originalName }}</p>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {{ file.mimeType || "Unknown type" }}
                  </p>
                  <p
                    v-if="getSummaryPreview(file)"
                    class="mt-1 max-w-md text-xs text-gray-500 dark:text-gray-400"
                  >
                    {{ getSummaryPreview(file) }}
                  </p>
                </td>
                <td class="px-3 py-4">{{ formatFileSize(file.size) }}</td>
                <td class="px-3 py-4">
                  {{ file.uploadedBy?.username || file.uploadedBy?.email || "Unknown" }}
                </td>
                <td class="px-3 py-4">
                  {{ formatExtractionStatus(file.extractionStatus) }}
                </td>
                <td class="px-3 py-4">{{ formatDate(file.createdAt) }}</td>
                <td class="px-3 py-4">
                  <a
                    :href="file.url"
                    target="_blank"
                    rel="noreferrer"
                    class="font-semibold text-primary hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import API from "@/services/api";

  export default {
    name: "FilesView",
    data() {
      return {
        selectedFile: null,
        isDragOver: false,
        isUploading: false,
        isLoadingFiles: false,
        searchQuery: "",
        searchDebounce: null,
        latestSearchRequestId: 0,
        activeSearchQuery: "",
        searchSummaryFile: null,
        searchMatchCount: 0,
        searchContextFiles: [],
        statusMessage: "",
        statusType: "success",
        filesError: "",
        uploadedFiles: [],
      };
    },
    methods: {
      async loadFiles() {
        const requestedQuery = this.searchQuery.trim();
        const requestId = ++this.latestSearchRequestId;
        this.isLoadingFiles = true;
        this.filesError = "";

        try {
          const query = requestedQuery
            ? `/files?q=${encodeURIComponent(requestedQuery)}`
            : "/files";
          const response = await API.get(query);

          if (requestId !== this.latestSearchRequestId) {
            return;
          }

          const nextFiles = Array.isArray(response.data.files)
            ? response.data.files
            : [];
          this.uploadedFiles = nextFiles;

          if (requestedQuery) {
            this.activeSearchQuery = requestedQuery;
            this.searchMatchCount = nextFiles.length;

            if (nextFiles.length) {
              this.searchSummaryFile = nextFiles[0];
              this.searchContextFiles = nextFiles.slice(0, 3);
            }
          } else {
            this.activeSearchQuery = "";
            this.searchSummaryFile = null;
            this.searchMatchCount = 0;
            this.searchContextFiles = [];
          }
        } catch (error) {
          if (requestId !== this.latestSearchRequestId) {
            return;
          }

          this.filesError =
            error.response?.data?.message || "Unable to load files right now.";
        } finally {
          if (requestId === this.latestSearchRequestId) {
            this.isLoadingFiles = false;
          }
        }
      },
      handleSearchInput() {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => {
          this.loadFiles();
        }, 250);
      },
      handleFileChange(event) {
        const [file] = event.target.files || [];
        this.setSelectedFile(file);
      },
      handleFileDrop(event) {
        const [file] = event.dataTransfer?.files || [];
        this.setDragOver(false);
        this.setSelectedFile(file);
      },
      setDragOver(value) {
        this.isDragOver = value;
      },
      triggerFilePicker() {
        this.$refs.fileInput?.click();
      },
      setSelectedFile(file) {
        this.statusMessage = "";
        this.statusType = "success";

        if (!file) {
          this.selectedFile = null;
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          this.selectedFile = null;
          this.statusType = "error";
          this.statusMessage = "Please choose a file that is 5 MB or smaller.";

          if (this.$refs.fileInput) {
            this.$refs.fileInput.value = "";
          }

          return;
        }

        this.selectedFile = file;
      },
      clearSelection() {
        this.selectedFile = null;
        this.isDragOver = false;
        this.statusMessage = "";
        this.statusType = "success";

        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = "";
        }
      },
      readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result);
          reader.onerror = () =>
            reject(new Error("Unable to read the selected file."));
          reader.readAsDataURL(file);
        });
      },
      async uploadSelectedFile() {
        if (!this.selectedFile || this.isUploading) {
          return;
        }

        this.isUploading = true;
        this.statusMessage = "";
        this.statusType = "success";

        try {
          const contentBase64 = await this.readFileAsDataUrl(this.selectedFile);

          const response = await API.post("/files", {
            fileName: this.selectedFile.name,
            mimeType: this.selectedFile.type,
            contentBase64,
          });

          this.statusMessage =
            response.data.message || "File uploaded successfully.";
          this.clearSelection();
          await this.loadFiles();
        } catch (error) {
          this.statusType = "error";
          this.statusMessage =
            error.response?.data?.message || "Unable to upload the file.";
        } finally {
          this.isUploading = false;
        }
      },
      formatFileSize(size = 0) {
        if (size < 1024) {
          return `${size} B`;
        }

        if (size < 1024 * 1024) {
          return `${(size / 1024).toFixed(1)} KB`;
        }

        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
      },
      formatDate(value) {
        if (!value) {
          return "Unknown date";
        }

        return new Date(value).toLocaleString();
      },
      formatExtractionStatus(value) {
        if (value === "completed") {
          return "Indexed";
        }

        if (value === "failed") {
          return "Failed";
        }

        if (value === "pending") {
          return "Processing";
        }

        return "N/A";
      },
      getSummaryPreview(file) {
        if (file?.matchedContext) {
          return file.matchedContext;
        }

        if (!file?.extractedTextPreview) {
          return "No extracted PDF text is available for this result.";
        }

        return file.extractedTextPreview;
      },
    },
    mounted() {
      this.loadFiles();
    },
    beforeUnmount() {
      clearTimeout(this.searchDebounce);
    },
  };
</script>
