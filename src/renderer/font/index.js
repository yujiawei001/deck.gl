import fs from 'fs';
import path from 'path';

export const fontInfo = {
  metadata: JSON.parse(fs.readFileSync(path.join(__dirname, './ubuntu-light/font.json'), 'utf8')),
  data: fs.readFileSync(path.join(__dirname, './ubuntu-light/font.png'))
};
