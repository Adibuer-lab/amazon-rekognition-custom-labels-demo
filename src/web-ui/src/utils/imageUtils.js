/*export function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof Blob)) {
      reject('Input is not a Blob or File.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}*/
