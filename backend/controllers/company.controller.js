const { getPool, sql } = require("../config/db");
const exceljs = require("exceljs");

// ─── GET ALL COMPANIES ──────────────────────────────────────────────────────
const getAllCompanies = async (req, res, next) => {
  try {
    const pool = await getPool();

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const { search, field, periodId } = req.query;

    let conditions = [];
    let params = { offset, limit };

    if (search) {
      conditions.push(`(c.CompanyName LIKE @Search OR c.ContactPerson LIKE @Search OR c.ContactEmail LIKE @Search)`);
      params.Search = `%${search.trim()}%`;
    }
    if (field) {
      conditions.push(`c.Field = @Field`);
      params.Field = field;
    }
    
    // periodId filtering: companies that have approved internship registrations in that period
    if (periodId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM InternshipRegistrations ir 
        WHERE ir.CompanyId = c.CompanyId 
        AND ir.PeriodId = @PeriodId 
        AND ir.Status = 'APPROVED'
      )`);
      params.PeriodId = parseInt(periodId);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    // Count query
    let countReq = pool.request();
    for (const [k, v] of Object.entries(params)) {
      if (k !== "offset" && k !== "limit") {
        countReq.input(k, typeof v === "number" ? sql.Int : sql.NVarChar, v);
      }
    }
    const countRes = await countReq.query(`SELECT COUNT(*) AS total FROM Companies c ${whereClause}`);
    const total = countRes.recordset[0].total;

    // Data query with stats
    let dataReq = pool.request();
    for (const [k, v] of Object.entries(params)) {
      dataReq.input(k, typeof v === "number" ? sql.Int : sql.NVarChar, v);
    }
    
    const dataRes = await dataReq.query(`
      SELECT 
        c.*,
        (SELECT COUNT(DISTINCT StudentId) FROM InternshipRegistrations ir WHERE ir.CompanyId = c.CompanyId AND ir.Status = 'APPROVED') as TotalStudents,
        (SELECT COUNT(DISTINCT PeriodId) FROM InternshipRegistrations ir WHERE ir.CompanyId = c.CompanyId AND ir.Status = 'APPROVED') as TotalPeriods
      FROM Companies c
      ${whereClause}
      ORDER BY c.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({
      success: true,
      data: {
        companies: dataRes.recordset,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET COMPANY BY ID ──────────────────────────────────────────────────────
const getCompanyById = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("CompanyId", sql.Int, parseInt(req.params.id))
      .query(`
        SELECT c.*,
          (SELECT COUNT(DISTINCT StudentId) FROM InternshipRegistrations ir WHERE ir.CompanyId = c.CompanyId AND ir.Status = 'APPROVED') as TotalStudents,
          (SELECT COUNT(DISTINCT PeriodId) FROM InternshipRegistrations ir WHERE ir.CompanyId = c.CompanyId AND ir.Status = 'APPROVED') as TotalPeriods
        FROM Companies c WHERE c.CompanyId = @CompanyId
      `);
      
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy công ty" });
    }
    
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE COMPANY ─────────────────────────────────────────────────────────
const createCompany = async (req, res, next) => {
  try {
    const { companyName, address, field, contactPerson, contactEmail, contactPhone } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ success: false, message: "Tên công ty là bắt buộc" });
    }

    const pool = await getPool();
    
    const check = await pool.request()
      .input("CompanyName", sql.NVarChar, companyName.trim())
      .query("SELECT CompanyId FROM Companies WHERE CompanyName = @CompanyName");
      
    if (check.recordset.length > 0) {
      return res.status(409).json({ success: false, message: "Tên công ty đã tồn tại" });
    }

    await pool.request()
      .input("CompanyName", sql.NVarChar, companyName.trim())
      .input("Address", sql.NVarChar, address?.trim() || null)
      .input("Field", sql.NVarChar, field?.trim() || null)
      .input("ContactPerson", sql.NVarChar, contactPerson?.trim() || null)
      .input("ContactEmail", sql.NVarChar, contactEmail?.trim() || null)
      .input("ContactPhone", sql.NVarChar, contactPhone?.trim() || null)
      .query(`
        INSERT INTO Companies (CompanyName, Address, Field, ContactPerson, ContactEmail, ContactPhone)
        VALUES (@CompanyName, @Address, @Field, @ContactPerson, @ContactEmail, @ContactPhone)
      `);
      
    res.status(201).json({ success: true, message: "Thêm công ty thành công" });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE COMPANY ─────────────────────────────────────────────────────────
const updateCompany = async (req, res, next) => {
  try {
    const companyId = parseInt(req.params.id);
    const { companyName, address, field, contactPerson, contactEmail, contactPhone } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ success: false, message: "Tên công ty là bắt buộc" });
    }

    const pool = await getPool();
    const exist = await pool.request().input("CompanyId", sql.Int, companyId).query("SELECT CompanyId FROM Companies WHERE CompanyId = @CompanyId");
    
    if (exist.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy công ty" });
    }

    const check = await pool.request()
      .input("CompanyId", sql.Int, companyId)
      .input("CompanyName", sql.NVarChar, companyName.trim())
      .query("SELECT CompanyId FROM Companies WHERE CompanyName = @CompanyName AND CompanyId != @CompanyId");
      
    if (check.recordset.length > 0) {
      return res.status(409).json({ success: false, message: "Tên công ty đã tồn tại" });
    }

    await pool.request()
      .input("CompanyId", sql.Int, companyId)
      .input("CompanyName", sql.NVarChar, companyName.trim())
      .input("Address", sql.NVarChar, address?.trim() || null)
      .input("Field", sql.NVarChar, field?.trim() || null)
      .input("ContactPerson", sql.NVarChar, contactPerson?.trim() || null)
      .input("ContactEmail", sql.NVarChar, contactEmail?.trim() || null)
      .input("ContactPhone", sql.NVarChar, contactPhone?.trim() || null)
      .query(`
        UPDATE Companies
        SET CompanyName = @CompanyName, Address = @Address, Field = @Field,
            ContactPerson = @ContactPerson, ContactEmail = @ContactEmail, ContactPhone = @ContactPhone
        WHERE CompanyId = @CompanyId
      `);
      
    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE COMPANY ─────────────────────────────────────────────────────────
const deleteCompany = async (req, res, next) => {
  try {
    const companyId = parseInt(req.params.id);
    const pool = await getPool();
    
    const exist = await pool.request().input("CompanyId", sql.Int, companyId).query("SELECT CompanyId FROM Companies WHERE CompanyId = @CompanyId");
    if (exist.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy công ty" });
    }

    const check = await pool.request().input("CompanyId", sql.Int, companyId).query("SELECT TOP 1 * FROM InternshipRegistrations WHERE CompanyId = @CompanyId");
    if (check.recordset.length > 0) {
      return res.status(400).json({ success: false, message: "Không thể xóa vì công ty đã có sinh viên đăng ký thực tập." });
    }

    await pool.request().input("CompanyId", sql.Int, companyId).query("DELETE FROM Companies WHERE CompanyId = @CompanyId");
    
    res.json({ success: true, message: "Xóa công ty thành công" });
  } catch (err) {
    next(err);
  }
};

// ─── GET COMPANY STATISTICS & DETAILS ───────────────────────────────────────
const getCompanyStatistics = async (req, res, next) => {
  try {
    const companyId = parseInt(req.params.id);
    const periodId = req.query.periodId ? parseInt(req.query.periodId) : null;
    const pool = await getPool();
    
    // 1. Check if company exists
    const compCheck = await pool.request().input("CompanyId", sql.Int, companyId).query("SELECT * FROM Companies WHERE CompanyId = @CompanyId");
    if (compCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy công ty" });
    }
    const companyData = compCheck.recordset[0];

    // Build period filter
    const periodFilter = periodId ? "AND ir.PeriodId = @PeriodId" : "";

    // 2. Count distinct students and periods
    let statReq = pool.request().input("CompanyId", sql.Int, companyId);
    if (periodId) statReq.input("PeriodId", sql.Int, periodId);
    
    const statsRes = await statReq.query(`
      SELECT 
        COUNT(DISTINCT ir.StudentId) as TotalStudents,
        COUNT(DISTINCT ir.PeriodId) as TotalPeriods
      FROM InternshipRegistrations ir 
      WHERE ir.CompanyId = @CompanyId AND ir.Status = 'APPROVED' ${periodFilter}
    `);
    
    const totalStudents = statsRes.recordset[0].TotalStudents || 0;
    const totalPeriods = statsRes.recordset[0].TotalPeriods || 0;

    // 3. Progress Breakdown
    const progRes = await statReq.query(`
      SELECT s.Status, COUNT(*) as cnt
      FROM Students s
      INNER JOIN InternshipRegistrations ir ON s.StudentId = ir.StudentId
      WHERE ir.CompanyId = @CompanyId AND ir.Status = 'APPROVED' ${periodFilter}
      GROUP BY s.Status
    `);
    
    let completed = 0, inProgress = 0, notStarted = 0;
    progRes.recordset.forEach(r => {
      if (r.Status === 'COMPLETED') completed = r.cnt;
      if (r.Status === 'IN_PROGRESS') inProgress = r.cnt;
      if (r.Status === 'NOT_STARTED') notStarted = r.cnt;
    });
    
    const completionRate = totalStudents > 0 ? ((completed / totalStudents) * 100).toFixed(1) : 0;

    // 4. Periods Table
    const periodsRes = await statReq.query(`
      SELECT p.PeriodId, p.PeriodName, p.Semester, p.AcademicYear, COUNT(ir.StudentId) as StudentCount
      FROM InternshipPeriods p
      INNER JOIN InternshipRegistrations ir ON p.PeriodId = ir.PeriodId
      WHERE ir.CompanyId = @CompanyId AND ir.Status = 'APPROVED' ${periodFilter}
      GROUP BY p.PeriodId, p.PeriodName, p.Semester, p.AcademicYear, p.StartDate
      ORDER BY p.StartDate DESC
    `);

    // 5. Students List Table
    const studentsRes = await statReq.query(`
      SELECT 
        s.StudentId, s.StudentCode, s.FullName, s.Status as InternshipStatus,
        l.FullName as LecturerName,
        p.PeriodName
      FROM Students s
      INNER JOIN InternshipRegistrations ir ON s.StudentId = ir.StudentId
      LEFT JOIN Assignments a ON s.StudentId = a.StudentId AND ir.PeriodId = a.PeriodId
      LEFT JOIN Lecturers l ON a.LecturerId = l.LecturerId
      LEFT JOIN InternshipPeriods p ON ir.PeriodId = p.PeriodId
      WHERE ir.CompanyId = @CompanyId AND ir.Status = 'APPROVED' ${periodFilter}
      ORDER BY s.FullName
    `);

    res.json({
      success: true,
      data: {
        company: companyData,
        statistics: {
          totalStudents,
          totalPeriods,
          completed,
          inProgress,
          notStarted,
          completionRate
        },
        periods: periodsRes.recordset,
        students: studentsRes.recordset
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── EXPORT EXCEL ───────────────────────────────────────────────────────────
const exportCompaniesExcel = async (req, res, next) => {
  try {
    const pool = await getPool();
    const { search, field, periodId } = req.query;

    let conditions = [];
    let params = {};

    if (search) {
      conditions.push(`(c.CompanyName LIKE @Search OR c.ContactPerson LIKE @Search OR c.ContactEmail LIKE @Search)`);
      params.Search = `%${search.trim()}%`;
    }
    if (field) {
      conditions.push(`c.Field = @Field`);
      params.Field = field;
    }
    if (periodId) {
      conditions.push(`EXISTS (SELECT 1 FROM InternshipRegistrations ir WHERE ir.CompanyId = c.CompanyId AND ir.PeriodId = @PeriodId AND ir.Status = 'APPROVED')`);
      params.PeriodId = parseInt(periodId);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    let dataReq = pool.request();
    for (const [k, v] of Object.entries(params)) {
      dataReq.input(k, typeof v === "number" ? sql.Int : sql.NVarChar, v);
    }
    
    const dataRes = await dataReq.query(`
      SELECT 
        c.*,
        (SELECT COUNT(DISTINCT StudentId) FROM InternshipRegistrations ir WHERE ir.CompanyId = c.CompanyId AND ir.Status = 'APPROVED') as TotalStudents,
        (SELECT COUNT(DISTINCT PeriodId) FROM InternshipRegistrations ir WHERE ir.CompanyId = c.CompanyId AND ir.Status = 'APPROVED') as TotalPeriods
      FROM Companies c
      ${whereClause}
      ORDER BY c.CompanyName ASC
    `);

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách Công ty");

    worksheet.columns = [
      { header: "STT", key: "stt", width: 5 },
      { header: "Tên công ty", key: "companyName", width: 35 },
      { header: "Địa chỉ", key: "address", width: 40 },
      { header: "Lĩnh vực", key: "field", width: 25 },
      { header: "Người liên hệ", key: "contactPerson", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Điện thoại", key: "phone", width: 15 },
      { header: "Tổng SV", key: "totalStudents", width: 10 },
      { header: "Số đợt tham gia", key: "totalPeriods", width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    dataRes.recordset.forEach((c, index) => {
      worksheet.addRow({
        stt: index + 1,
        companyName: c.CompanyName,
        address: c.Address,
        field: c.Field,
        contactPerson: c.ContactPerson,
        email: c.ContactEmail,
        phone: c.ContactPhone,
        totalStudents: c.TotalStudents,
        totalPeriods: c.TotalPeriods,
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Companies.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStatistics,
  exportCompaniesExcel
};
