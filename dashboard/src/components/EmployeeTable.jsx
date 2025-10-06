import React, { useEffect, useState } from 'react';
import { getEmployees } from '../services/api';
import EmployeeMonthlyPresenceModal from './EmployeeMonthlyPresenceModal';

export default function EmployeeTable({ user }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log('EmployeeTable received user:', user);

  useEffect(() => {
    console.log('EmployeeTable useEffect triggered with user:', user);
    if (user) {
      loadEmployees();
    }
  }, [user]); // Reload when user changes

  // Additional useEffect to ensure data loads when component mounts
  useEffect(() => {
    console.log('EmployeeTable component mounted, loading employees...');
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      console.log('Loading employees...');
      setLoading(true);
      const data = await getEmployees();
      console.log('Employees loaded:', data.length, 'employees');
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (emp.phone && emp.phone.includes(searchTerm)) ||
                         (emp.employee_id && emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (emp.role_name && emp.role_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>👥 Employee Directory</h2>
        </div>
        
        <div style={styles.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={styles.skeletonCard}>
              <div style={styles.skeletonAvatar}></div>
              <div style={styles.skeletonContent}>
                <div style={{...styles.skeletonLine, width: '70%'}}></div>
                <div style={{...styles.skeletonLine, width: '90%'}}></div>
                <div style={{...styles.skeletonLine, width: '50%'}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>👥 Employee Directory</h2>
        </div>
        <div style={styles.readOnlyBadge}>
          <span style={styles.readOnlyIcon}>👁️</span>
          <span style={styles.readOnlyText}>Read Only</span>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div style={styles.searchFilterSection}>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="🔍 Search employees by name, email, phone, employee ID, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.resultsCount}>
          <span style={styles.resultsText}>
            Showing {filteredEmployees.length} of {employees.length} employees
          </span>
        </div>
      </div>

      {/* Employee Cards */}
      <div style={styles.employeeGrid}>
        {filteredEmployees.map(emp => (
          <div 
            key={emp.id} 
            style={styles.employeeCard}
            onClick={() => handleEmployeeClick(emp)}
          >
            <div style={styles.employeeAvatar}>
              {emp.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.employeeInfo}>
              <h3 style={styles.employeeName}>{emp.name}</h3>
              <p style={styles.employeeId}>🆔 {emp.employee_id}</p>
              {emp.role_name && <p style={styles.employeeRole}>👤 {emp.role_name}</p>}
              <p style={styles.employeeEmail}>{emp.email}</p>
              {emp.department_name && <p style={styles.employeeDepartment}>🏢 {emp.department_name}</p>}
              {emp.phone && <p style={styles.employeePhone}>📞 {emp.phone}</p>}
            </div>
            <div style={styles.clickHint}>
              <span style={styles.clickHintText}>📊 Click to view monthly presence</span>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No employees found. Add your first employee to get started!</p>
        </div>
      )}

      {/* Monthly Presence Modal */}
      <EmployeeMonthlyPresenceModal
        employee={selectedEmployee}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
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
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: '1'
    },
    '50%': {
      opacity: '0.5'
    }
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
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    flexShrink: '0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    ':hover': {
      backgroundColor: '#3730a3',
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    ':active': {
      transform: 'translateY(0)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }
  },
  formCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
    border: '1px solid #e2e8f0',
    width: '100%',
    boxSizing: 'border-box'
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 1rem 0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%'
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
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box'
  },
  helpText: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem',
    display: 'block'
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '0.75rem'
    }
  },
  submitButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    ':hover': {
      backgroundColor: '#059669',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    ':active': {
      transform: 'translateY(0)'
    }
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    ':hover': {
      backgroundColor: '#4b5563',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    ':active': {
      transform: 'translateY(0)'
    }
  },
  employeeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '1rem'
    },
    '@media (min-width: 1200px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '2rem'
    }
  },
  employeeCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    padding: '2rem',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer',
    position: 'relative',
    ':hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
      border: '1px solid rgba(59, 130, 246, 0.3)'
    },
    ':hover $clickHint': {
      opacity: 1
    }
  },
  clickHint: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none'
  },
  clickHintText: {
    fontSize: '12px',
    color: 'rgba(59, 130, 246, 0.8)',
    fontWeight: '500',
    background: 'rgba(59, 130, 246, 0.1)',
    padding: '4px 8px',
    borderRadius: '12px',
    border: '1px solid rgba(59, 130, 246, 0.2)'
  },
  employeeAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '1rem'
  },
  employeeInfo: {
    marginBottom: '1rem'
  },
  employeeName: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 0.75rem 0',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    letterSpacing: '-0.01em'
  },
  employeeEmail: {
    fontSize: '0.95rem',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0 0 0.75rem 0',
    fontWeight: '500'
  },
  employeePhone: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0 0 0.75rem 0',
    fontWeight: '500'
  },
  employeeMac: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: '0 0 0.75rem 0',
    fontWeight: '500'
  },
  employeeDepartment: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '0 0 0.75rem 0',
    fontWeight: '600'
  },
  employeeStatus: {
    fontSize: '0.875rem',
    fontWeight: '500',
    margin: '0 0 0.25rem 0'
  },
  employeeId: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '0 0 0.5rem 0',
    fontFamily: 'monospace',
    fontWeight: '600',
    background: 'rgba(102, 126, 234, 0.2)',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    display: 'inline-block'
  },
  employeeRole: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0 0 0.5rem 0',
    fontWeight: '500',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    display: 'inline-block'
  },
  employeeActions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  editButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    ':hover': {
      backgroundColor: '#d97706',
      transform: 'scale(1.05)',
      boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15)'
    },
    ':active': {
      transform: 'scale(1)'
    }
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    ':hover': {
      backgroundColor: '#dc2626',
      transform: 'scale(1.05)',
      boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15)'
    },
    ':active': {
      transform: 'scale(1)'
    }
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#64748b',
    width: '100%'
  },
  emptyText: {
    fontSize: '1.125rem',
    margin: '0'
  },
  skeletonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    width: '100%'
  },
  skeletonCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    width: '100%',
    boxSizing: 'border-box'
  },
  skeletonAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    animation: 'pulse 1.5s infinite ease-in-out'
  },
  skeletonContent: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  skeletonLine: {
    height: '0.875rem',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    animation: 'pulse 1.5s infinite ease-in-out'
  },
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    zIndex: '1000',
    borderLeft: '4px solid #10b981' // Default to success color
  },
  toastSuccess: {
    borderLeft: '4px solid #10b981'
  },
  toastError: {
    borderLeft: '4px solid #ef4444'
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
    flex: '1',
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
    minWidth: '150px',
    maxWidth: '200px'
  },
  filterSelect: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    fontSize: '0.95rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    cursor: 'pointer',
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
    minWidth: '150px',
    maxWidth: '200px',
    textAlign: 'right'
  },
  resultsText: {
    fontSize: '0.875rem',
    color: '#64748b'
  }
};

