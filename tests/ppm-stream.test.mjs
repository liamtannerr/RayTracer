import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PpmStream } from '../server/ppm-stream.mjs';

test('emits each full row immediately across single-byte chunks', () => {
  const rows = [];
  const parser = new PpmStream(2, 2, (row, pixels) => rows.push({ row, pixels: [...Buffer.from(pixels, 'base64')] }));
  for (const byte of Buffer.from('P3\n2 2\n255\n255 0 7\n8 9 10\n')) parser.push(Buffer.from([byte]));
  assert.deepEqual(rows, [{ row: 0, pixels: [255, 0, 7, 8, 9, 10] }]);
  assert.throws(() => parser.finish(), /incomplete/);
  parser.push(Buffer.from('11 12 13\n14 15 16\n'));
  parser.finish();
  assert.deepEqual(rows[1], { row: 1, pixels: [11, 12, 13, 14, 15, 16] });
});

test('rejects mismatched dimensions, invalid colors, and extra pixels', () => {
  assert.throws(() => new PpmStream(1, 1, () => {}).push(Buffer.from('P3\n2 2\n')), /header/);
  assert.throws(() => new PpmStream(1, 1, () => {}).push(Buffer.from('P3\n1 1\n255\n256 0 0\n')), /color/);
  assert.throws(() => new PpmStream(1, 1, () => {}).push(Buffer.from('P3\n1 1\n255\n0 0 0\n1 1 1\n')), /pixel/);
});
