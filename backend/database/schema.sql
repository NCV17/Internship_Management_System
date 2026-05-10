CREATE DATABASE InternshipManagement;
GO

USE InternshipManagement;
GO

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),

    Username NVARCHAR(50) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,

    Role NVARCHAR(20) NOT NULL
        CHECK (Role IN ('ADMIN', 'LECTURER', 'STUDENT')),

    IsActive BIT DEFAULT 1,

    CreatedAt DATETIME DEFAULT GETDATE()
);

-- =====================================================
-- LECTURERS
-- =====================================================
CREATE TABLE Lecturers (
    LecturerId INT PRIMARY KEY IDENTITY(1,1),

    UserId INT UNIQUE,

    LecturerCode NVARCHAR(20) UNIQUE NOT NULL,
    FullName NVARCHAR(100) NOT NULL,

    Department NVARCHAR(100),
    Email NVARCHAR(100),
    Phone NVARCHAR(20),

    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserId)
    REFERENCES Users(UserId)
);

-- =====================================================
-- STUDENTS
-- =====================================================
CREATE TABLE Students (
    StudentId INT PRIMARY KEY IDENTITY(1,1),

    UserId INT UNIQUE,

    StudentCode NVARCHAR(20) UNIQUE NOT NULL,
    FullName NVARCHAR(100) NOT NULL,

    ClassName NVARCHAR(50),
    Email NVARCHAR(100),
    Phone NVARCHAR(20),

    GPA FLOAT,

    Status NVARCHAR(30)
        DEFAULT 'NOT_STARTED'
        CHECK (Status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),

    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserId)
    REFERENCES Users(UserId)
);

-- =====================================================
-- COMPANIES
-- =====================================================
CREATE TABLE Companies (
    CompanyId INT PRIMARY KEY IDENTITY(1,1),

    CompanyName NVARCHAR(150) NOT NULL,

    Address NVARCHAR(255),
    Field NVARCHAR(100),

    ContactPerson NVARCHAR(100),
    ContactEmail NVARCHAR(100),
    ContactPhone NVARCHAR(20),

    CreatedAt DATETIME DEFAULT GETDATE()
);

-- =====================================================
-- INTERNSHIP PERIODS
-- =====================================================
CREATE TABLE InternshipPeriods (
    PeriodId INT PRIMARY KEY IDENTITY(1,1),

    PeriodName NVARCHAR(100) NOT NULL,
    Semester NVARCHAR(20) NOT NULL,
    AcademicYear NVARCHAR(20) NOT NULL,

    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,

    Status NVARCHAR(20)
        DEFAULT 'UPCOMING'
        CHECK (Status IN ('UPCOMING', 'ACTIVE', 'CLOSED')),

    CreatedAt DATETIME DEFAULT GETDATE()
);

-- =====================================================
-- INTERNSHIP REGISTRATIONS
-- Sinh viên đăng ký công ty thực tập
-- =====================================================
CREATE TABLE InternshipRegistrations (
    RegistrationId INT PRIMARY KEY IDENTITY(1,1),

    StudentId INT UNIQUE NOT NULL,
    CompanyId INT NOT NULL,
    PeriodId INT NOT NULL,

    RegisteredAt DATETIME DEFAULT GETDATE(),

    Status NVARCHAR(30)
        DEFAULT 'APPROVED'
        CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED')),

    FOREIGN KEY (StudentId)
    REFERENCES Students(StudentId),

    FOREIGN KEY (CompanyId)
    REFERENCES Companies(CompanyId),

    FOREIGN KEY (PeriodId)
    REFERENCES InternshipPeriods(PeriodId)
);

-- =====================================================
-- ASSIGNMENTS
-- Phân công giảng viên hướng dẫn
-- =====================================================
CREATE TABLE Assignments (
    AssignmentId INT PRIMARY KEY IDENTITY(1,1),

    StudentId INT UNIQUE NOT NULL,
    LecturerId INT NOT NULL,
    PeriodId INT NOT NULL,

    AssignedDate DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (StudentId)
    REFERENCES Students(StudentId),

    FOREIGN KEY (LecturerId)
    REFERENCES Lecturers(LecturerId),

    FOREIGN KEY (PeriodId)
    REFERENCES InternshipPeriods(PeriodId)
);

-- =====================================================
-- WEEKLY REPORTS
-- =====================================================
CREATE TABLE WeeklyReports (
    ReportId INT PRIMARY KEY IDENTITY(1,1),

    StudentId INT NOT NULL,
    PeriodId INT NOT NULL,

    WeekNumber INT NOT NULL,

    Title NVARCHAR(200),
    Content NVARCHAR(MAX),

    FilePath NVARCHAR(255),

    Status NVARCHAR(30)
        DEFAULT 'PENDING'
        CHECK (
            Status IN (
                'PENDING',
                'APPROVED',
                'REVISION_REQUIRED',
                'REJECTED'
            )
        ),

    LecturerComment NVARCHAR(MAX),

    SubmittedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (StudentId)
    REFERENCES Students(StudentId),

    FOREIGN KEY (PeriodId)
    REFERENCES InternshipPeriods(PeriodId)
);

-- =====================================================
-- FINAL REPORTS
-- =====================================================
CREATE TABLE FinalReports (
    FinalReportId INT PRIMARY KEY IDENTITY(1,1),

    StudentId INT UNIQUE NOT NULL,
    PeriodId INT NOT NULL,

    Title NVARCHAR(200),
    Description NVARCHAR(MAX),

    FilePath NVARCHAR(255),

    Status NVARCHAR(30)
        DEFAULT 'PENDING'
        CHECK (
            Status IN (
                'PENDING',
                'APPROVED',
                'REVISION_REQUIRED',
                'REJECTED'
            )
        ),

    LecturerComment NVARCHAR(MAX),

    SubmittedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (StudentId)
    REFERENCES Students(StudentId),

    FOREIGN KEY (PeriodId)
    REFERENCES InternshipPeriods(PeriodId)
);

-- =====================================================
-- EVALUATIONS
-- =====================================================
CREATE TABLE Evaluations (
    EvaluationId INT PRIMARY KEY IDENTITY(1,1),

    StudentId INT UNIQUE NOT NULL,
    LecturerId INT NOT NULL,
    PeriodId INT NOT NULL,

    ProcessScore FLOAT CHECK (ProcessScore BETWEEN 0 AND 10),
    WeeklyReportScore FLOAT CHECK (WeeklyReportScore BETWEEN 0 AND 10),
    FinalReportScore FLOAT CHECK (FinalReportScore BETWEEN 0 AND 10),
    AttitudeScore FLOAT CHECK (AttitudeScore BETWEEN 0 AND 10),
    TotalScore FLOAT CHECK (TotalScore BETWEEN 0 AND 10),

    Comment NVARCHAR(MAX),

    EvaluatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (StudentId)
    REFERENCES Students(StudentId),

    FOREIGN KEY (LecturerId)
    REFERENCES Lecturers(LecturerId),

    FOREIGN KEY (PeriodId)
    REFERENCES InternshipPeriods(PeriodId)
);

-- =====================================================
-- INTERNSHIP PROGRESS
-- =====================================================
CREATE TABLE InternshipProgress (
    ProgressId INT PRIMARY KEY IDENTITY(1,1),

    StudentId INT UNIQUE NOT NULL,

    ProgressPercent INT
        DEFAULT 0
        CHECK (ProgressPercent BETWEEN 0 AND 100),

    CurrentStage NVARCHAR(50),

    GPA DECIMAL(4,2),

    InternshipStatus NVARCHAR(20)
        DEFAULT 'NOT_STARTED',

    Notes NVARCHAR(500),

    UpdatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (StudentId)
    REFERENCES Students(StudentId)
);