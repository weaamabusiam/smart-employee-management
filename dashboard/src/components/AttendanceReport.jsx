import React, { useEffect, useState } from 'react';
import { getAttendance } from '../services/api';

export default function AttendanceReport({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadAttendance();
  }, [user]);

  useEffect(() => {
    filterLogsByEmployee();
  }, [logs, employeeFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await getAttendance();
      console.log('Loaded attendance data:', data.slice(0, 2)); // Debug log
      setLogs(data);
      showToast('Attendance data refreshed successfully!');
    } catch (error) {
      console.error('Failed to load attendance:', error);
      showToast('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterLogsByEmployee = () => {
    if (!employeeFilter.trim()) {
      setFilteredLogs(logs);
    } else {
      const filterLower = employeeFilter.toLowerCase();
      const filtered = logs.filter(log => {
        const nameMatch = log.employee_name && log.employee_name.toLowerCase().includes(filterLower);
        const codeMatch = log.employee_code && log.employee_code.toLowerCase().includes(filterLower);
        const departmentMatch = log.department_name && log.department_name.toLowerCase().includes(filterLower);
        return nameMatch || codeMatch || departmentMatch;
      });
      setFilteredLogs(filtered);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'late': return '⏰';
      default: return '❓';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>📊 Recent Attendance Logs</h2>
          <button 
            onClick={loadAttendance}
            style={styles.refreshButton}
            title="Refresh Data"
          >
            🔄 Refresh
          </button>
        </div>
        
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p>Loading attendance data...</p>
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
        <h2 style={styles.title}>📊 Recent Attendance Logs</h2>
        <button 
          onClick={loadAttendance}
          style={styles.refreshButton}
          title="Refresh Data"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Employee Filter */}
      <div style={styles.filterSection}>
        <div style={styles.filterControls}>
          <input
            type="text"
            placeholder="🔍 Filter by employee name, code, or department..."
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            style={styles.employeeFilter}
          />
          <span style={styles.filterInfo}>
            Showing {filteredLogs.length} of {logs.length} records
          </span>
        </div>
      </div>

      {/* Attendance Logs */}
      <div style={styles.logsSection}>
        {filteredLogs.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              {employeeFilter ? 'No employees found matching your filter.' : 'No attendance records found.'}
            </p>
          </div>
        ) : (
          <div style={styles.logsTable}>
            <div style={styles.tableHeader}>
              <div style={styles.headerCell}>Status</div>
              <div style={styles.headerCell}>Employee</div>
              <div style={styles.headerCell}>Code</div>
              <div style={styles.headerCell}>Department</div>
              <div style={styles.headerCell}>Time</div>
              <div style={styles.headerCell}>Source</div>
            </div>
            {filteredLogs.map(log => (
              <div key={log.id} style={styles.tableRow}>
                <div style={styles.tableCell}>
                  <span style={{...styles.statusBadge, backgroundColor: getStatusColor(log.status)}}>
                    {getStatusIcon(log.status)} {log.status.toUpperCase()}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  <span style={styles.employeeName}>{log.employee_name || 'Unknown Employee'}</span>
                </div>
                <div style={styles.tableCell}>
                  <span style={styles.employeeCode}>{log.employee_code || log.employee_id}</span>
                </div>
                <div style={styles.tableCell}>
                  <span style={styles.department}>{log.department_name || '-'}</span>
                </div>
                <div style={styles.tableCell}>
                  <span style={styles.timestamp}>{formatDate(log.timestamp)}</span>
                </div>
                <div style={styles.tableCell}>
                  <span style={styles.source}>{log.source || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
    color: '#ffffff'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '20px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  refreshButton: {
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
    '&:hover': {
      backgroundColor: '#3730a3',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)'
    }
  },
  filterSection: {
    marginBottom: '2rem',
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  filterControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  employeeFilter: {
    flex: 1,
    minWidth: '300px',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    fontSize: '1rem',
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.6)'
    },
    '&:focus': {
      outline: 'none',
      borderColor: '#4f46e5',
      boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)'
    }
  },
  filterInfo: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.7)',
    whiteSpace: 'nowrap'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  },
  logsSection: {
    marginBottom: '2rem'
  },
  logsTable: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 100px 120px 180px 150px',
    gap: '1rem',
    padding: '1rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    fontWeight: '600',
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 100px 120px 180px 150px',
    gap: '1rem',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.05)'
    },
    '&:last-child': {
      borderBottom: 'none'
    }
  },
  tableCell: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '24px'
  },
  headerCell: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  employeeName: {
    fontSize: '1rem',
    color: '#ffffff',
    fontWeight: '600'
  },
  employeeCode: {
    fontSize: '0.9rem',
    color: 'rgba(59, 130, 246, 0.9)',
    fontWeight: '500'
  },
  department: {
    fontSize: '0.9rem',
    color: 'rgba(16, 185, 129, 0.9)',
    fontWeight: '500'
  },
  timestamp: {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500'
  },
  source: {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  emptyText: {
    fontSize: '1.1rem',
    margin: 0
  },
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: '500',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: '400px',
    animation: 'slideIn 0.3s ease-out'
  },
  toastSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)'
  },
  toastError: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)'
  },
  toastIcon: {
    fontSize: '1.2rem'
  },
  toastMessage: {
    flex: 1
  },
  toastClose: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)'
    }
  }
};