const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const staffController = require('../controllers/staffController');

router.use(verifyToken, authorizeRoles('staff'));

router.get('/health', (req, res) => {
  res.json({ message: 'Staff route active' });
});

router.get('/me/profile', staffController.getMyProfile);
router.get('/me/subjects', staffController.getMySubjects);
router.get('/me/students', staffController.getMyStudents);
router.get('/me/marks', staffController.getMyStudentMarks);
router.get('/me/queries', staffController.getMyQueries);
router.put('/me/queries/:id/reply', staffController.replyToQuery);
router.get('/me/year-staff', staffController.getYearStaffContacts);
router.post('/marks', staffController.createMark);
router.put('/marks/:id', staffController.updateMark);
router.get('/subjects/:subjectId/performance', staffController.getSubjectPerformance);
router.get('/subjects/:subjectId/report', staffController.getSubjectReport);

module.exports = router;
