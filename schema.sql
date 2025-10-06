-- schema.sql: Initial database schema for Attendance System

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    is_present BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP NULL,
    department_id INT,
    user_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE attendance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('present', 'absent', 'late') NOT NULL,
    source VARCHAR(50), -- e.g., ESP32, manual
    esp32_id VARCHAR(50), -- ESP32 device identifier
    rssi INT, -- Signal strength from ESP32
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE esp32_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    esp32_id VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(100),
    description TEXT,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('employee');

INSERT INTO departments (name, description) VALUES 
('IT', 'Information Technology Department'),
('HR', 'Human Resources Department'),
('Finance', 'Finance and Accounting Department');

INSERT INTO users (username, password_hash, role_id) VALUES 
('admin', '$2a$10$fbs4FVBZnEDGE.rdhHXw9OhV1oOywmTLHRwKtCJzUMu5pcYfl3TqC', 1);

INSERT INTO employees (employee_id, name, email, phone, department_id) VALUES 
('EMP001', 'John Doe', 'john@example.com', '+1234567890', 1),
('EMP002', 'Jane Smith', 'jane@example.com', '+1234567891', 2);

INSERT INTO esp32_devices (esp32_id, location, description, status) VALUES 
('ESP32_001', 'Main_Entrance', 'Main office entrance scanner', 'active');

