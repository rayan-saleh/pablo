/**
 * Synchronously convert a data:image/png;base64,... URL to a Blob.
 * MUST be synchronous — using fetch(dataUrl) crosses an async boundary
 * that can drop the user-activation token required by clipboard.write().
 */
export function dataUrlToPngBlob(dataUrl: string): Blob {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: 'image/png' });
}
