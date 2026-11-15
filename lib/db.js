import fs from 'fs';
import path from 'path';

const BUNDLED = path.join(process.cwd(), 'data');
const DIR = process.env.DATA_DIR || BUNDLED;

function read(name) {
  const file = path.join(DIR, name);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    // seed from bundled copy on first run
    const seed = JSON.parse(fs.readFileSync(path.join(BUNDLED, name), 'utf8'));
    write(name, seed);
    return seed;
  }
}
function write(name, data) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, name), JSON.stringify(data, null, 2));
}

export const getMenu = () => read('menu.json');
export const saveMenu = (m) => write('menu.json', m);
export const getOrders = () => read('orders.json');
export const saveOrders = (o) => write('orders.json', o);
