import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getUsers, createUser, updateUser, deleteUser, getEmployees, createEmployee, updateEmployee, deleteEmployee, getDepartments, updateDepartmentManager } from '../services/api';

export default function UserManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ 
    username: '', 
    password: '', 
    role_id: '',
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    department_id: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const roles = [
    { id: 1, name: 'Admin', color: '#ef4444' },
    { id: 2, name: 'Manager', color: '#f59e0b' },
    { id: 3, name: 'Employee', color: '#3b82f6' }
  ];

  useEffect(() => {
    loadUsers();
    loadEmployees();
    loadDepartments();
  }, [user]); // Reload when user changes

  // Debug showForm state changes
  useEffect(() => {
    console.log('showForm state changed to:', showForm);
  }, [showForm]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showForm) {
        handleCancel();
      }
    };

    if (showForm) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showForm]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const getRoleInfo = (roleId) => {
    return roles.find(role => role.id === roleId) || { name: 'Unknown', color: '#6b7280' };
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role_id.toString() === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Convert string values to integers for backend
      const formData = {
        ...form,
        role_id: parseInt(form.role_id),
        department_id: form.department_id ? parseInt(form.department_id) : null
      };
      
      console.log('Form data being sent:', formData);
      
      if (editingId) {
        // Update existing user (backend handles employee record updates)
        await updateUser(editingId, formData);
        
        // If this is a manager, update the department's manager_id
        if (formData.role_id == 2 && formData.department_id) {
          await updateDepartmentManager(formData.department_id, editingId);
        }
        
        setEditingId(null);
        showToast('User updated successfully!');
      } else {
        // Create new user (backend will automatically create employee record if name/email provided)
        const userData = await createUser(formData);
        
        // If this is a manager, update the department's manager_id
        if (formData.role_id == 2 && formData.department_id) {
          await updateDepartmentManager(formData.department_id, userData.id);
        }
        
        showToast('User added successfully!');
      }
      
      // Reload both users and employees
      await loadUsers();
      await loadEmployees();
      
      setForm({ 
        username: '', 
        password: '', 
        role_id: '',
        name: '',
        email: '',
        phone: '',
        employee_id: '',
        department_id: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save:', error);
      console.error('Error details:', error.response?.data || error.message);
      showToast(`Failed to save user: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    console.log('Edit button clicked for user:', user.id);
    console.log('Current showForm state before:', showForm);
    
    // Find employee data for this user
    const employee = employees.find(emp => emp.user_id == user.id);
    
    const formData = { 
      username: user.username, 
      password: '', 
      role_id: user.role_id,
      name: employee?.name || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      employee_id: employee?.employee_id || '',
      department_id: employee?.department_id || ''
    };
    
    console.log('Setting form data:', formData);
    setForm(formData);
    setEditingId(user.id);
    setShowForm(true);
    
    // Small delay to ensure modal renders properly
    setTimeout(() => {
      console.log('Modal should be visible now');
    }, 100);
    
    console.log('Setting showForm to true, editingId to:', user.id);
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete button clicked for user:', id);
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        await loadUsers();
        await loadEmployees();
        showToast('User deleted successfully!');
      } catch (error) {
        console.error('Failed to delete user:', error);
        showToast('Failed to delete user', 'error');
      }
    }
  };

  const handleCancel = () => {
    setForm({ 
      username: '', 
      password: '', 
      role_id: '',
      name: '',
      email: '',
      phone: '',
      employee_id: '',
      department_id: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAddNew = () => {
    setForm({ 
      username: '', 
      password: '', 
      role_id: '',
      name: '',
      email: '',
      phone: '',
      employee_id: '',
      department_id: ''
    });
    setEditingId(null);
    setShowForm(true);
  };

  if (loading && users.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>👤 User Management</h2>
          <button 
            onClick={handleAddNew}
            style={styles.addButton}
          >
            ➕ Add User
          </button>
        </div>
        
        <div style={styles.skeletonUserGrid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={styles.skeletonUserCard}>
              <div style={styles.skeletonUserAvatar}></div>
              <div style={styles.skeletonUserInfo}>
                <div style={styles.skeletonUserName}></div>
                <div style={styles.skeletonUserRole}></div>
                <div style={styles.skeletonUserId}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          .modal-content::-webkit-scrollbar {
            width: 12px;
          }
          .modal-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
          }
          .modal-content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.5);
            border-radius: 6px;
            border: 2px solid rgba(255, 255, 255, 0.1);
          }
          .modal-content::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.7);
          }
        `}
      </style>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          ...styles.toast,
          ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess)
        }}>
          <span style={styles.toastIcon}>
            {toast.type === 'success' ? '✅' : '❌'}
          </span>
          <span style={styles.toastMessage}>{toast.message}</span>
          <button 
            onClick={() => setToast({ show: false, message: '', type: 'success' })}
            style={styles.toastClose}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>👤 User Management</h2>
        <button 
          onClick={handleAddNew}
          style={styles.addButton}
        >
          ➕ Add User
        </button>
      </div>

      {/* Search and Filter Section */}
      <div style={styles.searchFilterSection}>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="🔍 Search users by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterBox}>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Roles</option>
            <option value="1">👑 Admin</option>
            <option value="2">👨‍💼 Manager</option>
            <option value="3">👷 Employee</option>
          </select>
        </div>
        <div style={styles.resultsCount}>
          <span style={styles.resultsText}>
            Showing {filteredUsers.length} of {users.length} users
          </span>
        </div>
      </div>

      {/* Modal Overlay - Rendered as Portal */}
      {showForm && createPortal(
        <div 
          style={styles.modalOverlay} 
          className="modal-overlay" 
          onClick={handleCancel}
        >
          <div style={styles.modalContent} className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingId ? '✏️ Edit User' : '➕ Add New User'}
              </h3>
              <button 
                onClick={handleCancel}
                style={styles.modalCloseButton}
                title="Close"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              {/* Basic User Information */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Username *</label>
                  <input
                    name="username"
                    placeholder="Enter username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Password *</label>
                  <input
                    name="password"
                    type="password"
                    placeholder={editingId ? "Leave blank to keep current" : "Enter password"}
                    value={form.password}
                    onChange={handleChange}
                    required={!editingId}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Role *</label>
                  <select
                    name="role_id"
                    value={form.role_id}
                    onChange={handleChange}
                    required
                    style={styles.select}
                  >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Personal Information - Show for all roles */}
              {form.role_id && (
                <>
                  <div style={styles.sectionDivider}>
                    <h4 style={styles.sectionTitle}>Personal Information</h4>
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Name *</label>
                      <input
                        name="name"
                        placeholder="Enter full name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Email *</label>
                      <input
                        name="email"
                        type="email"
                        placeholder="Enter email address"
                        value={form.email}
                        onChange={handleChange}
                        required
                        style={styles.input}
                      />
                    </div>
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Phone</label>
                      <input
                        name="phone"
                        placeholder="Enter phone number"
                        value={form.phone}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Employee ID *</label>
                      <input
                        name="employee_id"
                        placeholder="Enter Employee ID (e.g., ADMIN001, EMP001)"
                        value={form.employee_id}
                        onChange={handleChange}
                        required
                        style={styles.input}
                      />
                      <small style={styles.helpText}>
                        Unique employee identifier for all users
                      </small>
                    </div>
                  </div>
                </>
              )}

              {/* Department Information - Show only for Employee and Manager roles */}
              {form.role_id && (form.role_id == 2 || form.role_id == 3) && (
                <>
                  <div style={styles.sectionDivider}>
                    <h4 style={styles.sectionTitle}>Department Assignment</h4>
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Department *</label>
                      <select
                        name="department_id"
                        value={form.department_id}
                        onChange={handleChange}
                        required
                        style={styles.select}
                      >
                        <option value="">Select a department</option>
                        {departments.map(dept => {
                          // For managers, only show departments that don't have a manager or are being edited
                          if (form.role_id == 2) {
                            const hasManager = dept.manager_id && dept.manager_id !== form.user_id;
                            if (hasManager && !editingId) {
                              return null; // Don't show departments with existing managers
                            }
                          }
                          return (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                              {form.role_id == 2 && dept.manager_id && dept.manager_id !== form.user_id ? ' (Has Manager)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      {form.role_id == 2 && (
                        <small style={styles.helpText}>
                          Managers can only be assigned to departments without existing managers.
                        </small>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div style={styles.modalActions}>
                <button type="button" onClick={handleCancel} style={styles.cancelButton}>
                  ❌ Cancel
                </button>
                <button type="submit" disabled={loading} style={styles.submitButton}>
                  {loading ? '⏳ Saving...' : (editingId ? '💾 Update User' : '➕ Add User')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* User Cards */}
      <div style={styles.userGrid}>
        {filteredUsers.map(user => {
          const roleInfo = getRoleInfo(user.role_id);
          const employee = employees.find(emp => emp.user_id == user.id);
          
          return (
            <div key={user.id} style={styles.userCard}>
              <div style={styles.userAvatar}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div style={styles.userInfo}>
                <h3 style={styles.userName}>{user.username}</h3>
                <span style={{...styles.userRole, backgroundColor: roleInfo.color}}>
                  {roleInfo.name}
                </span>
                {employee && (
                  <>
                    <p style={styles.userEmail}>{employee.name}</p>
                    <p style={styles.userDepartment}>🏢 {departments.find(d => d.id == employee.department_id)?.name || 'No Department'}</p>
                    {employee.employee_id && (
                      <p style={styles.userBluetooth}>🆔 {employee.employee_id}</p>
                    )}
                  </>
                )}
              </div>
              <div style={styles.userActions}>
                <button
                  onClick={() => handleEdit(user)}
                  style={styles.editButton}
                  title="Edit User"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => handleDelete(user.id, e)}
                  style={styles.deleteButton}
                  title="Delete User"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No users found. Add your first user to get started!</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    width: '100%',
    maxWidth: '100%',
    margin: '0',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '20px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    boxSizing: 'border-box',
    overflow: 'visible'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
    flexWrap: 'wrap',
    gap: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    minWidth: 0
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    background: 'linear-gradient(45deg, #667eea, #764ba2)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    letterSpacing: '-0.02em',
    flex: '1',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  addButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    '&:hover': {
      transform: 'translateY(-3px) scale(1.05)',
      boxShadow: '0 15px 35px rgba(102, 126, 234, 0.4)',
      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
    },
    '&:active': {
      transform: 'translateY(-1px) scale(1.02)'
    }
  },
  searchFilterSection: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
    marginBottom: '2.5rem',
    alignItems: 'center',
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: '1rem'
    }
  },
  searchBox: {
    flex: '1 1 0%',
    minWidth: '200px',
    maxWidth: '400px',
    '@media (max-width: 768px)': {
      maxWidth: '100%'
    }
  },
  searchInput: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    fontSize: '0.95rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    backdropFilter: 'blur(10px)',
    '::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)'
    },
    ':focus': {
      outline: 'none',
      borderColor: '#667eea',
      boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.2)',
      background: 'rgba(255, 255, 255, 0.08)',
      transform: 'translateY(-1px)'
    }
  },
  filterBox: {
    flex: '0 0 auto',
    minWidth: '150px',
    maxWidth: '200px'
  },
  filterSelect: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    fontSize: '0.95rem',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    backdropFilter: 'blur(10px)',
    ':focus': {
      outline: 'none',
      borderColor: '#667eea',
      boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.2)',
      background: 'rgba(255, 255, 255, 0.08)',
      transform: 'translateY(-1px)'
    }
  },
  resultsCount: {
    flex: '0 0 auto',
    minWidth: '150px',
    maxWidth: '200px',
    textAlign: 'right',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  resultsText: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400'
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    width: '100%'
  },
  formGroup: {
    flex: '1',
    minWidth: '250px',
    maxWidth: '100%'
  },
  label: {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '0.75rem',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
  },
  input: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    backdropFilter: 'blur(10px)',
    '::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)'
    },
    ':focus': {
      outline: 'none',
      borderColor: '#667eea',
      boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.2)',
      background: 'rgba(255, 255, 255, 0.08)',
      transform: 'translateY(-1px)'
    }
  },
  select: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer',
    ':focus': {
      outline: 'none',
      borderColor: '#667eea',
      boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.2)',
      background: 'rgba(255, 255, 255, 0.08)',
      transform: 'translateY(-1px)'
    }
  },
  helpText: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: '0.5rem',
    display: 'block',
    fontWeight: '500'
  },
  sectionDivider: {
    margin: '2rem 0 1.5rem 0',
    padding: '1rem 0',
    borderTop: '2px solid rgba(255, 255, 255, 0.1)',
    position: 'relative'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    background: 'linear-gradient(45deg, #667eea, #764ba2)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0',
    padding: '0.5rem 0',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  submitButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
    '&:hover': {
      transform: 'translateY(-3px) scale(1.05)',
      boxShadow: '0 15px 35px rgba(16, 185, 129, 0.4)',
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
    },
    '&:disabled': {
      background: 'rgba(255, 255, 255, 0.1)',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
    }
  },
  cancelButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '1rem 2rem',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    '&:hover': {
      transform: 'translateY(-3px) scale(1.05)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
      background: 'rgba(255, 255, 255, 0.2)',
      color: '#ffffff'
    }
  },
  userGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem'
  },
  userCard: {
    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '200px',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      border: '1px solid rgba(102, 126, 234, 0.4)',
      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)'
    }
  },
  userAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: '700',
    marginBottom: '1rem',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start'
  },
  userInfo: {
    flex: '1'
  },
  userName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 0.5rem 0',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
    letterSpacing: '-0.01em',
    lineHeight: '1.3'
  },
  userRole: {
    display: 'inline-block',
    padding: '0.375rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '0.75rem',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  userEmail: {
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '0 0 0.5rem 0',
    fontWeight: '400',
    lineHeight: '1.4'
  },
  userDepartment: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0 0 0.5rem 0',
    fontWeight: '400',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  userBluetooth: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: '0 0 0.5rem 0',
    fontWeight: '400',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontFamily: 'monospace',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  userId: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.4)',
    margin: '0',
    fontWeight: '400',
    fontFamily: 'monospace'
  },
  userActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto',
    paddingTop: '1rem',
    position: 'relative',
    zIndex: 10
  },
  editButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    position: 'relative',
    zIndex: 11,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
    }
  },
  deleteButton: {
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    position: 'relative',
    zIndex: 11,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(255, 107, 107, 0.4)',
      background: 'linear-gradient(135deg, #ee5a52 0%, #ff6b6b 100%)'
    }
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 1rem',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '1.1rem',
    fontWeight: '500'
  },
  emptyText: {
    fontSize: '1.125rem',
    margin: '0'
  },
  skeletonUserGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  skeletonUserCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    gap: '1rem'
  },
  skeletonUserAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    animation: 'pulse 2s infinite'
  },
  skeletonUserInfo: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  skeletonUserName: {
    height: '1.25rem',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    width: '60%',
    animation: 'pulse 2s infinite'
  },
  skeletonUserRole: {
    height: '1rem',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    width: '40%',
    animation: 'pulse 2s infinite'
  },
  skeletonUserId: {
    height: '0.75rem',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    width: '30%',
    animation: 'pulse 2s infinite'
  },
  toast: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '1rem 2rem',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    zIndex: '9999',
    maxWidth: '500px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#374151',
    animation: 'slideDown 0.3s ease-out',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  toastSuccess: {
    backgroundColor: '#d1fae5',
    border: '1px solid #a7f3d0',
    color: '#065f46'
  },
  toastError: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#991b1b'
  },
  toastIcon: {
    fontSize: '1.25rem'
  },
  toastMessage: {
    fontSize: '0.875rem',
    color: '#374151',
    flex: '1'
  },
  toastClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0.25rem'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
    overflow: 'auto'
  },
  modalContent: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '15px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    margin: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem 2rem 0 2rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  modalTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    background: 'linear-gradient(45deg, #667eea, #764ba2)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  modalCloseButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.8)',
    padding: '0.5rem',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: '#ffffff',
      transform: 'scale(1.1)'
    }
  },
  modalForm: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    justifyContent: 'flex-end'
  }
};