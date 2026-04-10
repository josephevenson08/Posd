-- Portable database dump generated from local app database
CREATE DATABASE IF NOT EXISTS doctor_patient_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE doctor_patient_db;
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS users;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `password` text NOT NULL,
  `first_name` varchar(64) NOT NULL,
  `last_name` varchar(64) NOT NULL,
  `email` varchar(120) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `specialty` varchar(50) DEFAULT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'doctor',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO users (id, username, password, first_name, last_name, email, phone, specialty, role) VALUES
(1, 'jevenson3', 'scrypt$1315747419ebb94686573ba2afaa64e8$1888ef159e7a0a9ea003ff3dd1b7f9d46d6fc03a544852695f458c98de0569942974ec787a5560dc35def6b150cc7255e58343a8554a4b530c3eaf50231f8337', 'Joseph', 'Evenson', 'josephevenson37@gmail.com', '(417) 483-9285', 'neurology', 'doctor'),
(2, 'jevenson2', 'Jay18hawk', 'Joseph', 'Evenson', 'josephevenson37@gmail.com', '(417) 483-9285', 'anesthesiology', 'doctor'),
(3, 'jdoe123', 'Jay18hawk', 'Jeffrey', 'Doe', 'jeffdoe@gmail.com', '(123) 123-5456', 'allergy-immunology', 'doctor'),
(4, 'newuser123', 'newuser123!', 'new', 'user', 'newuser@gmail.com', '(123) 123-1231', 'cardiothoracic-surgery', 'doctor'),
(5, 'jevenson4', 'scrypt$d12223e89b8332a3d01e7eb4a597d5f9$f0b4b97911a6a34ebfdcf6930cd117cfc884a20487c293d54faea66e9dfb6222b414324d7908d78e7dbef6e7af32828d86430972055dde7c3b2502cde2dec7f2', 'jeffrey', 'Evenson', 'jevenson@yahoo.com', '(123) 125-4153', 'allergy-immunology', 'doctor'),
(6, 'adminrole', 'scrypt$f0ed23580b49de3822247cd8fdbf9819$5b19eae8b1970df360a5fd0f42838b629368dc6e1d6c0f04a75ebd20eefb75880a97f47a98e637325a6731f71d3d0d566075ba80733fc3fd1e252585bbb265c2', 'Admin', 'Role', 'adminrole@local.test', NULL, 'administration', 'admin'),
(7, 'jevenson9', 'scrypt$2c79001d0a391c685864ffbe44bfdb19$2a95832506fdb3dae08032c11f137afa2adb36f3e9e4d2f58e29bee216bd40cfa19c5ce94f8baddf9eeb10711f8a3802b85ee97848645aa059ef8ba482b34db6', 'Joseph', 'Evenson', 'josephevenson@gmail.com', '(813) 182-3712', 'dermatology', 'doctor'),
(8, 'jevenson30', 'scrypt$fe0225d88bd4871a92722297c401e155$c15dbff0c232639fd5419ead2d9dccf51873101aecad5a3424d6ed33ea78348ae5e23c45ba63e9223892b0a59f754573a0ded41ff74ea41c4b3d9101244339d2', 'John', 'Evenson', 'josephevenson37@yahoo.com', '(417) 483-9285', 'colorectal-surgery', 'doctor');

DROP TABLE IF EXISTS patients;
CREATE TABLE `patients` (
  `patient_ID` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(64) NOT NULL,
  `last_name` varchar(64) NOT NULL,
  `dob` date NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `emergency_name` varchar(64) DEFAULT NULL,
  `emergency_phone` varchar(15) DEFAULT NULL,
  `street` varchar(100) DEFAULT NULL,
  `city` varchar(64) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`patient_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO patients (patient_ID, first_name, last_name, dob, gender, email, phone, emergency_name, emergency_phone, street, city, state, zip) VALUES
(1, 'asdfsadf', 'asdfasdf', '2002-08-13 05:00:00', 'Male', '123123@gmail.com', '(132) 412-3123', 'asddasdas', '(123) 112-3123', NULL, NULL, NULL, NULL);

DROP TABLE IF EXISTS medical_records;
CREATE TABLE `medical_records` (
  `record_ID` int NOT NULL AUTO_INCREMENT,
  `patient_ID` int NOT NULL,
  `doctor_ID` int NOT NULL,
  `creation_date` datetime DEFAULT '2026-03-23 17:13:34',
  `visit_type` text,
  `diagnosis` text,
  `treatment_plan` text,
  `allergies` text,
  `vitals` text,
  `lab_results` text,
  `notes` text,
  `updated_at` datetime DEFAULT '2026-03-23 17:13:34',
  PRIMARY KEY (`record_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO medical_records (record_ID, patient_ID, doctor_ID, creation_date, visit_type, diagnosis, treatment_plan, allergies, vitals, lab_results, notes, updated_at) VALUES
(1, 1, 3, '2026-02-23 17:57:48', 'Check-Up', 'cold', 'blah blah blah', 'xxxxxxxxxxxxxx', 'xxxxxxxxxxxxxx', '', 'xxxxxxxxxxxxxxxxxxxxxxxxxx', '2026-02-23 17:57:48');

DROP TABLE IF EXISTS referrals;
CREATE TABLE `referrals` (
  `referral_ID` int NOT NULL AUTO_INCREMENT,
  `patient_ID` int NOT NULL,
  `referring_doctor_ID` int NOT NULL,
  `referred_doctor_ID` int NOT NULL,
  `date_time` datetime NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `notes` text,
  PRIMARY KEY (`referral_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO referrals (referral_ID, patient_ID, referring_doctor_ID, referred_doctor_ID, date_time, status, notes) VALUES
(1, 1, 3, 2, '2026-02-24 05:55:00', 'completed', 'check-up'),
(2, 1, 2, 3, '2026-02-24 05:57:00', 'completed', 'Referral for cold - Check-Up');

DROP TABLE IF EXISTS audit_logs;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(64) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `details` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `timestamp` datetime DEFAULT '2026-03-23 17:13:34',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO audit_logs (id, username, action, details, ip_address, timestamp) VALUES
(1, 'jevenson2', 'LOGIN_FAILED', 'Failed login attempt for username: jevenson2', '::1', '2026-02-23 17:28:25'),
(2, 'jevenson2', 'LOGIN', 'Joseph Evenson logged in successfully', '::1', '2026-02-23 17:28:29'),
(3, 'jdoe123', 'REGISTER', 'New account created for Jeffrey Doe', '::1', '2026-02-23 17:51:35'),
(4, 'jdoe123', 'LOGIN', 'Jeffrey Doe logged in successfully', '::1', '2026-02-23 17:51:45'),
(5, 'jevenson2', 'LOGIN', 'Joseph Evenson logged in successfully', '::1', '2026-02-23 17:56:17'),
(6, 'jdoe123', 'LOGIN', 'Jeffrey Doe logged in successfully', '::1', '2026-02-23 17:58:16'),
(7, 'newuser123', 'LOGIN_FAILED', 'Failed login attempt for username: newuser123', '::1', '2026-03-03 00:07:28'),
(8, 'newuser123', 'REGISTER', 'New account created for new user', '::1', '2026-03-03 00:07:28'),
(9, 'newuser123', 'LOGIN', 'new user logged in successfully', '::1', '2026-03-03 00:07:28'),
(10, 'jevenson3', 'LOGIN', 'Joseph Evenson logged in successfully', '::1', '2026-03-03 00:07:28'),
(11, 'jevenson4', 'REGISTER', 'New account created for jeffrey Evenson', '::1', '2026-03-03 00:07:28'),
(12, 'jevenson4', 'LOGIN', 'jeffrey Evenson logged in successfully', '::1', '2026-03-03 00:07:28'),
(13, 'jevenson4', 'PASSWORD_UPDATED', 'jeffrey Evenson updated their password', '::1', '2026-03-03 00:07:28'),
(14, 'jevenson4', 'LOGIN', 'jeffrey Evenson logged in successfully', '::1', '2026-03-03 00:07:28'),
(15, 'jevenson4', 'PROFILE_UPDATED', 'jeffrey Evenson updated account settings', '::1', '2026-03-03 00:07:28'),
(16, 'adminrole', 'LOGIN_FAILED', 'Failed login attempt for username: adminrole', '::1', '2026-03-23 22:13:34'),
(17, 'adminrole', 'LOGIN_FAILED', 'Failed login attempt for username: adminrole', '::1', '2026-03-23 22:13:34'),
(18, 'adminrole', 'LOGIN_FAILED', 'Failed login attempt for username: adminrole', '::1', '2026-03-23 22:13:34'),
(19, 'adminrole', 'LOGIN', 'Admin Role logged in successfully', '::1', '2026-03-23 22:13:34'),
(20, 'adminrole', 'LOGIN_FAILED', 'Failed login attempt for username: adminrole', '::1', '2026-03-23 22:13:34'),
(21, 'adminrole', 'LOGIN', 'Admin Role logged in successfully', '::1', '2026-03-23 22:13:34'),
(22, 'jevenson9', 'REGISTER', 'New account created for Joseph Evenson', '::1', '2026-03-23 22:13:34'),
(23, 'jevenson9', 'LOGIN', 'Joseph Evenson logged in successfully', '::1', '2026-03-23 22:13:34'),
(24, 'jevenson3', 'LOGIN_OTP_SENT', 'Joseph Evenson submitted correct password, OTP sent', '::1', '2026-03-23 22:13:34'),
(25, 'jevenson3', 'LOGIN_OTP_SENT', 'Joseph Evenson submitted correct password, OTP sent', '::1', '2026-03-23 22:13:34'),
(26, 'jevenson3', 'LOGIN', 'Joseph Evenson logged in successfully', '::1', '2026-03-23 22:13:34'),
(27, 'jevenson3', 'LOGOUT', 'jevenson3 logged out', '::1', '2026-03-23 22:13:34'),
(28, 'jevenson3', 'LOGIN_OTP_SENT', 'Joseph Evenson submitted correct password, OTP sent', '::1', '2026-03-23 22:13:34'),
(29, 'jevenson08', 'LOGIN_FAILED', 'Failed login attempt for username: jevenson08', '::1', '2026-03-23 22:13:34'),
(30, 'jevenson08', 'LOGIN_FAILED', 'Failed login attempt for username: jevenson08', '::1', '2026-03-23 22:13:34'),
(31, 'jevenson30', 'REGISTER', 'New account created for John Evenson', '::1', '2026-03-23 22:13:34'),
(32, 'jevenson30', 'LOGIN_OTP_SENT', 'John Evenson submitted correct password, OTP sent', '::1', '2026-03-23 22:13:34');

SET FOREIGN_KEY_CHECKS=1;