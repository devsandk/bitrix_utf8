CREATE TABLE `b_report` (
  `ID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `OWNER_ID` varchar(20) NOT NULL,
  `TITLE` varchar(255) NOT NULL,
  `DESCRIPTION` text NOT NULL,
  `CREATED_DATE` datetime NOT NULL,
  `CREATED_BY` int(11) unsigned NOT NULL,
  `SETTINGS` text NOT NULL,
  `MARK_DEFAULT` smallint unsigned NULL,
  PRIMARY KEY (`ID`),
  KEY `OWNER_ID` (`OWNER_ID`)
);