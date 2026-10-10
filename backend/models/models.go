package models

import (
	"time"
)

// 1
type Employee struct {
	EmployeeID     uint      `gorm:"primaryKey;column:employee_id" json:"employee_id"`
	EmployeeName   string    `gorm:"column:employee_name" json:"employee_name"`
	Phone          string    `gorm:"unique;column:phone" json:"phone"`
	PasswordHash   string    `gorm:"column:password_hash" json:"-"`
	StartDate      time.Time `gorm:"column:start_date" json:"start_date"`
	Position       string    `gorm:"column:position" json:"position"`
	EmployeeType   string    `gorm:"column:employee_type" json:"employee_type"`
	EmployeeStatus string    `gorm:"column:employee_status" json:"employee_status"`
	DormID         uint      `gorm:"column:dorm_id" json:"dorm_id"`
	Role           string    `gorm:"column:role" json:"role"` // Employee, HR
}

// 2
type WelfareType struct {
	WelfareTypeID      uint   `gorm:"primaryKey;column:welfare_type_id" json:"welfare_type_id"`
	WelfareName        string `gorm:"column:welfare_name" json:"welfare_name"`
	WelfareDescription string `gorm:"column:welfare_description" json:"welfare_description"`
	Status             string `gorm:"column:status" json:"status"`
}

// 3
type WelfarePolicy struct {
	PolicyID        uint   `gorm:"primaryKey;column:policy_id" json:"policy_id"`
	WelfareTypeID   uint   `gorm:"column:welfare_type_id" json:"welfare_type_id"`
	PolicyName      string `gorm:"column:policy_name" json:"policy_name"`
	BenefitQuantity int    `gorm:"column:benefit_quantity" json:"benefit_quantity"`
	Condition       string `gorm:"column:condition" json:"condition"`
	Status          string `gorm:"column:status" json:"status"`
}

// 4
type EmployeeBenefit struct {
	BenefitID         uint      `gorm:"primaryKey;column:benefit_id" json:"benefit_id"`
	EmployeeID        uint      `gorm:"column:employee_id" json:"employee_id"`
	WelfareTypeID     uint      `gorm:"column:welfare_type_id" json:"welfare_type_id"`
	PolicyID          uint      `gorm:"column:policy_id" json:"policy_id"`
	BenefitQuantity   int       `gorm:"column:benefit_quantity" json:"benefit_quantity"`
	ReceiveDate       time.Time `gorm:"column:receive_date" json:"receive_date"`
	BenefitExpireDate time.Time `gorm:"column:benefit_expire_date" json:"benefit_expire_date"`
	Status            string    `gorm:"column:status" json:"status"`
}

// 5
type BenefitRemain struct {
	RemainID        uint            `gorm:"primaryKey;column:remain_id" json:"remain_id"`
	BenefitID       uint            `gorm:"column:benefit_id" json:"benefit_id"`
	TotalBenefit    int             `gorm:"column:total_benefit" json:"total_benefit"`
	RemainingAmount int             `gorm:"column:remaining_amount" json:"remaining_amount"`
	TotalUsed       int             `gorm:"column:total_used" json:"total_used"`
	Year            int             `gorm:"column:year" json:"year"`
	StartDate       time.Time       `gorm:"column:start_date" json:"start_date"`
	EndDate         time.Time       `gorm:"column:end_date" json:"end_date"`
	LastUpdate      time.Time       `gorm:"column:last_update" json:"last_update"`
	Benefit         EmployeeBenefit `gorm:"foreignKey:BenefitID" json:"benefit"`
}

// 6
type WelfareRequest struct {
	WelfareRequestID uint         `gorm:"primaryKey;column:welfare_request_id" json:"welfare_request_id"`
	EmployeeID       uint         `gorm:"column:employee_id" json:"employee_id"`
	WelfareTypeID    uint         `gorm:"column:welfare_type_id" json:"welfare_type_id"`
	RequestDate      time.Time    `gorm:"column:request_date" json:"request_date"`
	Quantity         int          `gorm:"column:quantity" json:"quantity"`
	Reason           string       `gorm:"column:reason" json:"reason"`
	Status           string       `gorm:"column:status" json:"status"` // pending, approved, rejected
	Attachments      []Attachment `gorm:"foreignKey:WelfareRequestID" json:"attachments,omitempty"`
}

// 7
type Attachment struct {
	AttachmentID     uint      `gorm:"primaryKey;column:attachment_id" json:"attachment_id"`
	WelfareRequestID uint      `gorm:"column:welfare_request_id" json:"welfare_request_id"`
	FileName         string    `gorm:"column:file_name" json:"file_name"`
	FileType         string    `gorm:"column:file_type" json:"file_type"`
	FilePath         string    `gorm:"column:file_path" json:"file_path"`
	UploadDate       time.Time `gorm:"column:upload_date" json:"upload_date"`
	Status           string    `gorm:"column:status" json:"status"`
}

// 8
type ApprovalWelfare struct {
	ApprovalID         uint      `gorm:"primaryKey;column:approval_id" json:"approval_id"`
	WelfareRequestID   uint      `gorm:"column:welfare_request_id" json:"welfare_request_id"`
	ApproverEmployeeID uint      `gorm:"column:approver_employee_id" json:"approver_employee_id"`
	ApprovalDate       time.Time `gorm:"column:approval_date" json:"approval_date"`
	ApprovalStatus     string    `gorm:"column:approval_status" json:"approval_status"`
	Notes              string    `gorm:"column:notes" json:"notes"`
}

// 9
type WelfareHistory struct {
	WelfareHistoryID uint      `gorm:"primaryKey;column:welfare_history_id" json:"welfare_history_id"`
	EmployeeID       uint      `gorm:"column:employee_id" json:"employee_id"`
	WelfareTypeID    uint      `gorm:"column:welfare_type_id" json:"welfare_type_id"`
	WelfareRequestID uint      `gorm:"column:welfare_request_id" json:"welfare_request_id"`
	ApprovalID       *uint     `gorm:"column:approval_id" json:"approval_id,omitempty"`
	PolicyID         uint      `gorm:"column:policy_id" json:"policy_id"`
	ActionType       string    `gorm:"column:action_type" json:"action_type"`
	ActionDate       time.Time `gorm:"column:action_date" json:"action_date"`
	Description      string    `gorm:"column:description" json:"description"`
}
