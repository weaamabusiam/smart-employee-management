import React, { useState, useEffect } from 'react';
import EmployeeTable from './components/EmployeeTable';
import AttendanceReport from './components/AttendanceReport';
import UserManagement from './components/UserManagement';
import DepartmentManagement from './components/DepartmentManagement';
import PresentEmployees from './components/PresentEmployees';
import Esp32Devices from './components/Esp32Devices';
import LoginForm from './components/LoginForm';
import { getCurrentUser, setAuthToken } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('employees');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add CSS animations for notifications
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Define all possible tabs
  const allTabs = [
    { id: 'employees', label: 'Employees', icon: '👥', roles: [1, 2] }, // Admin, Manager
    { id: 'attendance', label: 'Attendance', icon: '📊', roles: [1, 2] }, // Admin, Manager
    { id: 'present', label: 'Present', icon: '📍', roles: [1, 2] }, // Admin, Manager
    { id: 'esp32', label: 'ESP32', icon: '🔧', roles: [1] }, // Admin only
    { id: 'departments', label: 'Departments', icon: '🏢', roles: [1] }, // Admin only
    { id: 'users', label: 'Users', icon: '👤', roles: [1] } // Admin only
  ];

  // Filter tabs based on user role
  const tabs = user ? allTabs.filter(tab => tab.roles.includes(user.role_id)) : [];

  useEffect(() => {
    checkAuth();
  }, []);

  // Load saved tab from localStorage when user changes
  useEffect(() => {
    if (user) {
      console.log('User changed, updating UI for user:', user);
      const savedTab = localStorage.getItem('activeTab');
      if (savedTab) {
        // Check if the saved tab is valid for the current user's role
        const validTabs = allTabs.filter(tab => tab.roles.includes(user.role_id));
        const isValidTab = validTabs.some(tab => tab.id === savedTab);
        if (isValidTab) {
          setActiveTab(savedTab);
        }
      }
      // Force a re-render by toggling a state
      setLoading(prev => !prev);
      setTimeout(() => setLoading(false), 100);
    }
  }, [user]);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('authToken');
        setAuthToken(null);
      }
    }
    setLoading(false);
  };

  const handleLogin = (loginResponse) => {
    console.log('Login successful, setting user:', loginResponse);
    // Extract the user object from the login response
    const userData = loginResponse.user || loginResponse;
    setUser(userData);
    setIsAuthenticated(true);
    // Force a re-render by updating a dummy state
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeTab');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem('activeTab', tabId);
  };

  const renderContent = () => {
    // Add user.id as key to force re-render when user changes
    const key = user ? user.id : 'no-user';
    console.log('Rendering content for user:', user, 'key:', key, 'activeTab:', activeTab);
    console.log('User type:', typeof user, 'User keys:', user ? Object.keys(user) : 'no user');
    
    switch (activeTab) {
      case 'employees':
        return <EmployeeTable key={key} user={user} />;
      case 'attendance':
        return <AttendanceReport key={key} user={user} />;
      case 'present':
        return <PresentEmployees key={key} user={user} />;
      case 'esp32':
        return <Esp32Devices key={key} user={user} />;
      case 'departments':
        return <DepartmentManagement key={key} user={user} />;
      case 'users':
        return <UserManagement key={key} user={user} />;
      default:
        return <EmployeeTable key={key} user={user} />;
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Check if user is an employee (role_id: 3) - they should not access dashboard
  if (user && user.role_id === 3) {
    return (
      <div style={styles.accessDeniedContainer}>
        <div style={styles.accessDeniedContent}>
          <h1 style={styles.accessDeniedTitle}>🚫 Access Denied</h1>
          <p style={styles.accessDeniedMessage}>
            Employees cannot access the dashboard. Please use the mobile app instead.
          </p>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>🏢 Employee Attendance System</h1>
            <p style={styles.subtitle}>Manage employees, track attendance, and monitor system performance</p>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.userInfo}>Welcome, {user?.username}</span>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.content}>
          {/* Tab Navigation */}
          <div style={styles.tabContainer}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.activeTab : {})
                }}
              >
                <span style={styles.tabIcon}>{tab.icon}</span>
                <span style={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={styles.tabContent}>
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2024 Attendance System - Built with React & Node.js</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0f',
    background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 50%, #000000 100%)',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff',
    position: 'relative'
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-10px)' }
  },
  '@keyframes glow': {
    '0%, 100%': { boxShadow: '0 0 20px rgba(102, 126, 234, 0.3)' },
    '50%': { boxShadow: '0 0 40px rgba(102, 126, 234, 0.6)' }
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    position: 'relative',
    overflow: 'hidden',
    padding: '0',
    backdropFilter: 'blur(20px)'
  },
  headerContent: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2
  },
  headerLeft: {
    textAlign: 'left',
    flex: 1
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flexShrink: 0
  },
  userInfo: {
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: '600',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '50px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease'
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0f',
    background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)'
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1.5rem'
  },
  title: {
    fontSize: '3rem',
    fontWeight: '800',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(45deg, #ffffff, #f0f9ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
    letterSpacing: '-0.02em',
    animation: 'float 6s ease-in-out infinite'
  },
  subtitle: {
    fontSize: '1.2rem',
    margin: '0',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    letterSpacing: '0.01em'
  },
  main: {
    flex: '1',
    padding: '0',
    background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)'
  },
  content: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem 1rem'
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px 20px 0 0',
    padding: '0.5rem',
    marginBottom: '0',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box'
  },
  tab: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.25rem 0.75rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '16px 16px 0 0',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.9rem',
    fontWeight: '500',
    minWidth: '0',
    position: 'relative',
    minHeight: '90px',
    justifyContent: 'center'
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontWeight: '700',
    boxShadow: '0 -4px 20px rgba(102, 126, 234, 0.3)',
    transform: 'translateY(-2px)',
    animation: 'glow 2s ease-in-out infinite'
  },
  tabIcon: {
    fontSize: '1.75rem',
    marginBottom: '0.5rem',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
  },
  tabLabel: {
    fontSize: '0.9rem',
    fontWeight: 'inherit',
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em'
  },
  tabContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0 0 20px 20px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    minHeight: '600px',
    padding: '0',
    width: '100%',
    overflow: 'visible',
    boxSizing: 'border-box'
  },
  footer: {
    textAlign: 'center',
    padding: '2rem',
    color: 'rgba(255, 255, 255, 0.6)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)'
  },
  accessDeniedContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0f',
    background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)',
    padding: '2rem'
  },
  accessDeniedContent: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    maxWidth: '500px',
    width: '100%'
  },
  accessDeniedTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#ff6b6b',
    margin: '0 0 1rem 0',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  accessDeniedMessage: {
    fontSize: '1.2rem',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '0 0 2rem 0',
    lineHeight: '1.6'
  }
};

