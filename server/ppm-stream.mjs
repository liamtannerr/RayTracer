// Parse the renderer's P3 output across arbitrary pipe chunk boundaries.
// Keep only an unfinished line and one RGB row in memory.
export class PpmStream {
  constructor(width, height, onRow) {
    Object.assign(this, { width, height, onRow, pending: '', header: 0, row: 0, offset: 0 });
    this.pixels = Buffer.alloc(width * 3);
  }
  push(chunk) {
    const lines = (this.pending + chunk.toString()).split('\n');
    this.pending = lines.pop();
    for (const raw of lines) {
      const line = raw.trim();
      if (this.header < 3) {
        const expected = ['P3', `${this.width} ${this.height}`, '255'][this.header++];
        if (line !== expected) throw new Error('Invalid renderer image header.');
        continue;
      }
      if (!/^\d+ \d+ \d+$/.test(line) || this.row >= this.height) throw new Error('Invalid renderer pixel data.');
      for (const value of line.split(' ').map(Number)) {
        if (value > 255) throw new Error('Invalid renderer color.');
        this.pixels[this.offset++] = value;
      }
      if (this.offset === this.pixels.length) {
        this.onRow(this.row++, this.pixels.toString('base64'));
        this.offset = 0;
      }
    }
  }
  finish() {
    if (this.pending.trim() || this.header !== 3 || this.row !== this.height || this.offset) throw new Error('The renderer returned an incomplete image.');
  }
}
