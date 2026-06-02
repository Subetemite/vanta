<template>
  <FormSection
    title="Profile Upload"
    badge-text="Image"
    badge-class="bg-amber-50 text-amber-700"
  >
    <div class="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-5">
      <div class="grid gap-4 sm:grid-cols-[1.2fr_0.8fr] sm:items-start">
        <div>
          <label for="profilePhoto" class="block text-sm font-medium text-slate-700">
            Upload profile photo
          </label>
          <input
            id="profilePhoto"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="mt-3 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            @change="$emit('change', $event)"
          />
          <p class="mt-3 text-sm text-slate-500">
            Accepted formats: PNG, JPG, WEBP. Recommended size: 2 MB or below.
          </p>
        </div>

        <div class="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-100/60">
          <p class="text-sm text-slate-900">
            <span class="font-medium">{{ fileName || "Selected image" }}</span>
          </p>
          <p class="mt-1 text-sm text-slate-500">
            {{ profileSummary }}
          </p>
          <img
            v-if="profilePreview"
            :src="profilePreview"
            alt="Profile preview"
            class="mt-3 h-24 w-24 rounded-2xl object-cover"
          />
        </div>
      </div>
    </div>
  </FormSection>
</template>

<script>
  import FormSection from "@/components/FormSection.vue";

  export default {
    name: "ProfileUploadSection",
    components: {
      FormSection,
    },
    emits: ["change"],
    props: {
      fileName: {
        type: String,
        default: "",
      },
      profileSummary: {
        type: String,
        required: true,
      },
      profilePreview: {
        type: String,
        default: "",
      },
    },
  };
</script>
