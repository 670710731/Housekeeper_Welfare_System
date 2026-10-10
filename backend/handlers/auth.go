// Login handler for the Housekeeper Welfare System

package handlers

import (
	"Housekeeper_Welfare_System/config"
	"Housekeeper_Welfare_System/middleware"
	"Housekeeper_Welfare_System/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"net/http"
)

type LoginInput struct {
	Identifier string `json:"identifier"`
	Phone      string `json:"phone"`
	Password   string `json:"password" binding:"required"`
}

// FR-01 Login
func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	identifier := input.Identifier
	if identifier == "" {
		identifier = input.Phone
	}
	// Demo aliases: keep the presentation credentials independent from
	// the phone numbers stored in the database.
	switch identifier {
	case "ADMIN01":
		identifier = "0812345678"
	case "1001":
		identifier = "089-111-2233"
	}
	var employee models.Employee
	if err := config.DB.Where("employee_status = 'active' AND (phone = ? OR employee_id::text = ?)", identifier, identifier).First(&employee).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง"})
		return
	}

	// ตรวจสอบรหัสผ่าน
	err := bcrypt.CompareHashAndPassword([]byte(employee.PasswordHash), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง"})
		return
	}

	// สร้าง Token JWT
	token, err := middleware.GenerateJWT(employee.EmployeeID, employee.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":       token,
		"employee_id": employee.EmployeeID,
		"name":        employee.EmployeeName,
		"role":        employee.Role,
	})
}
