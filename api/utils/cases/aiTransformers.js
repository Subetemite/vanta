function toIsoDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}

function toIsoDateOnly(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

function compactSummary(parts) {
  return parts.filter(Boolean).join(", ");
}

function toAIRecord(record) {
  const doc = typeof record.toObject === "function" ? record.toObject() : record;
  const personalInformation = doc.personalInformation || {};
  const operationDetails = doc.operationDetails || {};
  const biometrics = doc.biometrics || {};
  const profilePhoto = doc.profilePhoto || {};

  const personName = [
    personalInformation.firstName,
    personalInformation.middleName,
    personalInformation.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    recordId: String(doc._id || ""),
    personId: String(doc._id || ""),
    personalInformation: {
      firstName: personalInformation.firstName || "",
      middleName: personalInformation.middleName || "",
      lastName: personalInformation.lastName || "",
      alias: personalInformation.alias || "",
      sex: personalInformation.sex || "",
      civilStatus: personalInformation.civilStatus || "",
      birthDate: toIsoDateOnly(personalInformation.birthDate),
      contactNumber: personalInformation.contactNumber || "",
      emailAddress: personalInformation.emailAddress || "",
      nationality: personalInformation.nationality || "",
      country: personalInformation.country || "",
      address: personalInformation.address || "",
    },
    operationDetails: {
      operationId: operationDetails.operationId || "",
      operationName: operationDetails.operationName || "",
      operationDate: toIsoDateOnly(operationDetails.operationDate),
      operationAddress: operationDetails.operationAddress || "",
      disposition: operationDetails.disposition || "",
      visaStatus: operationDetails.visaStatus || "",
      remarks: operationDetails.remarks || "",
      actions: operationDetails.actions || "",
    },
    biometrics: {
      heightCm: biometrics.heightCm ?? null,
      weightKg: biometrics.weightKg ?? null,
      bloodType: biometrics.bloodType || "",
      eyeColor: biometrics.eyeColor || "",
      hairColor: biometrics.hairColor || "",
      complexion: biometrics.complexion || "",
      distinguishingMarks: biometrics.distinguishingMarks || "",
      fingerprintCode: biometrics.fingerprintCode || "",
    },
    profilePhoto: {
      fileName: profilePhoto.fileName || "",
      mimeType: profilePhoto.mimeType || "",
      size: profilePhoto.size || 0,
      dataUrl: "",
    },
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt || doc.createdAt),
    summary: compactSummary([
      personName || "Unknown person",
      personalInformation.nationality || "",
      personalInformation.sex ? personalInformation.sex.toLowerCase() : "",
      operationDetails.operationName
        ? `linked to ${operationDetails.operationName}`
        : "",
      operationDetails.operationDate
        ? `on ${toIsoDateOnly(operationDetails.operationDate)}`
        : "",
      operationDetails.operationAddress || personalInformation.address || "",
    ]),
  };
}

function toAIOperation(operation) {
  const doc =
    typeof operation.toObject === "function" ? operation.toObject() : operation;

  return {
    operationId: doc.operationId || String(doc._id || ""),
    databaseId: String(doc._id || ""),
    operationCodeName: doc.operationCodeName || "",
    operationType: doc.operationType || "",
    objective: doc.objective || "",
    plannedDateTime: toIsoDate(doc.plannedDateTime),
    actualDateTime: toIsoDate(doc.actualDateTime),
    fullAddress: doc.fullAddress || "",
    cityDistrict: doc.cityDistrict || "",
    operationCommander: doc.operationCommander || "",
    teamLeader: doc.teamLeader || "",
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt || doc.createdAt),
    summary: compactSummary([
      doc.operationCodeName || "Unnamed operation",
      doc.operationType || "",
      doc.cityDistrict || "",
      doc.operationCommander ? `led by ${doc.operationCommander}` : "",
      doc.plannedDateTime ? `planned ${toIsoDate(doc.plannedDateTime)}` : "",
    ]),
  };
}

module.exports = {
  toAIRecord,
  toAIOperation,
};
