<?
IncludeModuleLangFile(__FILE__);

if ($USER->isAdmin())
{
	$aMenu = array(
		"parent_menu" => "global_menu_services",
		"section" => "mobileapp",
		"sort" => 1850,
		"text" => GetMessage("MOBILE_APP"),
		"title" => GetMessage("MOBILE_APP"),
		"icon" => "mobile_menu_icon",
		"page_icon" => "mobile_menu_icon",
		"items_id" => "menu_mobileapp",
		"items" => array(
			array(
				"text" => GetMessage("MOBILE_DESIGNER"),
				"url" => "mobile_designer.php?lang=" . LANGUAGE_ID,
				"more_url" => Array("mobile_designer.php"),
				"title" => GetMessage("MOBILE_DESIGNER"),
			),
		),
	);
	return $aMenu;
}

return false;
