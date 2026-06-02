export function formatOperationDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function formatOperationMeta(operation) {
  return [
    operation.operationCommander ? `Commander: ${operation.operationCommander}` : null,
    operation.cityDistrict || null,
    operation.plannedDateTime ? formatOperationDate(operation.plannedDateTime) : null,
  ]
    .filter(Boolean)
    .join(" | ");
}
