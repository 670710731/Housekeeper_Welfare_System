package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"Housekeeper_Welfare_System/config"
	"Housekeeper_Welfare_System/models"
	"github.com/gin-gonic/gin"
)

// FR-02 ดูข้อมูลสวัสดิการของตนเอง & FR-03 ดูสิทธิ์คงเหลือ (BR-05 ดูได้เฉพาะตนเอง)
func GetMyBenefits(c *gin.Context) {
	employeeID, _ := c.Get("employee_id")

	var remains []models.BenefitRemain
	err := config.DB.
		Joins("JOIN employee_benefits ON employee_benefits.benefit_id = benefit_remains.benefit_id").
		Where("employee_benefits.employee_id = ? AND employee_benefits.status = 'active'", employeeID).
		Preload("Benefit").
		Find(&remains).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, remains)
}

// FR-04 ดูเงื่อนไขสวัสดิการทั้งหมด
func GetWelfarePolicies(c *gin.Context) {
	var policies []models.WelfarePolicy
	if err := config.DB.Where("status = 'active'").Find(&policies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, policies)
}

// GetWelfareTypes returns the active welfare categories used by the frontend.
func GetWelfareTypes(c *gin.Context) {
	var welfareTypes []models.WelfareType
	if err := config.DB.Where("status = 'active'").Find(&welfareTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, welfareTypes)
}

// FR-05 ยื่นคำขอสวัสดิการ และ FR-06 แนบเอกสารประกอบ
func RequestWelfare(c *gin.Context) {
	employeeIDRaw, _ := c.Get("employee_id")
	employeeID := employeeIDRaw.(uint)

	// รับค่าแบบ MultipartForm (เพื่อใช้รับเอกสารแนบตาม BR-02 / FR-06)
	welfareTypeID, _ := strconv.Atoi(c.PostForm("welfare_type_id"))
	quantity, _ := strconv.Atoi(c.PostForm("quantity"))
	reason := c.PostForm("reason")

	// 1. ตรวจสอบสิทธิ์คงเหลือเบื้องต้นก่อนส่งคำขอ (BR-01)
	var remain models.BenefitRemain
	err := config.DB.
		Joins("JOIN employee_benefits ON employee_benefits.benefit_id = benefit_remains.benefit_id").
		Where("employee_benefits.employee_id = ? AND employee_benefits.welfare_type_id = ? AND benefit_remains.remaining_amount >= ?", employeeID, welfareTypeID, quantity).
		First(&remain).Error

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "จำนวนสิทธิ์คงเหลือไม่เพียงพอสำหรับการทำเรื่องขอ"})
		return
	}

	// 2. ตรวจสอบการแนบเอกสาร (BR-02: เสื้อทำงาน/ลาพักร้อนอาจไม่ต้องแนบ แต่วันลาป่วยต้องแนบ เป็นต้น)
	// สมมุติกำหนดให้ WelfareTypeID = 1 (วันลาป่วยทั่วไป) หรือ 3 (ประกันสังคม) ต้องมีเอกสาร
	file, err := c.FormFile("attachment")
	if (welfareTypeID == 1 || welfareTypeID == 3) && err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "การขอสวัสดิการประเภทนี้จำเป็นต้องแนบเอกสารก่อน (BR-02)"})
		return
	}

	tx := config.DB.Begin()

	// 3. บันทึกตาราง Welfare Request (BR-03: ยังไม่มีผลต่อยอดสิทธิ์คงเหลือจนกว่าจะอนุมัติ)
	request := models.WelfareRequest{
		EmployeeID:    employeeID,
		WelfareTypeID: uint(welfareTypeID),
		RequestDate:   time.Now(),
		Quantity:      quantity,
		Reason:        reason,
		Status:        "pending",
	}

	if err := tx.Create(&request).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถส่งคำขอได้"})
		return
	}

	// 4. บันทึกเอกสาร (ถ้ามี)
	if file != nil {
		filename := fmt.Sprintf("%d_%d_%s", request.WelfareRequestID, time.Now().Unix(), filepath.Base(file.Filename))
		savePath := filepath.Join("./uploads", filename)

		if err := c.SaveUploadedFile(file, savePath); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์เอกสารล้มเหลว"})
			return
		}

		attachment := models.Attachment{
			WelfareRequestID: request.WelfareRequestID,
			FileName:         file.Filename,
			FileType:         filepath.Ext(file.Filename),
			FilePath:         savePath,
			UploadDate:       time.Now(),
			Status:           "active",
		}
		if err := tx.Create(&attachment).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกข้อมูลเอกสารในระบบล้มเหลว"})
			return
		}
	}

	// 5. บันทึกประวัติประวัติเบื้องต้น
	history := models.WelfareHistory{
		EmployeeID:       employeeID,
		WelfareTypeID:    uint(welfareTypeID),
		WelfareRequestID: request.WelfareRequestID,
		ActionType:       "request",
		ActionDate:       time.Now(),
		Description:      fmt.Sprintf("ยื่นคำขอสวัสดิการจำนวน %d หน่วย", quantity),
	}
	tx.Create(&history)

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "ส่งคำขอสำเร็จเรียบร้อย อยู่ระหว่างรอการตรวจสอบ", "request_id": request.WelfareRequestID})
}

// FR-07 ตรวจสอบสถานะคำขอของตนเอง
func GetMyRequests(c *gin.Context) {
	employeeID, _ := c.Get("employee_id")
	var requests []models.WelfareRequest

	if err := config.DB.Where("employee_id = ?", employeeID).Preload("Attachments").Order("request_date desc").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, requests)
}

// FR-08 ดูประวัติการใช้งาน/การขอสวัสดิการของตนเอง
func GetMyHistory(c *gin.Context) {
	employeeID, _ := c.Get("employee_id")
	var histories []models.WelfareHistory

	err := config.DB.
		Where("employee_id = ?", employeeID).
		Order("action_date desc").
		Find(&histories).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลประวัติได้: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, histories)
}
