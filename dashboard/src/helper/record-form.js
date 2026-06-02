export const fieldClass =
  "w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none";

export const selectOptions = {
  country: [
    "Philippines",
    "United States",
    "Canada",
    "Australia",
    "Japan",
    "South Korea",
    "China",
    "India",
    "Singapore",
    "Malaysia",
    "Indonesia",
    "Thailand",
    "Vietnam",
    "United Kingdom",
    "France",
    "Germany",
    "Italy",
    "Spain",
    "United Arab Emirates",
    "Saudi Arabia",
  ],
  sex: ["Male", "Female"],
  civilStatus: [
    "Single",
    "Married",
    "Widowed",
    "Separated",
  ],
  nationality: [
    "Filipino",
    "American",
    "Canadian",
    "Australian",
    "Japanese",
    "Korean",
    "Chinese",
    "Indian",
    "Singaporean",
    "Malaysian",
    "Indonesian",
    "Thai",
    "Vietnamese",
    "British",
    "French",
    "German",
    "Italian",
    "Spanish",
    "Emirati",
    "Saudi",
  ],
  bloodType: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  disposition: [
    "For processing",
    "Under investigation",
    "Referred",
    "Released",
    "Detained",
    "Deported",
    "Closed",
  ],
  visaStatus: [
    "Valid",
    "Expired",
    "Cancelled",
    "Pending",
    "Overstayed",
    "Not applicable",
  ],
  eyeColor: ["Brown", "Black", "Hazel", "Blue", "Green", "Gray"],
  hairColor: [
    "Black",
    "Brown",
    "Blonde",
    "Gray",
    "White",
    "Red",
    "Bald",
  ],
  complexion: ["Fair", "Light", "Medium", "Olive", "Morena", "Dark"],
};

export function createInitialForm() {
  return {
    personalInformation: {
      name: "",
      alias: "",
      sex: "",
      civilStatus: "",
      birthDate: "",
      contactNumber: "",
      emailAddress: "",
      nationality: "",
      country: "",
      address: "",
    },
    operationDetails: {
      operationName: "",
      operationAddress: "",
      operationDate: "",
      disposition: "",
      visaStatus: "",
      remarks: "",
      actions: "",
      message: "",
    },
    biometrics: {
      heightCm: "",
      weightKg: "",
      bloodType: "",
      eyeColor: "",
      hairColor: "",
      complexion: "",
      distinguishingMarks: "",
      fingerprintCode: "",
    },
    profilePhoto: {
      fileName: "",
      mimeType: "",
      size: 0,
      dataUrl: "",
    },
  };
}

export function createFormFromRecord(record) {
  const initialForm = createInitialForm();

  return {
    personalInformation: {
      ...initialForm.personalInformation,
      ...(record.personalInformation || {}),
    },
    operationDetails: {
      ...initialForm.operationDetails,
      ...(record.operationDetails || {}),
    },
    biometrics: {
      ...initialForm.biometrics,
      ...(record.biometrics || {}),
    },
    profilePhoto: {
      ...initialForm.profilePhoto,
      ...(record.profilePhoto || {}),
    },
  };
}

export function createEmptyProfilePhoto() {
  return createInitialForm().profilePhoto;
}
