USE [ParkingManagementSystem]
GO

-- 1. Cho phép SessionID trong bảng Payments có thể NULL
ALTER TABLE Payments
ALTER COLUMN SessionID INT NULL;
GO

-- 2. Thêm cột ReservationID vào bảng Payments
ALTER TABLE Payments
ADD ReservationID INT NULL;
GO

-- 3. Thêm khóa ngoại cho ReservationID liên kết với bảng Reservations
ALTER TABLE Payments
ADD CONSTRAINT FK_Payments_Reservations 
FOREIGN KEY (ReservationID) REFERENCES Reservations(ReservationID);
GO

-- 4. Đảm bảo một thanh toán phải có SessionID HOẶC ReservationID
ALTER TABLE Payments
ADD CONSTRAINT CHK_Payments_SessionOrReservation 
CHECK (SessionID IS NOT NULL OR ReservationID IS NOT NULL);
GO
