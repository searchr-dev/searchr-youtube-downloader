/**
 * History Routes
 * Author: Param Panchal (Searchr)
 */

const router = require('express').Router();
const historyController = require('../controllers/historyController');

// GET    /history      — Render history page
router.get('/', historyController.showPage);

// DELETE /history/:id  — Delete one history entry
router.delete('/:id', historyController.deleteOne);

// DELETE /history      — Clear all history
router.delete('/', historyController.clearAll);

module.exports = router;
