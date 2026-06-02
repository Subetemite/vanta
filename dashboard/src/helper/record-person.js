export function formatPersonName(person) {
  return person.personalInformation?.name || "";
}

export function getPersonInitials(person) {
  const name = person.personalInformation?.name || "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "NA";
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatPersonMeta(person) {
  const info = person.personalInformation || {};

  return [
    info.alias ? `Alias: ${info.alias}` : null,
    info.nationality || null,
    info.country || null,
  ]
    .filter(Boolean)
    .join(" | ");
}
