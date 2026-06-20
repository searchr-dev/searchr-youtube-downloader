/**
 * History Service
 * 
 * Reads and writes download history to a local JSON file.
 * Each entry tracks URL, title, quality, type, and timestamp.
 * 
 * Author: Param Panchal (Searchr)
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const HISTORY_FILE = path.join(__dirname, '..', 'data', 'history.json');

/**
 * Reads the history file, returns an array of entries.
 * @returns {Array}
 */
function getAll() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Writes the history array back to the file.
 * @param {Array} entries 
 */
function _save(entries) {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

/**
 * Adds a new entry to the download history.
 * @param {Object} entry - { url, title, quality, type, format, thumbnail }
 * @returns {Object} The saved entry with id and date
 */
function addEntry(entry) {
  const entries = getAll();
  const newEntry = {
    id: uuidv4(),
    url: entry.url || '',
    title: entry.title || 'Untitled',
    quality: entry.quality || 'N/A',
    type: entry.type || 'video',       // video, audio, clip, live
    format: entry.format || 'mp4',
    thumbnail: entry.thumbnail || '',
    date: new Date().toISOString()
  };

  // Add to the beginning (most recent first)
  entries.unshift(newEntry);

  // Keep only the last 100 entries
  if (entries.length > 100) {
    entries.length = 100;
  }

  _save(entries);
  return newEntry;
}

/**
 * Deletes a single history entry by ID.
 * @param {string} id 
 * @returns {boolean} True if found and deleted
 */
function deleteOne(id) {
  const entries = getAll();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return false;
  entries.splice(idx, 1);
  _save(entries);
  return true;
}

/**
 * Clears all history entries.
 */
function clearAll() {
  _save([]);
}

module.exports = {
  getAll,
  addEntry,
  deleteOne,
  clearAll
};
