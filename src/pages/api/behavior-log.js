import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), '..', 'TTA-Frontend', 'behavior_log.json');
// Fallback: same directory as cwd (when running from TTA-Frontend)
const LOG_PATH_ALT = path.join(process.cwd(), 'behavior_log.json');

export default function handler(req, res) {
  const filePath = fs.existsSync(LOG_PATH) ? LOG_PATH : LOG_PATH_ALT;

  if (!fs.existsSync(filePath)) {
    return res.status(200).json([]);
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    const { username } = req.query;
    if (username) {
      return res.status(200).json(data.filter(e => e.username === username));
    }
    res.status(200).json(data);
  } catch {
    res.status(200).json([]);
  }
}
