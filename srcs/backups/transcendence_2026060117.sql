/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.6-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: db    Database: transcendence
-- ------------------------------------------------------
-- Server version	10.11.18-MariaDB-ubu2204

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `friendships`
--

DROP TABLE IF EXISTS `friendships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `friendships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` enum('PENDING','ACCEPTED','BLOCKED') NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `requesterId` int(11) DEFAULT NULL,
  `addresseeId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_4f47ed519abe1ced044af260420` (`requesterId`),
  KEY `FK_c6ee540bba37d2b09b12dddd282` (`addresseeId`),
  CONSTRAINT `FK_4f47ed519abe1ced044af260420` FOREIGN KEY (`requesterId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_c6ee540bba37d2b09b12dddd282` FOREIGN KEY (`addresseeId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friendships`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `friendships` WRITE;
/*!40000 ALTER TABLE `friendships` DISABLE KEYS */;
INSERT INTO `friendships` VALUES
(2,'ACCEPTED','2026-05-29 10:30:44.187228','2026-05-29 10:30:45.000000',2,1),
(3,'ACCEPTED','2026-05-29 12:07:13.430699','2026-05-29 12:21:11.000000',3,1),
(4,'ACCEPTED','2026-05-29 12:07:15.070159','2026-05-29 12:08:18.000000',3,2);
/*!40000 ALTER TABLE `friendships` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `games` (
  `id` uuid NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `looser` int(11) NOT NULL DEFAULT -1,
  `whiteElo` int(11) NOT NULL DEFAULT 0,
  `blackElo` int(11) NOT NULL DEFAULT 0,
  `activeColor` varchar(255) NOT NULL DEFAULT 'white',
  `whiteTimeMs` bigint(20) NOT NULL DEFAULT 600000,
  `blackTimeMs` bigint(20) NOT NULL DEFAULT 600000,
  `lastMoveTimestamp` bigint(20) DEFAULT NULL,
  `whiteDraw` tinyint(4) NOT NULL DEFAULT 0,
  `blackDraw` tinyint(4) NOT NULL DEFAULT 0,
  `whiteId` int(11) DEFAULT NULL,
  `blackId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_cfc1c1e7bc27a1051f493af9204` (`whiteId`),
  KEY `FK_9e6dd26fb67fbecd8661032100e` (`blackId`),
  CONSTRAINT `FK_9e6dd26fb67fbecd8661032100e` FOREIGN KEY (`blackId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_cfc1c1e7bc27a1051f493af9204` FOREIGN KEY (`whiteId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `games`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `games` WRITE;
/*!40000 ALTER TABLE `games` DISABLE KEYS */;
INSERT INTO `games` VALUES
('83dff487-638c-4ed9-8afe-376ee7040960','ended','2026-05-29 12:34:18.825019','2026-05-29 12:35:37.000000',-1,1,15,'black',563915,566664,1780058128238,0,0,1,2),
('d5378f72-de2f-4980-96e0-451b70f4bb77','ended','2026-05-29 12:03:33.879276','2026-05-29 12:03:45.000000',-1,0,0,'white',595905,597594,1780056220362,0,0,1,2),
('d659a7e5-1c0e-4306-91e1-b6dc2db6f514','ended','2026-05-29 10:36:25.952245','2026-05-29 10:47:44.000000',-1,0,0,'white',600000,600000,1780050985948,0,0,1,2),
('31c3bbea-3c38-4e84-8da6-c753ac6b115d','ended','2026-05-29 12:07:47.851370','2026-05-29 12:08:01.000000',-1,0,0,'white',600000,600000,1780056467846,0,0,4,3),
('dbb5881f-4235-41f5-a401-c9a63f5b9fc4','ended','2026-05-29 12:08:06.288316','2026-05-29 12:15:07.000000',1,0,0,'white',554434,556917,1780056574934,0,0,1,4),
('8d1a1bcc-0434-49d6-84f9-eb4682fcf303','ended','2026-05-29 12:08:21.210305','2026-05-29 12:10:00.000000',3,0,0,'black',586843,557039,1780056557325,0,0,3,2),
('e482c50d-3b9a-498a-8bc3-fe0aeda7b12a','ended','2026-05-29 12:21:35.366352','2026-05-29 12:21:42.000000',-1,16,0,'white',600000,600000,1780057295357,0,0,2,1);
/*!40000 ALTER TABLE `games` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `isRead` tinyint(4) NOT NULL DEFAULT 0,
  `senderId` int(11) DEFAULT NULL,
  `recipientId` int(11) DEFAULT NULL,
  `gameId` uuid DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_2db9cf2b3ca111742793f6c37ce` (`senderId`),
  KEY `FK_f548818d46a1315d4e1d5e62da5` (`recipientId`),
  KEY `FK_017ef7956a9fa255a1692af62b2` (`gameId`),
  CONSTRAINT `FK_017ef7956a9fa255a1692af62b2` FOREIGN KEY (`gameId`) REFERENCES `games` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_2db9cf2b3ca111742793f6c37ce` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_f548818d46a1315d4e1d5e62da5` FOREIGN KEY (`recipientId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES
(1,'olaola','2026-05-29 10:37:11.412594',1,1,2,NULL),
(2,'oasosdf','2026-05-29 10:38:01.245082',1,1,2,NULL),
(3,'te quiero','2026-05-29 10:38:16.983250',1,2,1,NULL),
(4,'caç','2026-05-29 12:08:27.047614',1,3,2,NULL),
(5,'de q vas','2026-05-29 12:33:42.458206',0,2,1,NULL),
(6,'no me rayes manin','2026-05-29 12:33:47.141603',1,1,2,NULL),
(7,'que no me rayes','2026-05-29 12:33:54.325515',0,1,2,NULL),
(8,'me rayas mputa','2026-05-29 12:33:59.168217',0,2,1,NULL),
(9,'wen','2026-05-29 12:34:01.941701',0,1,2,NULL),
(10,'weno','2026-05-29 12:34:04.161624',0,1,2,NULL),
(11,'hi ba jodiu','2026-05-29 12:34:08.980576',0,1,2,NULL),
(12,'ezzeizehf','2026-05-29 12:34:11.939406',0,2,1,NULL);
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `moves`
--

DROP TABLE IF EXISTS `moves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `moves` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from` varchar(255) NOT NULL,
  `to` varchar(255) NOT NULL,
  `promotion` varchar(255) DEFAULT NULL,
  `san` varchar(255) NOT NULL,
  `fen` varchar(255) NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  `whiteTimeMs` bigint(20) NOT NULL,
  `blackTimeMs` bigint(20) NOT NULL,
  `gameId` uuid DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_56ec01a71f76da6fca3509439d6` (`gameId`),
  CONSTRAINT `FK_56ec01a71f76da6fca3509439d6` FOREIGN KEY (`gameId`) REFERENCES `games` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `moves`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `moves` WRITE;
/*!40000 ALTER TABLE `moves` DISABLE KEYS */;
INSERT INTO `moves` VALUES
(1,'','',NULL,'start','rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',600000,600000,'d659a7e5-1c0e-4306-91e1-b6dc2db6f514'),
(2,'','',NULL,'start','rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',600000,600000,'d5378f72-de2f-4980-96e0-451b70f4bb77'),
(3,'f2','f4',NULL,'f4','rnbqkbnr/pppppppp/8/8/5P2/8/PPPPP1PP/RNBQKBNR b KQkq - 0 1',595905,600000,'d5378f72-de2f-4980-96e0-451b70f4bb77'),
(4,'d7','d5',NULL,'d5','rnbqkbnr/ppp1pppp/8/3p4/5P2/8/PPPPP1PP/RNBQKBNR w KQkq - 0 2',595905,597594,'d5378f72-de2f-4980-96e0-451b70f4bb77'),
(5,'','',NULL,'start','rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',600000,600000,'31c3bbea-3c38-4e84-8da6-c753ac6b115d'),
(6,'','',NULL,'start','rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',600000,600000,'dbb5881f-4235-41f5-a401-c9a63f5b9fc4'),
(7,'','',NULL,'start','rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',600000,600000,'8d1a1bcc-0434-49d6-84f9-eb4682fcf303'),
(8,'e2','e4',NULL,'e4','rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',580831,600000,'dbb5881f-4235-41f5-a401-c9a63f5b9fc4'),
(9,'e2','e4',NULL,'e4','rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',589800,600000,'8d1a1bcc-0434-49d6-84f9-eb4682fcf303'),
(10,'d7','d5',NULL,'d5','rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',580831,593188,'dbb5881f-4235-41f5-a401-c9a63f5b9fc4'),
(11,'d1','g4',NULL,'Qg4','rnbqkbnr/ppp1pppp/8/3p4/4P1Q1/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2',575251,593188,'dbb5881f-4235-41f5-a401-c9a63f5b9fc4'),
(12,'c8','g4',NULL,'Bxg4','rn1qkbnr/ppp1pppp/8/3p4/4P1b1/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3',575251,572041,'dbb5881f-4235-41f5-a401-c9a63f5b9fc4'),
(13,'g1','f3',NULL,'Nf3','rn1qkbnr/ppp1pppp/8/3p4/4P1b1/5N2/PPPP1PPP/RNB1KB1R b KQkq - 1 3',567545,572041,'dbb5881f-4235-41f5-a401-c9a63f5b9fc4'),
(14,'d7','d5',NULL,'d5','rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',589800,557039,'8d1a1bcc-0434-49d6-84f9-eb4682fcf303'),
(15,'b8','c6',NULL,'Nc6','r2qkbnr/ppp1pppp/2n5/3p4/4P1b1/5N2/PPPP1PPP/RNB1KB1R w KQkq - 2 4',567545,562032,'dbb5881f-4235-41f5-a401-c9a63f5b9fc4'),
(16,'e4','d5',NULL,'exd5','rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2',586843,557039,'8d1a1bcc-0434-49d6-84f9-eb4682fcf303'),
(17,'f1','b5',NULL,'Bb5','r2qkbnr/ppp1pppp/2n5/1B1p4/4P1b1/5N2/PPPP1PPP/RNB1K2R b KQkq - 3 4',554434,562032,'dbb5881f-4235-41f5-a401-c9a63f5b9fc4'),
(18,'g8','f6',NULL,'Nf6','r2qkb1r/ppp1pppp/2n2n2/1B1p4/4P1b1/5N2/PPPP1PPP/RNB1K2R w KQkq - 4 5',554434,556917,'dbb5881f-4235-41f5-a401-c9a63f5b9fc4'),
(19,'','',NULL,'start','rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',600000,600000,'e482c50d-3b9a-498a-8bc3-fe0aeda7b12a'),
(20,'','',NULL,'start','rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',600000,600000,'83dff487-638c-4ed9-8afe-376ee7040960'),
(21,'e2','e4',NULL,'e4','rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',596306,600000,'83dff487-638c-4ed9-8afe-376ee7040960'),
(22,'d7','d5',NULL,'d5','rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',596306,597441,'83dff487-638c-4ed9-8afe-376ee7040960'),
(23,'e4','d5',NULL,'exd5','rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2',593819,597441,'83dff487-638c-4ed9-8afe-376ee7040960'),
(24,'d8','d5',NULL,'Qxd5','rnb1kbnr/ppp1pppp/8/3q4/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3',593819,593705,'83dff487-638c-4ed9-8afe-376ee7040960'),
(25,'f1','c4',NULL,'Bc4','rnb1kbnr/ppp1pppp/8/3q4/2B5/8/PPPP1PPP/RNBQK1NR b KQkq - 1 3',588946,593705,'83dff487-638c-4ed9-8afe-376ee7040960'),
(26,'d5','c4',NULL,'Qxc4','rnb1kbnr/ppp1pppp/8/8/2q5/8/PPPP1PPP/RNBQK1NR w KQkq - 0 4',588946,591606,'83dff487-638c-4ed9-8afe-376ee7040960'),
(27,'d2','d3',NULL,'d3','rnb1kbnr/ppp1pppp/8/8/2q5/3P4/PPP2PPP/RNBQK1NR b KQkq - 0 4',582155,591606,'83dff487-638c-4ed9-8afe-376ee7040960'),
(28,'c4','d3',NULL,'Qxd3','rnb1kbnr/ppp1pppp/8/8/8/3q4/PPP2PPP/RNBQK1NR w KQkq - 0 5',582155,589295,'83dff487-638c-4ed9-8afe-376ee7040960'),
(29,'d1','e2',NULL,'Qe2','rnb1kbnr/ppp1pppp/8/8/8/3q4/PPP1QPPP/RNB1K1NR b KQkq - 1 5',569364,589295,'83dff487-638c-4ed9-8afe-376ee7040960'),
(30,'c8','g4',NULL,'Bg4','rn2kbnr/ppp1pppp/8/8/6b1/3q4/PPP1QPPP/RNB1K1NR w KQkq - 2 6',569364,573384,'83dff487-638c-4ed9-8afe-376ee7040960'),
(31,'e2','d3',NULL,'Qxd3','rn2kbnr/ppp1pppp/8/8/6b1/3Q4/PPP2PPP/RNB1K1NR b KQkq - 0 6',566566,573384,'83dff487-638c-4ed9-8afe-376ee7040960'),
(32,'g4','d1',NULL,'Bd1','rn2kbnr/ppp1pppp/8/8/8/3Q4/PPP2PPP/RNBbK1NR w KQkq - 1 7',566566,566664,'83dff487-638c-4ed9-8afe-376ee7040960'),
(33,'e1','d1',NULL,'Kxd1','rn2kbnr/ppp1pppp/8/8/8/3Q4/PPP2PPP/RNBK2NR b kq - 0 7',563915,566664,'83dff487-638c-4ed9-8afe-376ee7040960');
/*!40000 ALTER TABLE `moves` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `usernameNormalized` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `avatarUrl` varchar(255) DEFAULT NULL,
  `elo` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  UNIQUE KEY `IDX_5c7c61be9c60ae1e7d0b13e1b2` (`usernameNormalized`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'markel','markel','$2b$10$Tnto97IZ2oncDBkwBDAcTe0VlGGdKrZG5PhBu7RHOgqGLJYL/XpQm','a@aa.com','/uploads/avatars/1780325442402-528466015.jpg',2),
(2,'mark','mark','$2b$10$GlHFuRJ2M0VQ1Whs5114neyZ4St1RMq3ZNcGATmZNtXOtgwE5XqsS','a@a.com','/resources/default.webp',14),
(3,'Ibon','ibon','$2b$10$qfmwW1MAi3abpJJ2pn1fmuMpp0WVVs73RiWRrPGYHX4CKuv/HC.uS','dacsd@gmail.com','/uploads/avatars/1780056454486-301868728.jpg',0),
(4,'kabasolo','kabasolo','$2b$10$Dt238kJ9NwdpOZ8Gk1nH0.8ADM40lTrYQ4IjOkwX1bGHtUfvkkfFi','koldobikaabasolo@gmail.com','/resources/default.webp',16);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-06-01 17:12:38
