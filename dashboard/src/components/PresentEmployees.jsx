import React, { useEffect, useState } from 'react';
import { getEmployees } from '../services/api';

export default function PresentEmployees({ user }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadEmployees();
    // Refresh every 10 seconds to get real-time updates
    const interval = setInterval(loadEmployees, 10000);
    return () => clearInterval(interval);
  }, [user]); // Reload when user changes

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load employees:', error);
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const presentEmployees = employees.filter(emp => emp.is_present);
  const absentEmployees = employees.filter(emp => !emp.is_present);

  const getStatusColor = (isPresent) => {
    return isPresent ? '#10b981' : '#ef4444';
  };

  const getStatusIcon = (isPresent) => {
    return isPresent ? '✅' : '❌';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString();
  };

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
        <h2 style={styles.title}>📍 Present Employees</h2>
        <p style={styles.subtitle}>
          Real-time view of employees currently in the office
        </p>
        {lastUpdated && (
          <div style={styles.lastUpdatedContainer}>
            <span style={styles.lastUpdatedIcon}>🔄</span>
            <span style={styles.lastUpdatedText}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <span style={styles.realTimeIndicator}>LIVE</span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>{employees.length}</div>
            <div style={styles.statLabel}>Total Employees</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>{presentEmployees.length}</div>
            <div style={styles.statLabel}>Present</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>❌</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>{absentEmployees.length}</div>
            <div style={styles.statLabel}>Absent</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>
              {employees.length > 0 ? Math.round((presentEmployees.length / employees.length) * 100) : 0}%
            </div>
            <div style={styles.statLabel}>Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Present Employees List */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Currently Present ({presentEmployees.length})
        </h3>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading present employees...</p>
          </div>
        ) : presentEmployees.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🏢</div>
            <h4>No employees present</h4>
            <p>No employees are currently detected in the office.</p>
          </div>
        ) : (
          <div style={styles.employeeGrid}>
            {presentEmployees.map(employee => (
              <div key={employee.id} style={styles.employeeCard}>
                <div style={styles.employeeAvatar}>
                  {employee.name.charAt(0).toUpperCase()}
                </div>
                <div style={styles.employeeInfo}>
                  <h4 style={styles.employeeName}>{employee.name}</h4>
                  <p style={styles.employeeId}>ID: {employee.employee_id}</p>
                  <p style={styles.employeeEmail}>{employee.email}</p>
                </div>
                <div style={styles.employeeStatus}>
                  <div style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(employee.is_present)
                  }}>
                    {getStatusIcon(employee.is_present)} Present
                  </div>
                  <p style={styles.lastSeen}>
                    Last seen: {formatTime(employee.last_seen)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Absent Employees List */}
      <div style={styles.absentSection}>
        <div style={styles.absentHeader}>
          <h3 style={styles.absentTitle}>
            <span style={styles.absentIcon}>❌</span>
            Currently Absent
          </h3>
          <div style={styles.absentCount}>
            {absentEmployees.length}
          </div>
        </div>
        {absentEmployees.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎉</div>
            <h4>All employees present!</h4>
            <p>Everyone is currently in the office.</p>
          </div>
        ) : (
          <div style={styles.absentList}>
            {absentEmployees.map(employee => (
              <div key={employee.id} style={styles.absentItem}>
                <div style={styles.absentAvatar}>
                  {employee.name.charAt(0).toUpperCase()}
                </div>
                <div style={styles.absentInfo}>
                  <div style={styles.absentName}>{employee.name}</div>
                  <div style={styles.absentDetails}>
                    <span style={styles.absentId}>ID: {employee.employee_id}</span>
                    <span style={styles.absentSeparator}>•</span>
                    <span style={styles.absentLastSeen}>
                      Last seen: {formatTime(employee.last_seen)}
                    </span>
                  </div>
                </div>
                <div style={styles.absentStatus}>
                  <div style={styles.absentBadge}>
                    {getStatusIcon(employee.is_present)} Absent
                  </div>
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
    marginBottom: '2.5rem',
    textAlign: 'center',
    padding: '2rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 0.5rem 0',
    textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
  },
  subtitle: {
    fontSize: '1.2rem',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0',
    fontWeight: '400'
  },
  lastUpdatedContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '1.5rem',
    padding: '0.75rem 1.5rem',
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    backdropFilter: 'blur(10px)'
  },
  lastUpdatedIcon: {
    fontSize: '1rem',
    animation: 'spin 2s linear infinite',
    color: '#10b981'
  },
  lastUpdatedText: {
    fontSize: '0.9rem',
    color: '#10b981',
    fontWeight: '600'
  },
  realTimeIndicator: {
    fontSize: '0.8rem',
    color: '#ffffff',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    padding: '0.4rem 0.8rem',
    borderRadius: '20px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem'
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '2rem',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      borderColor: 'rgba(102, 126, 234, 0.5)'
    }
  },
  statIcon: {
    fontSize: '2.5rem',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
  },
  statContent: {
    flex: '1'
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  },
  statLabel: {
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0',
    fontWeight: '500'
  },
  section: {
    marginBottom: '2.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    padding: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 1.5rem 0',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  employeeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem'
  },
  employeeCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1.5rem',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      borderColor: 'rgba(102, 126, 234, 0.5)'
    }
  },
  employeeAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '700',
    boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
    border: '2px solid rgba(255, 255, 255, 0.2)'
  },
  employeeInfo: {
    flex: '1'
  },
  employeeName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 0.5rem 0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  },
  employeeId: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0 0 0.25rem 0',
    fontWeight: '500'
  },
  employeeEmail: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0 0 0.25rem 0'
  },
  employeeMac: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: '0',
    fontFamily: 'monospace'
  },
  employeeStatus: {
    textAlign: 'right'
  },
  statusBadge: {
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '25px',
    fontSize: '0.8rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    display: 'inline-block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
  },
  lastSeen: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0',
    fontWeight: '500'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)'
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1.5rem',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '4rem 2rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)'
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1.5rem auto',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
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
  // Absent employees specific styles
  absentSection: {
    marginBottom: '2.5rem',
    background: 'rgba(239, 68, 68, 0.05)',
    borderRadius: '16px',
    padding: '2rem',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(239, 68, 68, 0.1)'
  },
  absentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(239, 68, 68, 0.2)'
  },
  absentTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#ef4444',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  absentIcon: {
    fontSize: '1.25rem',
    filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))'
  },
  absentCount: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#ef4444',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
    padding: '0.5rem 1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    backdropFilter: 'blur(10px)',
    WebkitBackgroundClip: 'unset',
    WebkitTextFillColor: 'unset'
  },
  absentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  absentItem: {
    background: 'rgba(239, 68, 68, 0.05)',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      background: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.25)',
      transform: 'translateX(4px)',
      boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)'
    }
  },
  absentAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: '700',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
    border: '2px solid rgba(239, 68, 68, 0.3)',
    flexShrink: 0
  },
  absentInfo: {
    flex: '1',
    minWidth: 0
  },
  absentName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 0.25rem 0',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
  },
  absentDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.6)',
    flexWrap: 'wrap'
  },
  absentId: {
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  absentSeparator: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 'bold'
  },
  absentLastSeen: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic'
  },
  absentStatus: {
    flexShrink: 0
  },
  absentBadge: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '0.4rem 0.8rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  }
};
