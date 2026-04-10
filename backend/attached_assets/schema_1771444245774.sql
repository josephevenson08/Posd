SQLCREATE DATABASE IF NOT EXISTS doctor_patient_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE doctor_patient_db;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: doctor_patient_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `doctors`
--

DROP TABLE IF EXISTS `doctors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctors` (
  `doctor_ID` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(64) NOT NULL,
  `last_name` varchar(64) NOT NULL,
  `email` varchar(120) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `specialty` varchar(50) DEFAULT NULL,
  `license_number` varchar(30) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  PRIMARY KEY (`doctor_ID`),
  UNIQUE KEY `license_number` (`license_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `medical_records`
--

DROP TABLE IF EXISTS `medical_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_records` (
  `record_ID` int NOT NULL AUTO_INCREMENT,
  `patient_ID` int NOT NULL,
  `doctor_ID` int NOT NULL,
  `creation_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `visit_type` varchar(30) DEFAULT NULL,
  `diagnosis` text,
  `treatment_plan` text,
  `allergies` text,
  `vitals` text,
  `lab_results` text,
  `notes` text,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`record_ID`),
  KEY `patient_ID` (`patient_ID`),
  KEY `doctor_ID` (`doctor_ID`),
  CONSTRAINT `medical_records_ibfk_1` FOREIGN KEY (`patient_ID`) REFERENCES `patients` (`patient_ID`),
  CONSTRAINT `medical_records_ibfk_2` FOREIGN KEY (`doctor_ID`) REFERENCES `doctors` (`doctor_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `patient_ID` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(64) NOT NULL,
  `last_name` varchar(64) NOT NULL,
  `DOB` date NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `address` text,
  `emergency_name` varchar(64) DEFAULT NULL,
  `emergency_phone` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`patient_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `referrals`
--

DROP TABLE IF EXISTS `referrals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `referrals` (
  `referral_ID` int NOT NULL AUTO_INCREMENT,
  `patient_ID` int NOT NULL,
  `referring_doctor_ID` int NOT NULL,
  `referred_doctor_ID` int NOT NULL,
  `date_time` datetime NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `notes` text,
  PRIMARY KEY (`referral_ID`),
  KEY `patient_ID` (`patient_ID`),
  KEY `referring_doctor_ID` (`referring_doctor_ID`),
  KEY `referred_doctor_ID` (`referred_doctor_ID`),
  CONSTRAINT `referrals_ibfk_1` FOREIGN KEY (`patient_ID`) REFERENCES `patients` (`patient_ID`),
  CONSTRAINT `referrals_ibfk_2` FOREIGN KEY (`referring_doctor_ID`) REFERENCES `doctors` (`doctor_ID`),
  CONSTRAINT `referrals_ibfk_3` FOREIGN KEY (`referred_doctor_ID`) REFERENCES `doctors` (`doctor_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-04 17:44:30
