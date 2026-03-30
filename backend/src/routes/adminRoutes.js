const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const adminController = require('../controllers/adminController');

router.use(verifyToken, authorizeRoles('admin'));

router.get('/health', (req, res) => {
  res.json({ message: 'Admin route active' });
});

router.get('/students', adminController.getStudents);
router.get('/students/:id', adminController.getStudentById);
router.post('/students/auto-assign', adminController.autoAssignStudentsToStaff);
router.post('/students/bulk-assign', adminController.bulkAssignStudentsToStaff);
router.post('/students', adminController.createStudent);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);

router.get('/staff', adminController.getStaff);
router.post('/staff', adminController.createStaff);
router.put('/staff/:id', adminController.updateStaff);
router.delete('/staff/:id', adminController.deleteStaff);

router.get('/subjects', adminController.getSubjects);
router.post('/subjects', adminController.createSubject);
router.put('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);

router.get('/exams', adminController.getExams);
router.post('/exams', adminController.createExam);
router.put('/exams/:id', adminController.updateExam);
router.delete('/exams/:id', adminController.deleteExam);

router.get('/marks', adminController.getMarks);
router.post('/marks', adminController.createMark);
router.put('/marks/:id', adminController.updateMark);
router.delete('/marks/:id', adminController.deleteMark);

router.get('/staff-subjects', adminController.getStaffSubjects);
router.post('/staff-subjects', adminController.createStaffSubject);
router.delete('/staff-subjects/:id', adminController.deleteStaffSubject);

router.get('/normalization-rules', adminController.getNormalizationRules);
router.post('/normalization-rules', adminController.createNormalizationRule);
router.put('/normalization-rules/:id', adminController.updateNormalizationRule);
router.delete('/normalization-rules/:id', adminController.deleteNormalizationRule);

module.exports = router;
