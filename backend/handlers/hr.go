package handlers

import (
	"fmt"
	"net/http"
	"path/filepath" // <--- เพิ่มบรรทัดนี้เข้าไป
	"strconv"
	"time"

	"Housekeeper_Welfare_System/config"
	"Housekeeper_Welfare_System/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// ==========================================
// FR-10: ดูรายการคำขอสวัสดิการของพนักงานทั้งหมด
// ==========================================
func GetAllRequests(c *gin.Context) {
	var requests []models.WelfareRequest
	status := c.Query("status") // filter: pending, approved, rejected

	query := config.DB.Preload("Attachments").Order("request_date desc")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, requests)
}

// ==========================================
// FR-09: อนุมัติ หรือ ปฏิเสธคำขอสวัสดิการ (พร้อมหักยอดสิทธิ์คงเหลือ)
// ==========================================
type DecisionInput struct {
	Status string `json:"status" binding:"required"` // approved หรือ rejected
	Notes  string `json:"notes"`
}

func DecideRequest(c *gin.Context) {
	requestIDStr := c.Param("id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID คำขอไม่ถูกต้อง"})
		return
	}

	var input DecisionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hrEmployeeID, _ := c.Get("employee_id")

	// เริ่มต้น Transaction เพื่อความปลอดภัยของข้อมูลการหักสิทธิ์ (ACID)
	tx := config.DB.Begin()

	var request models.WelfareRequest
	if err := tx.Where("welfare_request_id = ? AND status = 'pending'", requestID).First(&request).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบคำขอที่อยู่ในสถานะรออนุมัติ"})
		return
	}

	// 1. กรณีอนุมัติ (Approved) -> ต้องทำการหักยอดสิทธิ์คงเหลือจริง (BR-03)
	if input.Status == "approved" {
		var remain models.BenefitRemain
		err := tx.
			Joins("JOIN employee_benefits ON employee_benefits.benefit_id = benefit_remains.benefit_id").
			Where("employee_benefits.employee_id = ? AND employee_benefits.welfare_type_id = ? AND benefit_remains.remaining_amount >= ?", request.EmployeeID, request.WelfareTypeID, request.Quantity).
			First(&remain).Error

		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่สามารถอนุมัติได้เนื่องจากสิทธิ์คงเหลือของพนักงานไม่เพียงพอ"})
			return
		}

		// หักยอดสิทธิ์คงเหลือ
		remain.RemainingAmount -= request.Quantity
		remain.TotalUsed += request.Quantity
		remain.LastUpdate = time.Now()

		if err := tx.Save(&remain).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ปรับปรุงยอดสิทธิ์คงเหลือล้มเหลว"})
			return
		}
	}

	// 2. อัปเดตสถานะคำขอ
	request.Status = input.Status
	tx.Save(&request)

	// 3. บันทึกข้อมูลการอนุมัติ (ApprovalWelfare)
	approval := models.ApprovalWelfare{
		WelfareRequestID:   request.WelfareRequestID,
		ApproverEmployeeID: hrEmployeeID.(uint),
		ApprovalDate:       time.Now(),
		ApprovalStatus:     input.Status,
		Notes:              input.Notes,
	}
	tx.Create(&approval)

	// 4. บันทึกประวัติสวัสดิการ (Welfare History)
	history := models.WelfareHistory{
		EmployeeID:       request.EmployeeID,
		WelfareTypeID:    request.WelfareTypeID,
		WelfareRequestID: request.WelfareRequestID,
		ApprovalID:       approval.ApprovalID,
		ActionType:       input.Status,
		ActionDate:       time.Now(),
		Description:      fmt.Sprintf("คำขอได้รับการ %s โดย HR: %s", input.Status, input.Notes),
	}
	tx.Create(&history)

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "ดำเนินการพิจารณาคำขอเรียบร้อยแล้ว", "status": input.Status})
}

// ==========================================
// FR-11: กำหนดสิทธิ์สวัสดิการให้พนักงานรายคน
// ==========================================
type AssignBenefitInput struct {
	EmployeeID    uint   `json:"employee_id" binding:"required"`
	WelfareTypeID uint   `json:"welfare_type_id" binding:"required"`
	PolicyID      uint   `json:"policy_id" binding:"required"`
	Quantity      int    `json:"quantity" binding:"required"`
	ExpireDate    string `json:"expire_date" binding:"required"` // Format: YYYY-MM-DD
}

func AssignBenefit(c *gin.Context) {
	var input AssignBenefitInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	expireTime, err := time.Parse("2006-01-02", input.ExpireDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบวันหมดอายุไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)"})
		return
	}

	tx := config.DB.Begin()

	// 1. เพิ่มตาราง EmployeeBenefit
	benefit := models.EmployeeBenefit{
		EmployeeID:        input.EmployeeID,
		WelfareTypeID:     input.WelfareTypeID,
		PolicyID:          input.PolicyID,
		BenefitQuantity:   input.Quantity,
		ReceiveDate:       time.Now(),
		BenefitExpireDate: expireTime,
		Status:            "active",
	}
	if err := tx.Create(&benefit).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "มอบสิทธิ์ไม่สำเร็จ"})
		return
	}

	// 2. สร้างยอดสิทธิ์คงเหลือเริ่มต้น (BenefitRemain)
	remain := models.BenefitRemain{
		BenefitID:       benefit.BenefitID,
		TotalBenefit:    input.Quantity,
		RemainingAmount: input.Quantity,
		TotalUsed:       0,
		Year:            time.Now().Year(),
		StartDate:       time.Now(),
		EndDate:         expireTime,
		LastUpdate:      time.Now(),
	}
	tx.Create(&remain)

	// 3. บันทึกประวัติ
	history := models.WelfareHistory{
		EmployeeID:    input.EmployeeID,
		WelfareTypeID: input.WelfareTypeID,
		PolicyID:      input.PolicyID,
		ActionType:    "assign_benefit",
		ActionDate:    time.Now(),
		Description:   fmt.Sprintf("มอบสิทธิ์สวัสดิการตั้งต้นจำนวน %d หน่วย", input.Quantity),
	}
	tx.Create(&history)

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "มอบสิทธิ์สวัสดิการสำเร็จ ยอดคงเหลือเริ่มต้นใช้งานได้ทันที"})
}

// ==========================================
// FR-12: เพิ่ม/แก้ไข/ลบ ประเภทและนโยบายสวัสดิการ (CRUD)
// ==========================================

// Create Welfare Type
func CreateWelfareType(c *gin.Context) {
	var wType models.WelfareType
	if err := c.ShouldBindJSON(&wType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	config.DB.Create(&wType)
	c.JSON(http.StatusOK, wType)
}

// Update Welfare Type
func UpdateWelfareType(c *gin.Context) {
	id := c.Param("id")
	var wType models.WelfareType
	if err := config.DB.First(&wType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลประเภทสวัสดิการ"})
		return
	}
	if err := c.ShouldBindJSON(&wType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	config.DB.Save(&wType)
	c.JSON(http.StatusOK, wType)
}

// Delete Welfare Type (Soft Delete ด้วยการเปลี่ยนสถานะ)
func DeleteWelfareType(c *gin.Context) {
	id := c.Param("id")
	config.DB.Model(&models.WelfareType{}).Where("welfare_type_id = ?", id).Update("status", "inactive")
	c.JSON(http.StatusOK, gin.H{"message": "ลบประเภทสวัสดิการเรียบร้อยแล้ว"})
}

// ==========================================
// FR-13: รายงานสรุปสถิติการใช้งานสวัสดิการทั้งหมด
// ==========================================
func GetWelfareReport(c *gin.Context) {
	type ReportResult struct {
		WelfareName string `json:"welfare_name"`
		TotalQuota  int    `json:"total_quota"`
		TotalUsed   int    `json:"total_used"`
		Remaining   int    `json:"remaining"`
	}

	var reports []ReportResult
	query := `
		SELECT 
			wt.welfare_name,
			COALESCE(SUM(br.total_benefit), 0) as total_quota,
			COALESCE(SUM(br.total_used), 0) as total_used,
			COALESCE(SUM(br.remaining_amount), 0) as remaining
		FROM welfare_types wt
		LEFT JOIN employee_benefits eb ON eb.welfare_type_id = wt.welfare_type_id
		LEFT JOIN benefit_remains br ON br.benefit_id = eb.benefit_id
		WHERE wt.status = 'active'
		GROUP BY wt.welfare_name
	`

	if err := config.DB.Raw(query).Scan(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// ==========================================
// FR-14: จัดการข้อมูลแม่บ้าน/พนักงาน (CRUD Employees)
// ==========================================

func CreateEmployee(c *gin.Context) {
	var input struct {
		EmployeeName string `json:"employee_name" binding:"required"`
		Phone        string `json:"phone" binding:"required"`
		Password     string `json:"password" binding:"required"`
		Position     string `json:"position"`
		EmployeeType string `json:"employee_type"`
		DormID       uint   `json:"dorm_id"`
		Role         string `json:"role"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// แฮชรหัสผ่านความปลอดภัยสูงด้วย bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เข้ารหัสผ่านไม่สำเร็จ"})
		return
	}

	emp := models.Employee{
		EmployeeName:   input.EmployeeName,
		Phone:          input.Phone,
		PasswordHash:   string(hashedPassword),
		StartDate:      time.Now(),
		Position:       input.Position,
		EmployeeType:   input.EmployeeType,
		EmployeeStatus: "active",
		DormID:         input.DormID,
		Role:           input.Role,
	}

	if err := config.DB.Create(&emp).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เบอร์โทรศัพท์ซ้ำหรือข้อมูลไม่ถูกต้อง"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "เพิ่มข้อมูลพนักงานสำเร็จ", "employee_id": emp.EmployeeID})
}

func GetAllEmployees(c *gin.Context) {
	var employees []models.Employee
	if err := config.DB.Where("employee_status = 'active'").Find(&employees).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, employees)
}

func DeleteEmployee(c *gin.Context) {
	id := c.Param("id")
	// ทำการ Soft Delete โดยอัปเดตสถานะเป็น inactive
	config.DB.Model(&models.Employee{}).Where("employee_id = ?", id).Update("employee_status", "inactive")
	c.JSON(http.StatusOK, gin.H{"message": "ระงับการใช้งานพนักงานเรียบร้อย"})
}

// ==========================================
// FR-15: อัปโหลดและจัดการไฟล์เอกสารประกอบ
// ==========================================
func ServeAttachment(c *gin.Context) {
	// ป้องกัน Directory Traversal ด้วยการใช้ filepath.Clean
	filename := filepath.Base(c.Param("filename"))
	filePath := filepath.Join("./uploads", filename)

	// ส่งไฟล์กลับไปให้ Client/React แสดงผล (รูปภาพ หรือ PDF)
	c.File(filePath)
}