CREATE TABLE slv.`msic` (
  `MSIC` varchar(10) DEFAULT NULL,
  `description_malay_detail` varchar(255) DEFAULT NULL,
  `section` varchar(10) DEFAULT NULL,
  `division` varchar(10) DEFAULT NULL,
  `group` varchar(10) DEFAULT NULL,
  `Class` varchar(10) DEFAULT NULL,
  `description_english_section` varchar(255) DEFAULT NULL,
  `description_malay_section` varchar(255) DEFAULT NULL,
  `description_english_division` varchar(255) DEFAULT NULL,
  `description_malay_division` varchar(255) DEFAULT NULL,
  `description_english_group` varchar(255) DEFAULT NULL,
  `description_malay_group` varchar(255) DEFAULT NULL,
  `description_english_class` varchar(255) DEFAULT NULL,
  `description_malay_class` varchar(255) DEFAULT NULL,
  `sector` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
