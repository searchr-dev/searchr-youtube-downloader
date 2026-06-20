/**
 * History Controller
 * 
 * Handles download history page rendering and CRUD operations.
 * 
 * Author: Param Panchal (Searchr)
 */

const historyService = require('../services/historyService');

/**
 * Renders the history page with all download records.
 */
exports.showPage = (req, res) => {
  const entries = historyService.getAll();
  res.render('history', {
    title: 'Download History — Searchr',
    entries
  });
};

/**
 * Deletes a single history entry.
 * DELETE /history/:id
 */
exports.deleteOne = (req, res) => {
  const { id } = req.params;
  const success = historyService.deleteOne(id);
  res.json({ success });
};

/**
 * Clears all history entries.
 * DELETE /history
 */
exports.clearAll = (req, res) => {
  historyService.clearAll();
  res.json({ success: true });
};
