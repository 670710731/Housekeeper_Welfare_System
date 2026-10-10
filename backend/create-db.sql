-- 1. ตารางประเภทสวัสดิการ (Welfare Type)
CREATE TABLE welfare_types (
    welfare_type_id SERIAL PRIMARY KEY,
    welfare_name VARCHAR(100) NOT NULL,
    welfare_description TEXT,
    status VARCHAR(20) DEFAULT 'active' -- active, inactive
);

-- 2. ตารางเงื่อนไขสวัสดิการ (Welfare Policy)
CREATE TABLE welfare_policies (
    policy_id SERIAL PRIMARY KEY,
    welfare_type_id INT REFERENCES welfare_types(welfare_type_id),
    policy_name VARCHAR(150) NOT NULL,
    benefit_quantity INT NOT NULL,
    condition TEXT,
    status VARCHAR(20) DEFAULT 'active'
);

-- 3. ตารางข้อมูลแม่บ้าน (Employee)
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    employee_name VARCHAR(150) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- สำหรับ Login (FR-01)
    start_date DATE NOT NULL,
    position VARCHAR(100),
    employee_type VARCHAR(50), -- เช่น ประจำ, พาร์ทไทม์
    employee_status VARCHAR(20) DEFAULT 'active',
    dorm_id INT, -- ไอดีหอพักที่สังกัด
    role VARCHAR(20) DEFAULT 'Employee' -- Employee, HR
);

-- 4. ตารางสิทธิ์ของแม่บ้าน (Employee Benefit)
CREATE TABLE employee_benefits (
    benefit_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id) ON DELETE CASCADE,
    welfare_type_id INT REFERENCES welfare_types(welfare_type_id),
    policy_id INT REFERENCES welfare_policies(policy_id),
    benefit_quantity INT NOT NULL,
    receive_date DATE NOT NULL,
    benefit_expire_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active'
);

-- 5. ตารางสิทธิ์คงเหลือ (Benefit Remain)
CREATE TABLE benefit_remains (
    remain_id SERIAL PRIMARY KEY,
    benefit_id INT REFERENCES employee_benefits(benefit_id) ON DELETE CASCADE,
    total_benefit INT NOT NULL,
    remaining_amount INT NOT NULL,
    total_used INT DEFAULT 0,
    year INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ตารางคำขอสวัสดิการ (Welfare Request)
CREATE TABLE welfare_requests (
    welfare_request_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id) ON DELETE CASCADE,
    welfare_type_id INT REFERENCES welfare_types(welfare_type_id),
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quantity INT NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' -- pending, approved, rejected
);

-- 7. ตารางเอกสารแนบ (Attachment)
CREATE TABLE attachments (
    attachment_id SERIAL PRIMARY KEY,
    welfare_request_id INT REFERENCES welfare_requests(welfare_request_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_path VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- 8. ตารางการอนุมัติสวัสดิการ (Approval Welfare)
CREATE TABLE approval_welfares (
    approval_id SERIAL PRIMARY KEY,
    welfare_request_id INT REFERENCES welfare_requests(welfare_request_id) ON DELETE CASCADE,
    approver_employee_id INT REFERENCES employees(employee_id),
    approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_status VARCHAR(20) NOT NULL, -- approved, rejected
    notes TEXT
);

-- 9. ตารางประวัติสวัสดิการ (Welfare History)
CREATE TABLE welfare_histories (
    welfare_history_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id) ON DELETE CASCADE,
    welfare_type_id INT REFERENCES welfare_types(welfare_type_id),
    welfare_request_id INT REFERENCES welfare_requests(welfare_request_id),
    approval_id INT REFERENCES approval_welfares(approval_id),
    policy_id INT REFERENCES welfare_policies(policy_id),
    action_type VARCHAR(50) NOT NULL, -- 'request', 'approve', 'reject', 'assign_benefit'
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- สอดคล้องกับหัวข้อ: เริ่มต้นข้อมูลสวัสดิการ 4 ประเภทหลัก
INSERT INTO welfare_types (welfare_name, welfare_description, status) VALUES
('วันลา', 'การลาป่วย ลากิจ ทั่วไป', 'active'),
('ลาพักร้อน', 'การลาพักผ่อนประจำปี', 'active'),
('ประกันสังคม', 'สิทธิประกันสังคมกองทุน', 'active'),
('เสื้อทำงาน', 'ชุดยูนิฟอร์มแม่บ้านประจำปี', 'active');

-- สร้าง HR ตั้งต้น (รหัสผ่าน: 123456)
INSERT INTO employees (employee_name, phone, password_hash, start_date, position, employee_type, employee_status, dorm_id, role)
VALUES ('ผู้ดูแลระบบ HR', '0812345678', '$2a$10$MvN3wZ8YlR3g3L1/D1Lq.uY5rF4TdfzXN.I2U3vKexg6YvNqH2C2q', CURRENT_DATE, 'HR Specialist', 'ประจำ', 'active', 1, 'HR');