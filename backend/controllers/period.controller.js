const { getPool, sql } = require("../config/db");

// ─── GET ALL PERIODS ────────────────────────────────────────────────────────
const getAllPeriods = async (req, res, next) => {
  try {
    const pool = await getPool();

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const { search, semester, academicYear, status } = req.query;

    let conditions = [];
    let params = { offset, limit };

    if (search) {
      conditions.push(`(PeriodName LIKE @Search OR AcademicYear LIKE @Search)`);
      params.Search = `%${search.trim()}%`;
    }
    if (semester) {
      conditions.push(`Semester = @Semester`);
      params.Semester = semester;
    }
    if (academicYear) {
      conditions.push(`AcademicYear = @AcademicYear`);
      params.AcademicYear = academicYear;
    }
    if (status) {
      conditions.push(`Status = @Status`);
      params.Status = status;
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    // Count
    let countReq = pool.request();
    for (const [k, v] of Object.entries(params)) {
      if (k !== "offset" && k !== "limit") {
        countReq.input(k, typeof v === "number" ? sql.Int : sql.NVarChar, v);
      }
    }
    const countRes = await countReq.query(`SELECT COUNT(*) AS total FROM InternshipPeriods ${whereClause}`);
    const total = countRes.recordset[0].total;

    // Data
    let dataReq = pool.request();
    for (const [k, v] of Object.entries(params)) {
      dataReq.input(k, typeof v === "number" ? sql.Int : sql.NVarChar, v);
    }
    const dataRes = await dataReq.query(`
      SELECT * FROM InternshipPeriods
      ${whereClause}
      ORDER BY StartDate DESC, CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({
      success: true,
      data: {
        periods: dataRes.recordset,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET PERIOD BY ID ───────────────────────────────────────────────────────
const getPeriodById = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("PeriodId", sql.Int, parseInt(req.params.id))
      .query("SELECT * FROM InternshipPeriods WHERE PeriodId = @PeriodId");
      
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đợt thực tập" });
    }
    
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE PERIOD ──────────────────────────────────────────────────────────
const createPeriod = async (req, res, next) => {
  try {
    const { periodName, semester, academicYear, startDate, endDate, status } = req.body;
    
    if (!periodName || !semester || !academicYear || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }
    
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: "Ngày kết thúc phải lớn hơn ngày bắt đầu" });
    }

    const pool = await getPool();
    
    // Check duplicate
    const check = await pool.request()
      .input("PeriodName", sql.NVarChar, periodName.trim())
      .input("AcademicYear", sql.NVarChar, academicYear.trim())
      .input("Semester", sql.NVarChar, semester.trim())
      .query(`
        SELECT PeriodId FROM InternshipPeriods 
        WHERE PeriodName = @PeriodName AND AcademicYear = @AcademicYear AND Semester = @Semester
      `);
      
    if (check.recordset.length > 0) {
      return res.status(409).json({ success: false, message: "Đợt thực tập đã tồn tại trong học kỳ và năm học này" });
    }

    await pool.request()
      .input("PeriodName", sql.NVarChar, periodName.trim())
      .input("Semester", sql.NVarChar, semester.trim())
      .input("AcademicYear", sql.NVarChar, academicYear.trim())
      .input("StartDate", sql.Date, startDate)
      .input("EndDate", sql.Date, endDate)
      .input("Status", sql.NVarChar, status || "UPCOMING")
      .query(`
        INSERT INTO InternshipPeriods (PeriodName, Semester, AcademicYear, StartDate, EndDate, Status)
        VALUES (@PeriodName, @Semester, @AcademicYear, @StartDate, @EndDate, @Status)
      `);
      
    res.status(201).json({ success: true, message: "Thêm đợt thực tập thành công" });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE PERIOD ──────────────────────────────────────────────────────────
const updatePeriod = async (req, res, next) => {
  try {
    const periodId = parseInt(req.params.id);
    const { periodName, semester, academicYear, startDate, endDate, status } = req.body;
    
    if (!periodName || !semester || !academicYear || !startDate || !endDate || !status) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }
    
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: "Ngày kết thúc phải lớn hơn ngày bắt đầu" });
    }

    const pool = await getPool();
    const exist = await pool.request().input("PeriodId", sql.Int, periodId).query("SELECT PeriodId FROM InternshipPeriods WHERE PeriodId = @PeriodId");
    
    if (exist.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đợt thực tập" });
    }

    // Check duplicate
    const check = await pool.request()
      .input("PeriodId", sql.Int, periodId)
      .input("PeriodName", sql.NVarChar, periodName.trim())
      .input("AcademicYear", sql.NVarChar, academicYear.trim())
      .input("Semester", sql.NVarChar, semester.trim())
      .query(`
        SELECT PeriodId FROM InternshipPeriods 
        WHERE PeriodName = @PeriodName AND AcademicYear = @AcademicYear AND Semester = @Semester AND PeriodId != @PeriodId
      `);
      
    if (check.recordset.length > 0) {
      return res.status(409).json({ success: false, message: "Đợt thực tập đã tồn tại" });
    }

    await pool.request()
      .input("PeriodId", sql.Int, periodId)
      .input("PeriodName", sql.NVarChar, periodName.trim())
      .input("Semester", sql.NVarChar, semester.trim())
      .input("AcademicYear", sql.NVarChar, academicYear.trim())
      .input("StartDate", sql.Date, startDate)
      .input("EndDate", sql.Date, endDate)
      .input("Status", sql.NVarChar, status)
      .query(`
        UPDATE InternshipPeriods
        SET PeriodName = @PeriodName, Semester = @Semester, AcademicYear = @AcademicYear,
            StartDate = @StartDate, EndDate = @EndDate, Status = @Status
        WHERE PeriodId = @PeriodId
      `);
      
    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE PERIOD ──────────────────────────────────────────────────────────
const deletePeriod = async (req, res, next) => {
  try {
    const periodId = parseInt(req.params.id);
    const pool = await getPool();
    
    const exist = await pool.request().input("PeriodId", sql.Int, periodId).query("SELECT PeriodId FROM InternshipPeriods WHERE PeriodId = @PeriodId");
    if (exist.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đợt thực tập" });
    }

    // Check constraints
    const constraints = [
      { table: "Assignments", name: "phân công hướng dẫn" },
      { table: "InternshipRegistrations", name: "đăng ký thực tập" },
      { table: "WeeklyReports", name: "báo cáo tuần" },
      { table: "FinalReports", name: "báo cáo tổng kết" },
      { table: "Evaluations", name: "đánh giá kết quả" }
    ];

    for (const c of constraints) {
      const check = await pool.request().input("PeriodId", sql.Int, periodId).query(`SELECT TOP 1 * FROM ${c.table} WHERE PeriodId = @PeriodId`);
      if (check.recordset.length > 0) {
        return res.status(400).json({ success: false, message: `Không thể xóa vì đã có dữ liệu ${c.name} liên quan đến đợt này.` });
      }
    }

    await pool.request().input("PeriodId", sql.Int, periodId).query("DELETE FROM InternshipPeriods WHERE PeriodId = @PeriodId");
    
    res.json({ success: true, message: "Xóa đợt thực tập thành công" });
  } catch (err) {
    next(err);
  }
};

// ─── GET PERIOD STATISTICS ──────────────────────────────────────────────────
const getPeriodStatistics = async (req, res, next) => {
  try {
    const periodId = parseInt(req.params.id);
    const pool = await getPool();
    
    // 1. Check if period exists
    const periodCheck = await pool.request().input("PeriodId", sql.Int, periodId).query("SELECT * FROM InternshipPeriods WHERE PeriodId = @PeriodId");
    if (periodCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đợt thực tập" });
    }
    const periodData = periodCheck.recordset[0];

    // 2. Count distinct students from Registrations in this period
    const studentsCount = await pool.request().input("PeriodId", sql.Int, periodId).query(`
      SELECT COUNT(DISTINCT StudentId) as total FROM InternshipRegistrations WHERE PeriodId = @PeriodId AND Status = 'APPROVED'
    `);
    const totalStudents = studentsCount.recordset[0].total || 0;

    // 3. Count distinct lecturers from Assignments in this period
    const lecturersCount = await pool.request().input("PeriodId", sql.Int, periodId).query(`
      SELECT COUNT(DISTINCT LecturerId) as total FROM Assignments WHERE PeriodId = @PeriodId
    `);
    const totalLecturers = lecturersCount.recordset[0].total || 0;

    // 4. Count distinct companies from Registrations in this period
    const companiesCount = await pool.request().input("PeriodId", sql.Int, periodId).query(`
      SELECT COUNT(DISTINCT CompanyId) as total FROM InternshipRegistrations WHERE PeriodId = @PeriodId AND Status = 'APPROVED'
    `);
    const totalCompanies = companiesCount.recordset[0].total || 0;

    // 5. Get Student Progress breakdown (using Students.Status for those registered in this period)
    const progressCount = await pool.request().input("PeriodId", sql.Int, periodId).query(`
      SELECT s.Status, COUNT(*) as cnt
      FROM Students s
      INNER JOIN InternshipRegistrations ir ON s.StudentId = ir.StudentId
      WHERE ir.PeriodId = @PeriodId AND ir.Status = 'APPROVED'
      GROUP BY s.Status
    `);
    
    let completed = 0, inProgress = 0, notStarted = 0;
    progressCount.recordset.forEach(r => {
      if (r.Status === 'COMPLETED') completed = r.cnt;
      if (r.Status === 'IN_PROGRESS') inProgress = r.cnt;
      if (r.Status === 'NOT_STARTED') notStarted = r.cnt;
    });

    const completionRate = totalStudents > 0 ? ((completed / totalStudents) * 100).toFixed(1) : 0;

    // 6. Get Company Participation table (Companies & count of students)
    const companyTable = await pool.request().input("PeriodId", sql.Int, periodId).query(`
      SELECT c.CompanyId, c.CompanyName, COUNT(ir.StudentId) as StudentCount
      FROM Companies c
      INNER JOIN InternshipRegistrations ir ON c.CompanyId = ir.CompanyId
      WHERE ir.PeriodId = @PeriodId AND ir.Status = 'APPROVED'
      GROUP BY c.CompanyId, c.CompanyName
      ORDER BY StudentCount DESC
    `);

    // 7. Get Lecturer Workload table
    const lecturerTable = await pool.request().input("PeriodId", sql.Int, periodId).query(`
      SELECT l.LecturerId, l.FullName, l.LecturerCode, COUNT(a.StudentId) as StudentCount
      FROM Lecturers l
      INNER JOIN Assignments a ON l.LecturerId = a.LecturerId
      WHERE a.PeriodId = @PeriodId
      GROUP BY l.LecturerId, l.FullName, l.LecturerCode
      ORDER BY StudentCount DESC
    `);

    res.json({
      success: true,
      data: {
        period: periodData,
        statistics: {
          totalStudents,
          totalLecturers,
          totalCompanies,
          completed,
          inProgress,
          notStarted,
          completionRate
        },
        companies: companyTable.recordset,
        lecturers: lecturerTable.recordset
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllPeriods,
  getPeriodById,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getPeriodStatistics
};
