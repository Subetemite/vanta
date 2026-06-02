export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

export async function createProfilePhotoFromFile(file) {
  const dataUrl = await readFileAsDataUrl(file);

  return {
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    dataUrl,
  };
}
