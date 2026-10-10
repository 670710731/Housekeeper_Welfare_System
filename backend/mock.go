package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"Housekeeper_Welfare_System/middleware"
	"github.com/gin-gonic/gin"
)

type mockStore struct {
	mu         sync.Mutex
	employees  []map[string]any
	types      []map[string]any
	policies   []map[string]any
	benefits   []map[string]any
	requests   []map[string]any
	history    []map[string]any
	nextReqID  int
	nextHistID int
}

func newMockStore() *mockStore {
	store := &mockStore{
		employees: []map[string]any{
			{"employee_id": uint(1), "employee_name": "ผู้ดูแลระบบ HR", "phone": "0812345678", "role": "HR", "position": "HR Specialist", "employee_status": "active"},
			{"employee_id": uint(2), "employee_name": "สมศรี มีสุข", "phone": "0891112233", "role": "Employee", "position": "พนักงานแม่บ้านประจำ อาคาร A", "employee_status": "active"},
			{"employee_id": uint(3), "employee_name": "สมพร ขยันยิ่ง", "phone": "0892223344", "role": "Employee", "position": "พนักงานแม่บ้านประจำ อาคาร B", "employee_status": "active"},
			{"employee_id": uint(4), "employee_name": "บัวลอย สดใส", "phone": "0893334455", "role": "Employee", "position": "พนักงานแม่บ้านประจำ อาคาร C", "employee_status": "active"},
		},
		types: []map[string]any{
			{"welfare_type_id": uint(1), "welfare_name": "วันลา", "welfare_description": "การลาป่วย ลากิจทั่วไป", "status": "active"},
			{"welfare_type_id": uint(2), "welfare_name": "ลาพักร้อน", "welfare_description": "การลาพักผ่อนประจำปี", "status": "active"},
			{"welfare_type_id": uint(3), "welfare_name": "ประกันสังคม", "welfare_description": "สิทธิประกันสังคมและกองทุน", "status": "active"},
			{"welfare_type_id": uint(4), "welfare_name": "เสื้อทำงาน", "welfare_description": "ชุดยูนิฟอร์มแม่บ้านประจำปี", "status": "active"},
		},
		policies: []map[string]any{
			{"policy_id": uint(1), "welfare_type_id": uint(1), "policy_name": "วันลาป่วย", "benefit_quantity": 30, "condition": "แนบเอกสารรับรองแพทย์", "status": "active"},
			{"policy_id": uint(2), "welfare_type_id": uint(2), "policy_name": "ลาพักร้อน", "benefit_quantity": 6, "condition": "ยื่นล่วงหน้าอย่างน้อย 3 วัน", "status": "active"},
			{"policy_id": uint(3), "welfare_type_id": uint(3), "policy_name": "ประกันสังคม", "benefit_quantity": 2000, "condition": "แนบเอกสารประกอบ", "status": "active"},
			{"policy_id": uint(4), "welfare_type_id": uint(4), "policy_name": "เสื้อทำงาน", "benefit_quantity": 3, "condition": "สิทธิชุดยูนิฟอร์มประจำปี", "status": "active"},
		},
		benefits:  []map[string]any{},
		requests:  []map[string]any{},
		history:   []map[string]any{},
		nextReqID: 2, nextHistID: 1,
	}

	quotas := [][]int{{30, 6, 2000, 3}, {30, 6, 2000, 3}, {30, 6, 2000, 3}}
	used := [][]int{{2, 1, 500, 2}, {0, 3, 0, 1}, {5, 0, 1200, 3}}
	benefitID := uint(1)
	remainID := uint(1)
	for employeeIndex := range quotas {
		for typeIndex, quota := range quotas[employeeIndex] {
			store.benefits = append(store.benefits, map[string]any{
				"remain_id":        remainID,
				"benefit_id":       benefitID,
				"total_benefit":    quota,
				"remaining_amount": quota - used[employeeIndex][typeIndex],
				"total_used":       used[employeeIndex][typeIndex],
				"year":             time.Now().Year(),
				"benefit": map[string]any{
					"benefit_id":       benefitID,
					"employee_id":      uint(employeeIndex + 2),
					"welfare_type_id":  uint(typeIndex + 1),
					"policy_id":        uint(typeIndex + 1),
					"benefit_quantity": quota,
					"status":           "active",
				},
			})
			benefitID++
			remainID++
		}
	}
	store.history = append(store.history, map[string]any{
		"welfare_history_id": store.nextHistID,
		"employee_id":        uint(2),
		"welfare_type_id":    uint(1),
		"action_type":        "approved",
		"action_date":        time.Now().AddDate(0, -1, 0),
		"description":        "คำขอจำนวน 2 หน่วยได้รับการอนุมัติ",
	})
	store.nextHistID++
	store.requests = append(store.requests, map[string]any{
		"welfare_request_id": 1,
		"employee_id":        uint(2),
		"welfare_type_id":    uint(4),
		"request_date":       time.Now().AddDate(0, 0, -1),
		"quantity":           1,
		"reason":             "ชุดยูนิฟอร์มชำรุด ต้องการเปลี่ยนชุดใหม่",
		"status":             "pending",
		"attachments":        []map[string]any{},
		"approvals":          []map[string]any{},
	})
	return store
}

func registerMockRoutes(r *gin.Engine) {
	store := newMockStore()
	r.POST("/api/login", func(c *gin.Context) {
		var input struct {
			Phone    string `json:"phone" binding:"required"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอกเบอร์โทรศัพท์และรหัสผ่าน"})
			return
		}
		store.mu.Lock()
		defer store.mu.Unlock()
		for _, employee := range store.employees {
			if employee["phone"] == normalizeMockPhone(input.Phone) && input.Password == mockPassword(employee["phone"].(string)) {
				role := employee["role"].(string)
				token, err := middleware.GenerateJWT(employee["employee_id"].(uint), role)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง token ไม่สำเร็จ"})
					return
				}
				c.JSON(http.StatusOK, gin.H{"token": token, "employee_id": employee["employee_id"], "name": employee["employee_name"], "role": role})
				return
			}
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง"})
	})

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	api.GET("/welfare-types", func(c *gin.Context) { c.JSON(http.StatusOK, store.types) })
	api.GET("/policies", func(c *gin.Context) { c.JSON(http.StatusOK, store.policies) })
	api.GET("/my-benefits", func(c *gin.Context) {
		store.mu.Lock()
		defer store.mu.Unlock()
		employeeID, _ := c.Get("employee_id")
		c.JSON(http.StatusOK, store.employeeBenefits(employeeID.(uint)))
	})
	api.GET("/my-requests", func(c *gin.Context) {
		store.mu.Lock()
		defer store.mu.Unlock()
		employeeID, _ := c.Get("employee_id")
		c.JSON(http.StatusOK, store.requestsFor(employeeID.(uint)))
	})
	api.GET("/my-history", func(c *gin.Context) {
		store.mu.Lock()
		defer store.mu.Unlock()
		employeeID, _ := c.Get("employee_id")
		c.JSON(http.StatusOK, store.historyFor(employeeID.(uint)))
	})
	api.POST("/requests", func(c *gin.Context) {
		store.mu.Lock()
		defer store.mu.Unlock()
		employeeID, _ := c.Get("employee_id")
		typeID, _ := strconv.Atoi(c.PostForm("welfare_type_id"))
		quantity, _ := strconv.Atoi(c.PostForm("quantity"))
		reason := strings.TrimSpace(c.PostForm("reason"))
		if typeID < 1 || typeID > len(store.types) || quantity < 1 || reason == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลคำขอไม่ถูกต้อง"})
			return
		}
		var attachmentName any
		if file, err := c.FormFile("attachment"); err == nil {
			attachmentName = file.Filename
		}
		if (typeID == 1 || typeID == 3) && attachmentName == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "สวัสดิการนี้ต้องแนบเอกสาร"})
			return
		}
		var remain map[string]any
		for _, benefit := range store.benefits {
			linked := benefit["benefit"].(map[string]any)
			if linked["employee_id"] == employeeID && linked["welfare_type_id"] == uint(typeID) {
				remain = benefit
				break
			}
		}
		if remain == nil || quantity > remain["remaining_amount"].(int) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "สิทธิคงเหลือไม่เพียงพอ"})
			return
		}
		request := map[string]any{
			"welfare_request_id": store.nextReqID,
			"employee_id":        employeeID,
			"welfare_type_id":    uint(typeID),
			"request_date":       time.Now(),
			"quantity":           quantity,
			"reason":             reason,
			"status":             "pending",
			"attachments":        []map[string]any{},
			"approvals":          []map[string]any{},
		}
		if attachmentName != nil {
			request["attachments"] = []map[string]any{{"file_name": attachmentName}}
		}
		store.requests = append([]map[string]any{request}, store.requests...)
		store.history = append([]map[string]any{{
			"welfare_history_id": store.nextHistID,
			"employee_id":        employeeID,
			"welfare_type_id":    uint(typeID),
			"action_type":        "request",
			"action_date":        time.Now(),
			"description":        fmt.Sprintf("ยื่นคำขอสวัสดิการจำนวน %d หน่วย", quantity),
		}}, store.history...)
		store.nextReqID++
		store.nextHistID++
		c.JSON(http.StatusOK, gin.H{"message": "ส่งคำขอสำเร็จ (Mock Mode)", "request_id": request["welfare_request_id"]})
	})

	hr := api.Group("/hr")
	hr.Use(middleware.AuthMiddleware("HR"))
	hr.GET("/employees", func(c *gin.Context) { c.JSON(http.StatusOK, store.employees[1:]) })
	hr.GET("/requests", func(c *gin.Context) {
		store.mu.Lock()
		defer store.mu.Unlock()
		c.JSON(http.StatusOK, store.requests)
	})
	hr.GET("/benefits", func(c *gin.Context) {
		store.mu.Lock()
		defer store.mu.Unlock()
		c.JSON(http.StatusOK, store.benefits)
	})
	hr.GET("/history", func(c *gin.Context) {
		store.mu.Lock()
		defer store.mu.Unlock()
		c.JSON(http.StatusOK, store.history)
	})
	hr.POST("/requests/:id/decide", func(c *gin.Context) {
		var input struct {
			Status string `json:"status" binding:"required"`
			Notes  string `json:"notes"`
		}
		if err := c.ShouldBindJSON(&input); err != nil || (input.Status != "approved" && input.Status != "rejected") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "สถานะคำขอไม่ถูกต้อง"})
			return
		}
		id, _ := strconv.Atoi(c.Param("id"))
		store.mu.Lock()
		defer store.mu.Unlock()
		for _, request := range store.requests {
			if request["welfare_request_id"] == id && request["status"] == "pending" {
				if input.Status == "approved" {
					employeeID := request["employee_id"].(uint)
					typeID := request["welfare_type_id"].(uint)
					for _, benefit := range store.benefits {
						linked := benefit["benefit"].(map[string]any)
						if linked["employee_id"] == employeeID && linked["welfare_type_id"] == typeID {
							quantity := request["quantity"].(int)
							if quantity > benefit["remaining_amount"].(int) {
								c.JSON(http.StatusBadRequest, gin.H{"error": "สิทธิคงเหลือไม่เพียงพอ"})
								return
							}
							benefit["remaining_amount"] = benefit["remaining_amount"].(int) - quantity
							benefit["total_used"] = benefit["total_used"].(int) + quantity
						}
					}
				}
				request["status"] = input.Status
				request["approvals"] = []map[string]any{{"approval_status": input.Status, "notes": input.Notes}}
				store.history = append([]map[string]any{{
					"welfare_history_id": store.nextHistID,
					"employee_id":        request["employee_id"],
					"welfare_type_id":    request["welfare_type_id"],
					"action_type":        input.Status,
					"action_date":        time.Now(),
					"description":        fmt.Sprintf("คำขอจำนวน %d หน่วยได้รับการ %s: %s", request["quantity"], input.Status, input.Notes),
				}}, store.history...)
				store.nextHistID++
				c.JSON(http.StatusOK, gin.H{"message": "ดำเนินการสำเร็จ (Mock Mode)", "status": input.Status})
				return
			}
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบคำขอที่รอดำเนินการ"})
	})
	hr.PUT("/benefits/:id", func(c *gin.Context) {
		var input struct {
			Quantity int `json:"quantity"`
		}
		if err := c.ShouldBindJSON(&input); err != nil || input.Quantity < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "จำนวนโควตาไม่ถูกต้อง"})
			return
		}
		benefitID, _ := strconv.Atoi(c.Param("id"))
		store.mu.Lock()
		defer store.mu.Unlock()
		for _, benefit := range store.benefits {
			if benefit["benefit_id"] == uint(benefitID) {
				used := benefit["total_used"].(int)
				if input.Quantity < used {
					c.JSON(http.StatusBadRequest, gin.H{"error": "โควตาใหม่ต้องไม่น้อยกว่าที่ใช้ไปแล้ว"})
					return
				}
				benefit["total_benefit"] = input.Quantity
				benefit["remaining_amount"] = input.Quantity - used
				benefit["benefit"].(map[string]any)["benefit_quantity"] = input.Quantity
				c.JSON(http.StatusOK, gin.H{"message": "อัปเดตโควตาสำเร็จ (Mock Mode)"})
				return
			}
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบสิทธิ์สวัสดิการ"})
	})
	hr.POST("/distributions", func(c *gin.Context) {
		var input struct {
			EmployeeID    uint   `json:"employee_id"`
			WelfareTypeID uint   `json:"welfare_type_id"`
			Quantity      int    `json:"quantity"`
			Note          string `json:"note"`
		}
		if err := c.ShouldBindJSON(&input); err != nil || input.Quantity < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลการแจกจ่ายไม่ถูกต้อง"})
			return
		}
		store.mu.Lock()
		defer store.mu.Unlock()
		for _, benefit := range store.benefits {
			linked := benefit["benefit"].(map[string]any)
			if linked["employee_id"] == input.EmployeeID && linked["welfare_type_id"] == input.WelfareTypeID {
				if input.Quantity > benefit["remaining_amount"].(int) {
					c.JSON(http.StatusBadRequest, gin.H{"error": "สิทธิคงเหลือไม่เพียงพอ"})
					return
				}
				benefit["remaining_amount"] = benefit["remaining_amount"].(int) - input.Quantity
				benefit["total_used"] = benefit["total_used"].(int) + input.Quantity
				store.history = append([]map[string]any{{
					"welfare_history_id": store.nextHistID,
					"employee_id":        input.EmployeeID,
					"welfare_type_id":    input.WelfareTypeID,
					"action_type":        "direct_distribution",
					"action_date":        time.Now(),
					"description":        fmt.Sprintf("แจกจ่ายจำนวน %d หน่วย: %s", input.Quantity, input.Note),
				}}, store.history...)
				store.nextHistID++
				c.JSON(http.StatusOK, gin.H{"message": "บันทึกการแจกจ่ายสำเร็จ (Mock Mode)"})
				return
			}
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบสิทธิ์ที่ใช้งานได้"})
	})
}

func (s *mockStore) employeeBenefits(employeeID uint) []map[string]any {
	var result []map[string]any
	for _, benefit := range s.benefits {
		if benefit["benefit"].(map[string]any)["employee_id"] == employeeID {
			result = append(result, benefit)
		}
	}
	return result
}

func (s *mockStore) requestsFor(employeeID uint) []map[string]any {
	var result []map[string]any
	for _, request := range s.requests {
		if request["employee_id"] == employeeID {
			result = append(result, request)
		}
	}
	return result
}

func (s *mockStore) historyFor(employeeID uint) []map[string]any {
	var result []map[string]any
	for _, entry := range s.history {
		if entry["employee_id"] == employeeID {
			result = append(result, entry)
		}
	}
	return result
}

func mockPassword(phone string) string {
	if phone == "0812345678" {
		return "123456"
	}
	return "password123"
}

func normalizeMockPhone(phone string) string {
	phone = strings.ReplaceAll(phone, "-", "")
	return strings.ReplaceAll(phone, " ", "")
}
