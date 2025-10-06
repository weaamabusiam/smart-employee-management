import React, { useEffect, useState } from 'react';
import { getEsp32Devices, createEsp32Device, updateEsp32Device, deleteEsp32Device } from '../services/api';

export default function Esp32Devices({ user }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [form, setForm] = useState({ esp32_id: '', location: '', description: '', status: 'active' });

  useEffect(() => {
    loadDevices();
    // Refresh every 15 seconds to get real-time updates
    const interval = setInterval(loadDevices, 15000);
    return () => clearInterval(interval);
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

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await getEsp32Devices();
      setDevices(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load ESP32 devices:', error);
      showToast('Failed to load ESP32 devices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#ef4444';
      case 'maintenance': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '✅';
      case 'inactive': return '❌';
      case 'maintenance': return '🔧';
      default: return '❓';
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const isDeviceOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 5; // Online if last seen within 5 minutes
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingDevice) {
        await updateEsp32Device(editingDevice.id, form);
        showToast('ESP32 device updated successfully!');
      } else {
        await createEsp32Device(form);
        showToast('ESP32 device created successfully!');
      }
      
      setForm({ esp32_id: '', location: '', description: '', status: 'active' });
      setShowForm(false);
      setEditingDevice(null);
      await loadDevices();
    } catch (error) {
      console.error('Failed to save ESP32 device:', error);
      showToast('Failed to save ESP32 device', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (device) => {
    setForm({
      esp32_id: device.esp32_id,
      location: device.location || '',
      description: device.description || '',
      status: device.status
    });
    setEditingDevice(device);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ESP32 device?')) {
      try {
        await deleteEsp32Device(id);
        await loadDevices();
        showToast('ESP32 device deleted successfully!');
      } catch (error) {
        console.error('Failed to delete ESP32 device:', error);
        showToast('Failed to delete ESP32 device', 'error');
      }
    }
  };

  const handleCancel = () => {
    setForm({ esp32_id: '', location: '', description: '', status: 'active' });
    setShowForm(false);
    setEditingDevice(null);
  };

  const handleAddNew = () => {
    setForm({ esp32_id: '', location: '', description: '', status: 'active' });
    setEditingDevice(null);
    setShowForm(true);
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
        <h2 style={styles.title}>🔧 ESP32 Devices</h2>
        <button onClick={handleAddNew} style={styles.addButton}>
          ➕ Add Device
        </button>
      </div>

      {/* Last Updated Section */}
      {lastUpdated && (
        <div style={styles.lastUpdatedContainer}>
          <span style={styles.lastUpdatedIcon}>🔄</span>
          <span style={styles.lastUpdatedText}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <span style={styles.realTimeIndicator}>LIVE</span>
        </div>
      )}

      {/* Modal Overlay */}
      {showForm && (
        <div style={styles.modalOverlay} onClick={handleCancel}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingDevice ? '✏️ Edit ESP32 Device' : '➕ Add New ESP32 Device'}
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
                  <label style={styles.label}>ESP32 ID *</label>
                  <input
                    name="esp32_id"
                    placeholder="Enter ESP32 ID (e.g., ESP32_001)"
                    value={form.esp32_id}
                    onChange={handleFormChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    style={styles.select}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location *</label>
                  <input
                    name="location"
                    placeholder="Enter device location (e.g., Main Entrance)"
                    value={form.location}
                    onChange={handleFormChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <input
                    name="description"
                    placeholder="Enter device description"
                    value={form.description}
                    onChange={handleFormChange}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="submit" disabled={loading} style={styles.submitButton}>
                  {loading ? '⏳ Saving...' : (editingDevice ? '💾 Update Device' : '➕ Add Device')}
                </button>
                <button type="button" onClick={handleCancel} style={styles.cancelButton}>
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🔧</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>{devices.length}</div>
            <div style={styles.statLabel}>Total Devices</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>
              {devices.filter(d => d.status === 'active').length}
            </div>
            <div style={styles.statLabel}>Active</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>❌</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>
              {devices.filter(d => d.status === 'inactive').length}
            </div>
            <div style={styles.statLabel}>Inactive</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🟢</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>
              {devices.filter(d => isDeviceOnline(d.last_seen)).length}
            </div>
            <div style={styles.statLabel}>Online</div>
          </div>
        </div>
      </div>

      {/* Devices List */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Device Status ({devices.length})
        </h3>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading ESP32 devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔧</div>
            <h4>No ESP32 devices found</h4>
            <p>No ESP32 scanner devices are registered in the system.</p>
          </div>
        ) : (
          <div style={styles.deviceGrid}>
            {devices.map(device => (
              <div key={device.id} style={styles.deviceCard}>
                <div style={styles.deviceHeader}>
                  <div style={styles.deviceId}>
                    <span style={styles.deviceIcon}>🔧</span>
                    <span style={styles.deviceName}>{device.esp32_id}</span>
                  </div>
                  <div style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(device.status)
                  }}>
                    {getStatusIcon(device.status)} {device.status.toUpperCase()}
                  </div>
                </div>
                
                <div style={styles.deviceInfo}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>📍 Location:</span>
                    <span style={styles.infoValue}>{device.location || 'Not specified'}</span>
                  </div>
                  {device.description && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>📝 Description:</span>
                      <span style={styles.infoValue}>{device.description}</span>
                    </div>
                  )}
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>🕒 Last Seen:</span>
                    <span style={{
                      ...styles.infoValue,
                      color: isDeviceOnline(device.last_seen) ? '#10b981' : '#ef4444'
                    }}>
                      {formatLastSeen(device.last_seen)}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>📅 Created:</span>
                    <span style={styles.infoValue}>
                      {new Date(device.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={styles.deviceStatus}>
                  <div style={{
                    ...styles.onlineIndicator,
                    backgroundColor: isDeviceOnline(device.last_seen) ? '#10b981' : '#ef4444'
                  }}>
                    {isDeviceOnline(device.last_seen) ? '🟢 ONLINE' : '🔴 OFFLINE'}
                  </div>
                </div>

                <div style={styles.deviceActions}>
                  <button
                    onClick={() => handleEdit(device)}
                    style={styles.editButton}
                    title="Edit Device"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(device.id)}
                    style={styles.deleteButton}
                    title="Delete Device"
                  >
                    🗑️
                  </button>
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
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
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
    fontSize: '1.1rem',
    color: '#64748b',
    margin: '0'
  },
  lastUpdatedContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginTop: '1rem',
    marginBottom: '2rem',
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
  deviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '1.5rem'
  },
  deviceCard: {
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
      height: '3px',
      background: 'linear-gradient(90deg, #667eea, #764ba2)',
      opacity: 0,
      transition: 'opacity 0.3s ease'
    },
    '&:hover::before': {
      opacity: 1
    }
  },
  deviceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  deviceId: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  deviceIcon: {
    fontSize: '1.25rem'
  },
  deviceName: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 0.75rem 0',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    letterSpacing: '-0.01em'
  },
  statusBadge: {
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
  },
  deviceInfo: {
    marginBottom: '1rem'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  infoLabel: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600'
  },
  infoValue: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500'
  },
  deviceStatus: {
    textAlign: 'center'
  },
  onlineIndicator: {
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    display: 'inline-block'
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
  addButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50px',
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
    backdropFilter: 'blur(10px)',
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
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
    border: '1px solid #e2e8f0'
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
    gap: '1rem'
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  formGroup: {
    flex: '1',
    minWidth: '250px'
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
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem'
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
  deviceActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
    justifyContent: 'center'
  },
  editButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
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
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
    '&:hover': {
      transform: 'translateY(-2px) scale(1.05)',
      boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4)',
      background: 'linear-gradient(135deg, #ee5a52 0%, #ff6b6b 100%)'
    }
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
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.6)',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff'
    }
  },
  modalForm: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
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
