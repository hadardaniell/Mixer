import { Platform } from 'react-native';

export interface UploadableFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Build a multipart `FormData` with an image file part that works on **both**
 * native and web.
 *
 * On React Native, `FormData` accepts a `{ uri, name, type }` descriptor and
 * streams the file from disk. The browser's `FormData` does not — it stringifies
 * that plain object to the literal `"[object Object]"`, so the server receives a
 * text field and no file ("No image file sent"). On web we therefore fetch the
 * picked local uri (a `blob:`/`data:` URL) into a real `Blob` and append that.
 */
export async function buildImageFormData(
  file: UploadableFile,
  field = 'file',
): Promise<FormData> {
  const form = new FormData();

  if (Platform.OS === 'web') {
    const res = await fetch(file.uri);
    const blob = await res.blob();
    // Preserve the mime type even when the source blob reports none, so the
    // server (and Firebase) store the right Content-Type rather than octet-stream.
    const typed = blob.type ? blob : new Blob([blob], { type: file.type });
    form.append(field, typed, file.name);
  } else {
    // React Native's FormData understands this file descriptor natively.
    form.append(field, file as unknown as Blob);
  }

  return form;
}
