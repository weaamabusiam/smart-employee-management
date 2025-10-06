// Auth Controller
const authService = require('../services/authService');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const result = await authService.login(username, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const { id, username, role_id } = req.user;
    
    const userService = require('../services/userService');
    const user = await userService.getUserById(id);
    
    if (user) {
      res.json({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        employee_id: user.emp_code,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department_id: user.department_id,
        department_name: user.department_name
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

