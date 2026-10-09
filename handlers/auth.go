// Login handler for the Housekeeper Welfare System

package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"backend/config"
	"backend/models"
	"backend/middleware"
)

type LoginInput struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// FR-01 Login
func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var employee models.Employee
	if err := config.DB.Where("phone = ? AND employee_status = 'active'", input.Phone).First(&employee).Error; err != nil {
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
		"token": token,
		"employee_id": employee.EmployeeID,
		"name": employee.EmployeeName,
		"role": employee.Role,
	})
}