import React, { useEffect, useState } from 'react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getAvailableManagers } from '../services/api';

export default function DepartmentManagement({ user }) {
  const [departments, setDepartments] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDepartments();
    loadAvailableManagers();
  }, [user]); // Reload when user changes

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

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
      showToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableManagers = async () => {
    try {
      const data = await getAvailableManagers();
      setAvailableManagers(data);
    } catch (error) {
      console.error('Failed to load available managers:', error);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await updateDepartment(editingId, form);
        showToast('Department updated successfully!');
      } else {
        await createDepartment(form);
        showToast('Department created successfully!');
      }
      await loadDepartments();
      handleCancel();
    } catch (error) {
      console.error('Failed to save department:', error);
      showToast('Failed to save department', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department) => {
    setForm({
      name: department.name,
      description: department.description || ''
    });
    setEditingId(department.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await deleteDepartment(id);
        await loadDepartments();
        showToast('Department deleted successfully!');
      } catch (error) {
        console.error('Failed to delete department:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to delete department';
        showToast(errorMessage, 'error');
      }
    }
  };

  const handleCancel = () => {
    setForm({ name: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAddNew = () => {
    setForm({ name: '', description: '' });
    setEditingId(null);
    setShowForm(true);
  };

  if (loading && departments.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p>Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          ...styles.toast,
          backgroundColor: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: toast.type === 'error' ? '#dc2626' : '#166534'
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🏢 Department Management</h2>
      </div>


      {/* Search and Filter */}
      <div style={styles.searchSection}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <button onClick={handleAddNew} style={styles.addButton}>
          ➕ Add Department
        </button>
      </div>

      {/* Modal Overlay */}
      {showForm && (
        <div style={styles.modalOverlay} onClick={handleCancel}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingId ? '✏️ Edit Department' : '➕ Add New Department'}
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
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Department Name *</label>
                  <input
                    name="name"
                    placeholder="Enter department name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    name="description"
                    placeholder="Enter department description (optional)"
                    value={form.description}
                    onChange={handleChange}
                    style={styles.textarea}
                    rows="3"
                  />
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="submit" disabled={loading} style={styles.submitButton}>
                  {loading ? '⏳ Saving...' : (editingId ? '💾 Update Department' : '➕ Add Department')}
                </button>
                <button type="button" onClick={handleCancel} style={styles.cancelButton}>
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Departments Grid */}
      <div style={styles.departmentsGrid}>
        {filteredDepartments.map(dept => (
          <div key={dept.id} style={styles.departmentCard}>
            <div style={styles.departmentContent}>
              <div style={styles.departmentHeader}>
                <h3 style={styles.departmentName}>{dept.name}</h3>
                <div style={styles.departmentActions}>
                  <button
                    onClick={() => handleEdit(dept)}
                    style={styles.editButton}
                    title="Edit Department"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    style={styles.deleteButton}
                    title="Delete Department"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {dept.description && (
                <p style={styles.departmentDescription}>{dept.description}</p>
              )}
              {dept.manager_username && (
                <div style={styles.managerInfo}>
                  <span style={styles.managerLabel}>👤 Manager:</span>
                  <span style={styles.managerName}>{dept.manager_username}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🏢</div>
          <h4>No departments found</h4>
          <p>Create your first department to get started.</p>
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
  subtitle: {
    fontSize: '1.2rem',
    margin: '0',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    letterSpacing: '0.01em'
  },
  searchSection: {
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
  searchContainer: {
    flex: '1 1 0%',
    minWidth: '300px'
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
  formCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem'
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 1.5rem 0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  formGroup: {
    flex: '1',
    minWidth: '200px'
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
  textarea: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
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
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    flexWrap: 'wrap'
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
  departmentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    alignItems: 'start'
  },
  departmentCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    padding: '2rem',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '200px',
    '&:hover': {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      border: '1px solid rgba(102, 126, 234, 0.3)',
      background: 'rgba(255, 255, 255, 0.08)'
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: 'linear-gradient(90deg, #667eea, #764ba2)',
      opacity: 0,
      transition: 'opacity 0.3s ease'
    },
    '&:hover::before': {
      opacity: 1
    }
  },
  departmentContent: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column'
  },
  departmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  departmentName: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 0.75rem 0',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    letterSpacing: '-0.01em',
    flex: '1'
  },
  departmentActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  editButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
    '&:hover': {
      transform: 'translateY(-2px) scale(1.05)',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
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
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
    '&:hover': {
      transform: 'translateY(-2px) scale(1.05)',
      boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4)',
      background: 'linear-gradient(135deg, #ee5a52 0%, #ff6b6b 100%)'
    }
  },
  departmentDescription: {
    fontSize: '0.95rem',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0 0 1.5rem 0',
    lineHeight: '1.6',
    fontWeight: '500'
  },
  departmentFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: 'auto',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  },
  departmentId: {
    fontFamily: 'monospace'
  },
  departmentDate: {
    fontStyle: 'italic'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem auto'
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
    animation: 'slideDown 0.3s ease-out'
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
  managerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.75rem',
    padding: '0.5rem',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  },
  managerLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151'
  },
  managerName: {
    fontSize: '0.875rem',
    color: '#4f46e5',
    fontWeight: '500'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modalContent: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
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
    borderTop: '1px solid #e5e7eb',
    justifyContent: 'flex-end'
  }
};
