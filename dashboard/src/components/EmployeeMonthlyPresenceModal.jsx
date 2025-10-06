import React, { useState, useEffect } from 'react';
import { getEmployeeMonthlyPresence } from '../services/api';

export default function EmployeeMonthlyPresenceModal({ employee, isOpen, onClose }) {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && employee) {
      loadMonthlyData();
    }
  }, [isOpen, employee, selectedYear, selectedMonth]);

  const loadMonthlyData = async () => {
    if (!employee?.employee_id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployeeMonthlyPresence(employee.employee_id, selectedYear, selectedMonth);
      setMonthlyData(data);
    } catch (err) {
      console.error('Failed to load monthly data:', err);
      setError('Failed to load monthly presence data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalHours = () => {
    return monthlyData.reduce((total, day) => total + day.totalMinutes, 0) / 60;
  };

  const getAverageHours = () => {
    const workingDays = monthlyData.filter(day => day.totalMinutes > 0).length;
    return workingDays > 0 ? getTotalHours() / workingDays : 0;
  };

  if (!isOpen || !employee) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h2 style={styles.title}>
              📊 Monthly Presence - {employee.name}
            </h2>
            <p style={styles.subtitle}>Employee ID: {employee.employee_id}</p>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Month/Year Selector */}
        <div style={styles.selectorContainer}>
          <div style={styles.selectorGroup}>
            <label style={styles.selectorLabel}>Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={styles.selector}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div style={styles.selectorGroup}>
            <label style={styles.selectorLabel}>Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={styles.selector}
            >
              {[
                { value: 1, label: 'January' },
                { value: 2, label: 'February' },
                { value: 3, label: 'March' },
                { value: 4, label: 'April' },
                { value: 5, label: 'May' },
                { value: 6, label: 'June' },
                { value: 7, label: 'July' },
                { value: 8, label: 'August' },
                { value: 9, label: 'September' },
                { value: 10, label: 'October' },
                { value: 11, label: 'November' },
                { value: 12, label: 'December' }
              ].map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={styles.summaryContainer}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{formatTime(getTotalHours() * 60)}</div>
            <div style={styles.statLabel}>Total Hours</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{formatTime(getAverageHours() * 60)}</div>
            <div style={styles.statLabel}>Average per Day</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{monthlyData.filter(day => day.totalMinutes > 0).length}</div>
            <div style={styles.statLabel}>Working Days</div>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <p>Loading monthly data...</p>
            </div>
          ) : error ? (
            <div style={styles.errorContainer}>
              <p style={styles.errorText}>{error}</p>
              <button style={styles.retryButton} onClick={loadMonthlyData}>
                Retry
              </button>
            </div>
          ) : monthlyData.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No presence data found for this month.</p>
            </div>
          ) : (
            <div style={styles.dailyList}>
              {monthlyData.map((day, index) => (
                <div key={index} style={styles.dailyItem}>
                  <div style={styles.dailyDate}>
                    {formatDate(day.date)}
                  </div>
                  <div style={styles.dailyTime}>
                    {formatTime(day.totalMinutes)}
                  </div>
                  <div style={styles.dailySessions}>
                    {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerContent: {
    flex: 1
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px'
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  selectorContainer: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  },
  selectorGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  selectorLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  selector: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  summaryContainer: {
    padding: '20px 24px',
    display: 'flex',
    gap: '20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
  },
  statCard: {
    flex: 1,
    textAlign: 'center',
    padding: '16px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(59, 130, 246, 0.2)'
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#6b7280'
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '40px',
    color: '#dc2626'
  },
  errorText: {
    marginBottom: '16px'
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280'
  },
  dailyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  dailyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '8px',
    border: '1px solid rgba(0, 0, 0, 0.05)'
  },
  dailyDate: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  dailyTime: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1e40af'
  },
  dailySessions: {
    fontSize: '12px',
    color: '#6b7280'
  }
};
