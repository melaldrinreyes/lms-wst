-- ============================================
-- MINSU E-LEARN Database Schema
-- Database: minsu_lms_db
-- Platform: MinSU Bongabong Campus E-Learning
-- Technology: Laravel + React + MySQL (XAMPP)
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS minsu_lms_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE minsu_lms_db;

-- ============================================
-- Table: roles
-- Description: User role types
-- ============================================
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: users
-- Description: All system users (admin, faculty, students)
-- ============================================
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    student_no VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    bio TEXT,
    profile_pic VARCHAR(255),
    email_verified_at TIMESTAMP NULL,
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_role_id (role_id),
    INDEX idx_email (email),
    INDEX idx_student_no (student_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: courses
-- Description: Courses created by faculty
-- ============================================
CREATE TABLE courses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    faculty_id BIGINT UNSIGNED NOT NULL,
    course_code VARCHAR(50) NOT NULL UNIQUE,
    course_title VARCHAR(255) NOT NULL,
    description TEXT,
    semester VARCHAR(20) NOT NULL COMMENT '1st Semester, 2nd Semester, Summer',
    year_level INT NOT NULL COMMENT '1, 2, 3, 4',
    status ENUM('active', 'archived', 'draft') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_course_code (course_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: modules
-- Description: Learning modules/materials
-- ============================================
CREATE TABLE modules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    content LONGTEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_id (course_id),
    INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: assignments
-- Description: Course assignments
-- ============================================
CREATE TABLE assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    deadline DATETIME NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_id (course_id),
    INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: submissions
-- Description: Student assignment submissions
-- ============================================
CREATE TABLE submissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    file_path VARCHAR(500),
    score DECIMAL(5,2),
    remarks TEXT,
    status ENUM('pending', 'graded', 'late') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assignment_id (assignment_id),
    INDEX idx_student_id (student_id),
    INDEX idx_composite (assignment_id, student_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_submission (assignment_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: forums
-- Description: Discussion forums
-- ============================================
CREATE TABLE forums (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT UNSIGNED,
    created_by BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_course_id (course_id),
    INDEX idx_created_by (created_by),
    INDEX idx_pinned (is_pinned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: posts
-- Description: Forum posts/replies
-- ============================================
CREATE TABLE posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    forum_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (forum_id) REFERENCES forums(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_forum_id (forum_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: announcements
-- Description: System and course announcements
-- ============================================
CREATE TABLE announcements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    posted_by BIGINT UNSIGNED NOT NULL,
    course_id BIGINT UNSIGNED,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    INDEX idx_posted_by (posted_by),
    INDEX idx_course_id (course_id),
    INDEX idx_created_at (created_at),
    INDEX idx_pinned (is_pinned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: notifications
-- Description: User notifications
-- ============================================
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' COMMENT 'info, success, warning, error',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_composite (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: chatbot_logs
-- Description: AI chatbot interaction logs
-- ============================================
CREATE TABLE chatbot_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Default Roles
-- ============================================
INSERT INTO roles (name) VALUES 
('admin'),
('faculty'),
('student');

-- ============================================
-- Insert Default Admin User
-- Password: admin123 (hashed)
-- ============================================
INSERT INTO users (role_id, name, email, password, department) VALUES 
(1, 'System Administrator', 'admin@minsu.edu.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT Department');

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Sample Faculty User
INSERT INTO users (role_id, name, email, password, department) VALUES 
(2, 'Dr. John Smith', 'john.smith@minsu.edu.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Computer Science');

-- Sample Student User
INSERT INTO users (role_id, student_no, name, email, password, department) VALUES 
(3, '2021-00001', 'Juan Dela Cruz', 'juan.delacruz@minsu.edu.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Computer Science');

-- Sample Course
INSERT INTO courses (faculty_id, course_code, course_title, description, semester, year_level) VALUES 
(2, 'CS101', 'Introduction to Programming', 'Learn the basics of programming using Python', '1st Semester', 1);

-- ============================================
-- Views (Optional - for reporting)
-- ============================================

-- View: Course Enrollment Count
CREATE VIEW view_course_enrollments AS
SELECT 
    c.id,
    c.course_code,
    c.course_title,
    u.name AS faculty_name,
    COUNT(DISTINCT s.student_id) AS enrolled_students,
    COUNT(DISTINCT a.id) AS total_assignments
FROM courses c
LEFT JOIN users u ON c.faculty_id = u.id
LEFT JOIN assignments a ON c.id = a.course_id
LEFT JOIN submissions s ON a.id = s.assignment_id
GROUP BY c.id, c.course_code, c.course_title, u.name;

-- View: Student Performance
CREATE VIEW view_student_performance AS
SELECT 
    u.id AS student_id,
    u.student_no,
    u.name AS student_name,
    c.course_code,
    c.course_title,
    COUNT(s.id) AS total_submissions,
    AVG(s.score) AS average_score,
    SUM(CASE WHEN s.status = 'graded' THEN 1 ELSE 0 END) AS graded_count
FROM users u
JOIN submissions s ON u.id = s.student_id
JOIN assignments a ON s.assignment_id = a.id
JOIN courses c ON a.course_id = c.id
WHERE u.role_id = 3
GROUP BY u.id, u.student_no, u.name, c.course_code, c.course_title;

-- ============================================
-- Stored Procedures (Optional)
-- ============================================

DELIMITER //

-- Procedure: Get Student Dashboard Stats
CREATE PROCEDURE sp_get_student_dashboard(IN p_student_id BIGINT)
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM submissions WHERE student_id = p_student_id) AS total_submissions,
        (SELECT COUNT(*) FROM submissions WHERE student_id = p_student_id AND status = 'pending') AS pending_submissions,
        (SELECT AVG(score) FROM submissions WHERE student_id = p_student_id AND status = 'graded') AS average_score,
        (SELECT COUNT(DISTINCT a.course_id) FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE s.student_id = p_student_id) AS enrolled_courses;
END//

-- Procedure: Get Faculty Dashboard Stats
CREATE PROCEDURE sp_get_faculty_dashboard(IN p_faculty_id BIGINT)
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM courses WHERE faculty_id = p_faculty_id) AS total_courses,
        (SELECT COUNT(*) FROM assignments a JOIN courses c ON a.course_id = c.id WHERE c.faculty_id = p_faculty_id) AS total_assignments,
        (SELECT COUNT(*) FROM submissions s JOIN assignments a ON s.assignment_id = a.id JOIN courses c ON a.course_id = c.id WHERE c.faculty_id = p_faculty_id AND s.status = 'pending') AS pending_submissions,
        (SELECT COUNT(DISTINCT s.student_id) FROM submissions s JOIN assignments a ON s.assignment_id = a.id JOIN courses c ON a.course_id = c.id WHERE c.faculty_id = p_faculty_id) AS total_students;
END//

DELIMITER ;

-- ============================================
-- End of Schema
-- ============================================
