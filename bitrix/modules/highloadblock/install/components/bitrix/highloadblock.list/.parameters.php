<?php if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

$arComponentParameters = array(
	"GROUPS" => array(
	),
	"PARAMETERS" => array(
		"BLOCK_ID" => array(
			"PARENT" => "BASE",
			"NAME" => GetMessage('HLLIST_COMPONENT_BLOCK_ID_PARAM'),
			"TYPE" => "TEXT"
		),
		"DETAIL_URL" => array(
			"PARENT" => "BASE",
			"NAME" => GetMessage('HLLIST_COMPONENT_DETAIL_URL_PARAM'),
			"TYPE" => "TEXT"
		),
	),
);