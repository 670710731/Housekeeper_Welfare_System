package main

import (
	"log"
	"os"

	"Housekeeper_Welfare_System/config"
	"Housekeeper_Welfare_System/handlers"
	"Housekeeper_Welfare_System/middleware"

	"github.com/gin-gonic/gin"
)

// ฟังก์ชันเปิด CORS เพื่อเชื่อมต่อกับ React App
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // หรือใส่ URL ของ React เช่น http://localhost:3000
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {
	// 1. เชื่อมต่อฐานข้อมูล PostgreSQL
	config.ConnectDatabase()

	// สร้าง Folder เก็บเอกสารคำขอสวัสดิการถ้ายังไม่มี (FR-15)
	if _, err := os.Stat("./uploads"); os.IsNotExist(err) {
		err := os.Mkdir("./uploads", 0755)
		if err != nil {
			log.Fatal("ไม่สามารถสร้างโฟลเดอร์สำหรับเก็บอัปโหลดได้")
		}
	}

	r := gin.Default()
	r.Use(CORSMiddleware())

	// Route สาธารณะ (Public API)
	r.POST("/api/login", handlers.Login) // FR-01: เข้าสู่ระบบ
	r.GET("/attachments/:filename", handlers.ServeAttachment) // FR-15: ดึงเอกสารเพื่อเปิดอ่านบน React

	// Route ที่ต้องทำการตรวจสอบสิทธิ์โทเค็น (Authenticated Routes)
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware()) // ตรวจสอบ Token ว่ามีหรือไม่และยังไม่หมดอายุ
	{
		// ==============================
		// ฝั่งของพนักงาน/แม่บ้าน (Employee)
		// ==============================
		api.GET("/my-benefits", handlers.GetMyBenefits)     // FR-02 & FR-03: สิทธิ์สวัสดิการและสิทธิ์คงเหลือ
		api.GET("/policies", handlers.GetWelfarePolicies)   // FR-04: ดูนโยบายเงื่อนไข
		api.GET("/welfare-types", handlers.GetWelfareTypes)
		api.POST("/requests", handlers.RequestWelfare)      // FR-05 & FR-06: ส่งคำขอพร้อมเอกสารแนบ
		api.GET("/my-requests", handlers.GetMyRequests)     // FR-07: ตรวจสอบสถานะคำขอ
		api.GET("/my-history", handlers.GetMyHistory)       // FR-08: ประวัติการใช้งานสวัสดิการตนเอง

		// ==============================
		// ฝั่งของเจ้าหน้าที่ HR (ผู้จัดการ)
		// ==============================
		hrGroup := api.Group("/hr")
		hrGroup.Use(middleware.AuthMiddleware("HR")) // บังคับบทบาทเฉพาะ HR เท่านั้น (BR-06)
		{
			// จัดการคำขอ (FR-09 & FR-10)
			hrGroup.GET("/requests", handlers.GetAllRequests)      // ดูคำขอทั้งหมด
			hrGroup.POST("/requests/:id/decide", handlers.DecideRequest) // อนุมัติ/ปฏิเสธ
			hrGroup.GET("/benefits", handlers.GetAllBenefits)
			hrGroup.PUT("/benefits/:id", handlers.UpdateBenefitQuota)
			hrGroup.POST("/distributions", handlers.RecordDistribution)
			hrGroup.GET("/history", handlers.GetAllHistory)

			// กำหนดสิทธิ์ให้พนักงาน (FR-11)
			hrGroup.POST("/benefits/assign", handlers.AssignBenefit)

			// จัดการประเภทและนโยบายสวัสดิการ CRUD (FR-12)
			hrGroup.POST("/welfare-types", handlers.CreateWelfareType)
			hrGroup.PUT("/welfare-types/:id", handlers.UpdateWelfareType)
			hrGroup.DELETE("/welfare-types/:id", handlers.DeleteWelfareType)

			// ดูรายงานการใช้สถิติ (FR-13)
			hrGroup.GET("/reports/summary", handlers.GetWelfareReport)

			// จัดการพนักงาน CRUD (FR-14)
			hrGroup.POST("/employees", handlers.CreateEmployee)
			hrGroup.GET("/employees", handlers.GetAllEmployees)
			hrGroup.DELETE("/employees/:id", handlers.DeleteEmployee)
		}
	}

	// เริ่มรันเซิร์ฟเวอร์ที่ Port 8080
	r.Run(":8080")
}