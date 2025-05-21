/**
 * Convert a file to a base64-encoded string
 *
 * @param {File} file - The file to convert
 * @returns {Promise<Object>} - A promise that resolves to an object with file details and base64 content
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: reader.result,
      });
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Convert multiple files to base64-encoded strings
 *
 * @param {FileList|Array<File>} files - The files to convert
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of objects with file details and base64 content
 */
export const filesToBase64 = (files) => {
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map((file) => fileToBase64(file)));
};

/**
 * Download a base64-encoded file
 *
 * @param {Object} doc - Object containing base64 data and file name
 */
export const downloadBase64File = (doc) => {
  if (!doc || !doc.base64) {
    console.error("No document data available");
    return;
  }

  try {
    const link = window.document.createElement("a");
    link.href = doc.base64;
    link.download = doc.name || "document";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading document:", error);
  }
};

/**
 * Convert a Blob to base64-encoded string
 *
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} - A promise that resolves to the base64 string
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Convert a data URL to a Blob
 *
 * @param {string} dataUrl - The data URL to convert
 * @returns {Blob} - The resulting Blob
 */
export const dataUrlToBlob = (dataUrl) => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
};
