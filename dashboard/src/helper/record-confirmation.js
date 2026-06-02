export function createConfirmationDialogState() {
  return {
    visible: false,
    title: "",
    description: "",
    confirmText: "",
  };
}

export function createRecordConfirmationDialog(isEditing) {
  return {
    visible: true,
    title: isEditing ? "Update record?" : "Save new record?",
    description: isEditing
      ? "This will apply your changes to the selected record."
      : "This will save the current form as a new record.",
    confirmText: isEditing ? "Yes, update" : "Yes, save",
  };
}

export function resolveConfirmation(resolver, confirmed) {
  if (resolver) {
    resolver(confirmed);
  }
}
