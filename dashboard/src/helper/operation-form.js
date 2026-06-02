export const fieldClass =
  "w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none";

export const selectOptions = {
  operationType: [
    "Surveillance",
    "Inspection",
    "Apprehension",
    "Monitoring",
    "Rescue",
    "Interdiction",
    "Joint Operation",
    "Special Assignment",
  ],
};

export function createInitialForm() {
  return {
    operationId: "",
    operationCodeName: "",
    operationType: "",
    objective: "",
    plannedDateTime: "",
    actualDateTime: "",
    fullAddress: "",
    cityDistrict: "",
    operationCommander: "",
    teamLeader: "",
  };
}

export function createFormFromOperation(operation) {
  return {
    ...createInitialForm(),
    ...(operation || {}),
  };
}
