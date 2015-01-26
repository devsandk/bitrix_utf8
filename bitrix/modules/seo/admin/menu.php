<?
if($APPLICATION->GetGroupRight("seo") > "D")
{
	if(\Bitrix\Main\ModuleManager::isModuleInstalled('seo'))
	{
		IncludeModuleLangFile(__FILE__);

		$aMenu = array(
			"parent_menu" => "global_menu_services",
			"section" => "seo",
			"sort" => 80,
			"text" => GetMessage("SEO_MENU_MAIN"),
			"title" => GetMessage("SEO_MENU_MAIN_TITLE"),
			"icon" => "seo_menu_icon",
			"page_icon" => "seo_page_icon",
			"module_id" => "seo",
			"items_id" => "menu_seo",
			"items" => array(),
		);

		$arEngineList = array();
		if (COption::GetOptionString('main', 'vendor', '') == '1c_bitrix')
		{
			$arEngineList[] = array(
				'url' => 'seo_search_yandex.php?lang='.LANGUAGE_ID,
				'more_url' => array('seo_search_yandex_detail.php?lang='.LANGUAGE_ID),
				'text' => GetMessage("SEO_MENU_YANDEX"),
			);
		}

		$arEngineList[] = array(
			'url' => 'seo_search_google.php?lang='.LANGUAGE_ID,
			'more_url' => array('seo_search_google_detail.php?lang='.LANGUAGE_ID),
			'text' => GetMessage("SEO_MENU_GOOGLE"),
		);

		if(count($arEngineList) > 0)
		{
			$aMenu["items"][] = array(
				"text" => GetMessage("SEO_MENU_SEARCH_ENGINES"),
				"title" => GetMessage("SEO_MENU_SEARCH_ENGINES_ALT"),
				"items_id" => "seo_search_engine",
				"items" => $arEngineList
			);
		}

		$aMenu['items'][] = array(
			"url" => "seo_robots.php?lang=".LANGUAGE_ID,
			"text" => GetMessage("SEO_MENU_ROBOTS_ALT"),
			//"title" => GetMessage("SEO_MENU_ROBOTS_ALT"),
		);
		$aMenu['items'][] = array(
			"url" => "seo_sitemap.php?lang=".LANGUAGE_ID,
			"more_url" => array("seo_sitemap_edit.php?lang=".LANGUAGE_ID),
			"text" => GetMessage("SEO_MENU_SITEMAP_ALT"),
			//"title" => GetMessage("SEO_MENU_SITEMAP_ALT"),
		);

		return $aMenu;
	}
}
return false;
?>
