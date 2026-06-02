export function createOperationConfirmationDialog(isEditing) {
  return {
    visible: true,
    title: isEditing ? "Update operation?" : "Save new operation?",
    description: isEditing
      ? "This will apply your changes to the selected operation."
      : "This will save the current form as a new operation record.",
    confirmText: isEditing ? "Yes, update" : "Yes, save",
  };
}
