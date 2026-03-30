const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const reportController = require('../controllers/reportController');

router.use(verifyToken, authorizeRoles('admin', 'staff'));

router.get('/health', (req, res) => {
  res.json({ message: 'Report route active' });
});
router.get('/merit-list', reportController.getMeritList);
router.get('/class-summary', reportController.getClassSummary);
router.get('/subject/:id/export', reportController.exportSubjectReportCsv);

module.exports = router;
