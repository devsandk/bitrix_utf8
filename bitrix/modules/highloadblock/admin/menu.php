<?php

IncludeModuleLangFile(__FILE__);

if ($USER->IsAdmin())
{
	if(!CModule::IncludeModule('highloadblock'))
	{
		return false;
	}

	$items = array();

	$r = \Bitrix\Highloadblock\HighloadBlockTable::getList(array('order' => array('NAME')));
	while ($row = $r->fetch())
	{
		$items[] = array(
			"text" => $row['NAME'],
			"url" => "highloadblock_rows_list.php?ENTITY_ID=".$row['ID']."&lang=".LANG,
			"module_id" => "highloadblock",
			"more_url" => Array(
				"highloadblock_row_edit.php?ENTITY_ID=".$row['ID']."&lang=".LANG,
				"highloadblock_entity_edit.php?ID=".$row['ID']."&lang".LANG
			),
		);

	}

	return array(
		"parent_menu" => "global_menu_content",
		"section" => "highloadblock",
		"sort" => 350,
		"text" => GetMessage('HLBLOCK_ADMIN_MENU_TITLE'),
		"url" => "highloadblock_index.php?lang=".LANGUAGE_ID,
		"icon" => "highloadblock_menu_icon",
		"page_icon" => "highloadblock_page_icon",
		"more_url" => array(
			"highloadblock_entity_edit.php",
			"highloadblock_rows_list.php",
			"highloadblock_row_edit.php"
		),
		"items_id" => "menu_highloadblock",
		"items" => $items
	);
}
else
{
	return false;
}
