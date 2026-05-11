-- =====================================================
-- DATABASE: InternshipManagement
-- Updated Workflow Version
-- =====================================================

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
-- =====================================================

CREATE TABLE InternshipRegistrations (
RegistrationId INT PRIMARY KEY IDENTITY(1,1),


StudentId INT NOT NULL,
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
REFERENCES InternshipPeriods(PeriodId),

CONSTRAINT UQ_InternshipRegistrations_Student_Period
UNIQUE(StudentId, PeriodId)

);

-- =====================================================
-- ASSIGNMENTS
-- =====================================================

CREATE TABLE Assignments (
AssignmentId INT PRIMARY KEY IDENTITY(1,1),

StudentId INT NOT NULL,
LecturerId INT NOT NULL,
PeriodId INT NOT NULL,

AssignedDate DATETIME DEFAULT GETDATE(),

FOREIGN KEY (StudentId)
REFERENCES Students(StudentId),

FOREIGN KEY (LecturerId)
REFERENCES Lecturers(LecturerId),

FOREIGN KEY (PeriodId)
REFERENCES InternshipPeriods(PeriodId),

CONSTRAINT UQ_Assignments_Student_Period
UNIQUE(StudentId, PeriodId)

);

-- =====================================================
-- REPORT TEMPLATES
-- Lecturer/Admin tạo kỳ báo cáo
-- =====================================================

CREATE TABLE ReportTemplates (
TemplateId INT PRIMARY KEY IDENTITY(1,1),


PeriodId INT NOT NULL,

Title NVARCHAR(200) NOT NULL,

ReportType NVARCHAR(30)
    CHECK (ReportType IN ('WEEKLY', 'FINAL')),

WeekNumber INT NULL,

OpenDate DATETIME NOT NULL,
DueDate DATETIME NOT NULL,

Description NVARCHAR(MAX),

Status NVARCHAR(20)
    DEFAULT 'OPEN'
    CHECK (Status IN ('OPEN', 'CLOSED')),

CreatedByLecturerId INT NULL,

CreatedAt DATETIME DEFAULT GETDATE(),

FOREIGN KEY (PeriodId)
REFERENCES InternshipPeriods(PeriodId),

FOREIGN KEY (CreatedByLecturerId)
REFERENCES Lecturers(LecturerId)


);

-- =====================================================
-- WEEKLY REPORTS
-- Student submit weekly reports
-- =====================================================

CREATE TABLE WeeklyReports (
ReportId INT PRIMARY KEY IDENTITY(1,1),

```
TemplateId INT NOT NULL,

StudentId INT NOT NULL,
PeriodId INT NOT NULL,

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

FOREIGN KEY (TemplateId)
REFERENCES ReportTemplates(TemplateId),

FOREIGN KEY (StudentId)
REFERENCES Students(StudentId),

FOREIGN KEY (PeriodId)
REFERENCES InternshipPeriods(PeriodId)
```

);
ALTER TABLE WeeklyReports
ADD FileName NVARCHAR(255),
    FileType NVARCHAR(50),
    FileSize BIGINT;




-- =====================================================
-- FINAL REPORTS
-- =====================================================

CREATE TABLE FinalReports (
FinalReportId INT PRIMARY KEY IDENTITY(1,1),

StudentId INT NOT NULL,
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
REFERENCES InternshipPeriods(PeriodId),

CONSTRAINT UQ_FinalReports_Student_Period
UNIQUE(StudentId, PeriodId)
);
ALTER TABLE FinalReports
ADD FileName NVARCHAR(255),
    FileType NVARCHAR(50),
    FileSize BIGINT;

-- =====================================================
-- EVALUATIONS
-- =====================================================

CREATE TABLE Evaluations (
    EvaluationId INT PRIMARY KEY IDENTITY(1,1),

    StudentId INT NOT NULL,
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
        REFERENCES InternshipPeriods(PeriodId),

    CONSTRAINT UQ_Evaluations_Student_Period
        UNIQUE(StudentId, PeriodId)
);

-- =====================================================
-- INTERNSHIP PROGRESS
-- =====================================================

CREATE TABLE InternshipProgress (
ProgressId INT PRIMARY KEY IDENTITY(1,1),


StudentId INT NOT NULL,
PeriodId INT NOT NULL,

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
REFERENCES Students(StudentId),

FOREIGN KEY (PeriodId)
REFERENCES InternshipPeriods(PeriodId),

CONSTRAINT UQ_InternshipProgress_Student_Period
UNIQUE(StudentId, PeriodId)

);
