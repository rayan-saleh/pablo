import test from 'node:test';
import assert from 'node:assert/strict';
import { dataUrlToPngBlob } from '../src/content/clipboard.ts';

test('dataUrlToPngBlob converts a PNG dataURL to a Blob with correct type', () => {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const dataUrl = `data:image/png;base64,${base64}`;
  const blob = dataUrlToPngBlob(dataUrl);

  assert.equal(blob.type, 'image/png');
  assert.equal(blob.size, atob(base64).length);
});

test('dataUrlToPngBlob round-trips bytes correctly', async () => {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const dataUrl = `data:image/png;base64,${base64}`;
  const blob = dataUrlToPngBlob(dataUrl);

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const roundTripped = btoa(String.fromCharCode(...bytes));
  assert.equal(roundTripped, base64);
});
