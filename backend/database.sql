-- =====================================================
-- InternshipManagement Database Setup & Seed Script
-- Run this in SQL Server Management Studio (SSMS)
-- =====================================================

USE InternshipManagement;
GO

-- ─── CREATE TABLES (if not exists) ───────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        UserId       INT IDENTITY(1,1) PRIMARY KEY,
        Username     NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        Role         NVARCHAR(20)  NOT NULL CHECK (Role IN ('ADMIN', 'LECTURER', 'STUDENT')),
        IsActive     BIT           NOT NULL DEFAULT 1,
        CreatedAt    DATETIME      DEFAULT GETDATE()
    );
    PRINT 'Table Users created.';
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Students' AND xtype='U')
BEGIN
    CREATE TABLE Students (
        StudentId   INT IDENTITY(1,1) PRIMARY KEY,
        UserId      INT          NOT NULL FOREIGN KEY REFERENCES Users(UserId),
        StudentCode NVARCHAR(50) NOT NULL UNIQUE,
        FullName    NVARCHAR(150) NOT NULL,
        ClassName   NVARCHAR(100) NOT NULL,
        Email       NVARCHAR(150),
        Phone       NVARCHAR(20),
        CreatedAt   DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table Students created.';
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Lecturers' AND xtype='U')
BEGIN
    CREATE TABLE Lecturers (
        LecturerId   INT IDENTITY(1,1) PRIMARY KEY,
        UserId       INT          NOT NULL FOREIGN KEY REFERENCES Users(UserId),
        LecturerCode NVARCHAR(50) NOT NULL UNIQUE,
        FullName     NVARCHAR(150) NOT NULL,
        Department   NVARCHAR(150),
        Email        NVARCHAR(150),
        Phone        NVARCHAR(20),
        CreatedAt    DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table Lecturers created.';
END

-- ─── SEED ADMIN ACCOUNT ───────────────────────────────────────────────────────
-- Password: Admin@123 (bcrypt hashed with 10 rounds)
-- IMPORTANT: Generate your own hash using: node -e "const b=require('bcryptjs'); b.hash('Admin@123',10).then(console.log)"

IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin')
BEGIN
    -- This is the bcrypt hash for 'Admin@123' — replace with your own if needed
    INSERT INTO Users (Username, PasswordHash, Role, IsActive)
    VALUES (
        'admin',
        '$2b$10$FXQLstNhIaxv/GVFuST9SeMGR6jTRA4U0oNLDF.7LnYUCgiEKxGgC', -- bcrypt hash of 'Admin@123'
        'ADMIN',
        1
    );
    PRINT 'Admin user seeded. IMPORTANT: Update the PasswordHash with a real bcrypt hash!';
END

-- ─── HOW TO GENERATE REAL ADMIN PASSWORD HASH ─────────────────────────────────
-- 1. Open a terminal in the backend folder
-- 2. Run: node -e "const b=require('bcryptjs'); b.hash('YourAdminPassword', 10).then(h => console.log(h))"
-- 3. Copy the output hash
-- 4. Run: UPDATE Users SET PasswordHash = '<paste_hash_here>' WHERE Username = 'admin'

-- ─── SAMPLE LECTURER (optional) ───────────────────────────────────────────────
-- Password: Lecturer@123
-- IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'GV001')
-- BEGIN
--     DECLARE @lecHash NVARCHAR(255) = '$2a$10$...'; -- generate with bcryptjs
--     INSERT INTO Users (Username, PasswordHash, Role, IsActive) VALUES ('GV001', @lecHash, 'LECTURER', 1);
--     DECLARE @lecUserId INT = SCOPE_IDENTITY();
--     INSERT INTO Lecturers (UserId, LecturerCode, FullName, Department, Email) 
--     VALUES (@lecUserId, 'GV001', N'Nguyen Van B', N'CNTT', 'gv001@university.edu.vn');
-- END

PRINT 'Database setup complete.';
