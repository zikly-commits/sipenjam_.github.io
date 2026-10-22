CREATE DATABASE IF NOT EXISTS `sipenjam_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sipenjam_db`;

-- 1. Tabel Employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` VARCHAR(50) NOT NULL,
  `nip` VARCHAR(30) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `position` VARCHAR(100) DEFAULT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) NOT NULL,
  `photo` VARCHAR(255) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'pegawai') NOT NULL DEFAULT 'pegawai',
  `employee_id` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Rooms
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` VARCHAR(50) NOT NULL,
  `room_name` VARCHAR(100) NOT NULL,
  `capacity` INT NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `facilities` TEXT NOT NULL,
  `status` ENUM('Tersedia', 'Digunakan', 'Tidak tersedia') DEFAULT 'Tersedia',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Vehicles
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` VARCHAR(50) NOT NULL,
  `vehicle_type` ENUM('Mobil', 'Motor') NOT NULL,
  `brand` VARCHAR(50) NOT NULL,
  `model` VARCHAR(50) NOT NULL,
  `license_plate` VARCHAR(20) NOT NULL,
  `year` INT NOT NULL,
  `condition` VARCHAR(50) DEFAULT 'Baik',
  `status` ENUM('Tersedia', 'Dipinjam', 'Servis') DEFAULT 'Tersedia',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Room Bookings
CREATE TABLE IF NOT EXISTS `room_bookings` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `applicant_name` VARCHAR(100) NOT NULL,
  `nip` VARCHAR(30) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `room_id` VARCHAR(50) NOT NULL,
  `activity_name` VARCHAR(150) NOT NULL,
  `booking_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `participants` INT NOT NULL,
  `purpose` TEXT NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('Menunggu', 'Disetujui', 'Ditolak', 'Selesai') DEFAULT 'Menunggu',
  `rejection_reason` TEXT DEFAULT NULL,
  `approved_by` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Vehicle Bookings
CREATE TABLE IF NOT EXISTS `vehicle_bookings` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `applicant_name` VARCHAR(100) NOT NULL,
  `nip` VARCHAR(30) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `vehicle_id` VARCHAR(50) NOT NULL,
  `departure_date` DATE NOT NULL,
  `departure_time` TIME NOT NULL,
  `return_date` DATE NOT NULL,
  `return_time` TIME NOT NULL,
  `destination` VARCHAR(150) NOT NULL,
  `purpose` TEXT NOT NULL,
  `passengers` INT NOT NULL,
  `driver` VARCHAR(100) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('Menunggu', 'Disetujui', 'Ditolak', 'Selesai') DEFAULT 'Menunggu',
  `rejection_reason` TEXT DEFAULT NULL,
  `approved_by` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel Notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabel Token Konfirmasi Cepat (setujui/tolak langsung dari tautan WhatsApp, tanpa login)
CREATE TABLE IF NOT EXISTS `booking_confirm_tokens` (
  `token` VARCHAR(64) NOT NULL,
  `booking_type` ENUM('room', 'vehicle') NOT NULL,
  `booking_id` VARCHAR(50) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token`),
  KEY `idx_booking` (`booking_type`, `booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Rooms & Vehicles
INSERT INTO `rooms` (`id`, `room_name`, `capacity`, `location`, `facilities`, `status`) VALUES
('rm-1', 'Aula Utama Kanwil Kemenag Babel', 50, 'Gedung B', 'AC Central, Sound System Pro, Podium, Wireless Mic, Smart Projector Stage', 'Tersedia'),
('rm-2', 'Ruang Rapat Kanwil', 35, 'Gedung Utama Lantai 2', 'AC, Smart TV 75 Inch, Zoom Conference Cam, Whiteboard', 'Tersedia'),
('rm-3', 'Ruang Rapat Kepala Bagian Tata Usaha', 20, 'Gedung B Lantai 1', 'AC, Projector, Sound System, Wi-Fi', 'Tersedia');

INSERT INTO `vehicles` (`id`, `vehicle_type`, `brand`, `model`, `license_plate`, `year`, `condition`, `status`) VALUES
('vh-1', 'Mobil', 'Toyota', 'AVANZA 1.5 VELOZ M/T', 'BN 1108 Z', 2015, 'Sangat Baik', 'Tersedia');
