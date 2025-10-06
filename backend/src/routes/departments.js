const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateJWT } = require('../middleware/auth');

router.get('/', authenticateJWT, departmentController.getAllDepartments);
router.get('/available-managers', authenticateJWT, departmentController.getAvailableManagers);
router.get('/:id', authenticateJWT, departmentController.getDepartmentById);
router.get('/:id/employees', authenticateJWT, departmentController.getDepartmentEmployees);
router.post('/', authenticateJWT, departmentController.createDepartment);
router.put('/:id', authenticateJWT, departmentController.updateDepartment);
router.put('/:id/manager', authenticateJWT, departmentController.updateDepartmentManager);
router.delete('/:id', authenticateJWT, departmentController.deleteDepartment);

module.exports = router;
