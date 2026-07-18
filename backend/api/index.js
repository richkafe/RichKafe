import { app } from '../src/server.js';
import { initDatabase } from '../src/database.js';

let ready = false;

export default async function handler(req, res) {
  if (!ready) {
    await initDatabase();
    ready = true;
  }
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
