create table if not exists b_seo_keywords
(
	ID int(11) not null auto_increment,
	SITE_ID CHAR(2) not null,
	URL varchar(255),
	KEYWORDS text null,
	PRIMARY KEY (ID),
	INDEX ix_b_seo_keywords_url (URL, SITE_ID)
);

create table if not exists b_seo_search_engine
(
	ID int(11) NOT NULL auto_increment,
	CODE varchar(50) NOT NULL,
	ACTIVE char(1) NULL default 'Y',
	SORT int(5) NULL default 100,
	NAME varchar(255) NOT NULL,
	CLIENT_ID varchar(255) NULL,
	CLIENT_SECRET varchar(255) NULL,
	REDIRECT_URI varchar(255) NULL,
	SETTINGS text NULL,
	PRIMARY KEY (ID),
	UNIQUE INDEX ux_b_seo_search_engine_code (CODE)
);

INSERT INTO b_seo_search_engine (CODE, ACTIVE, SORT, NAME, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI) VALUES ('google', 'Y', 200, 'Google', '950140266760.apps.googleusercontent.com', 'IBktWJ_dS3rMKh43PSHO-zo5', 'urn:ietf:wg:oauth:2.0:oob');
INSERT INTO b_seo_search_engine (CODE, ACTIVE, SORT, NAME, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI) VALUES ('yandex', 'Y', 300, 'Yandex', 'f848c7bfc1d34a94ba6d05439f81bbd7', 'da0e73b2d9cc4e809f3170e49cb9df01', 'https://oauth.yandex.ru/verification_code');

create table if not exists b_seo_sitemap
(
	ID int(11) NOT NULL auto_increment,
	TIMESTAMP_X timestamp,
	SITE_ID char(2) NOT NULL,
	ACTIVE char(1) NULL default 'Y',
	NAME varchar(255) NULL default '',
	DATE_RUN datetime NULL default NULL,
	SETTINGS longtext NULL,
	PRIMARY KEY (ID)
);

create table if not exists b_seo_sitemap_runtime
(
	ID int(11) NOT NULL auto_increment,
	PID int (11) NOT NULL,
	PROCESSED char(1) NOT NULL DEFAULT 'N',
	ITEM_PATH varchar(700) NULL,
	ITEM_ID int(11) NULL,
	ITEM_TYPE char(1) NOT NULL DEFAULT 'D',
	ACTIVE char(1) NULL DEFAULT 'Y',
	ACTIVE_ELEMENT char(1) NULL DEFAULT 'Y',
	PRIMARY KEY (ID),
	INDEX ix_seo_sitemap_runtime1 (PID, PROCESSED, ITEM_TYPE, ITEM_ID)
);

CREATE TABLE if not exists b_seo_sitemap_iblock
(
	ID int(11) NOT NULL auto_increment,
	IBLOCK_ID int(11) NOT NULL,
	SITEMAP_ID int(11) NOT NULL,
	PRIMARY KEY (ID),
	INDEX ix_b_seo_sitemap_iblock_1 (IBLOCK_ID),
	INDEX ix_b_seo_sitemap_iblock_2 (SITEMAP_ID)
);

CREATE TABLE if not exists b_seo_sitemap_entity
(
	ID int(11) NOT NULL auto_increment,
	ENTITY_TYPE varchar(255) NOT NULL,
	ENTITY_ID int(11) NOT NULL,
	SITEMAP_ID int(11) NOT NULL,
	PRIMARY KEY (ID),
	INDEX ix_b_seo_sitemap_entity_1 (ENTITY_TYPE, ENTITY_ID),
	INDEX ix_b_seo_sitemap_entity_2 (SITEMAP_ID)
);
