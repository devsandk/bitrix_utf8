<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

if($this->InitComponentTemplate())
	$template = &$this->GetTemplate();
else
	return;

if (
	!array_key_exists("ALIGN", $arParams) 
	|| strlen(trim($arParams["ALIGN"])) <= 0 
	|| !in_array($arParams["ALIGN"], array("left", "right"))
)
	$arParams["ALIGN"] = "left";

if(!class_exists('BookmarksCounter')){
	class BookmarksCounter {public static $counter = 1;}}

$arResult["COUNTER"] = BookmarksCounter::$counter++;

$arResult["FOLDER_PATH"] = $folderPath = $template->GetFolder();
$path2Handlers = $_SERVER["DOCUMENT_ROOT"].$folderPath."/handlers/";
CheckDirPath($path2Handlers);
				
$arHandlers = array();	
if ($handle = opendir($path2Handlers))
{
	while (($file = readdir($handle)) !== false)
	{
		if ($file == "." || $file == "..")
			continue;
		if (is_file($path2Handlers.$file) && strtoupper(substr($file, strlen($file)-4))==".PHP")
		{
			$name = $title = $icon_url_template = $charset = "";
			$sort = 0;
			$charsBack = false;

			include($path2Handlers.$file);
					
			if (strlen($name) > 0)
			{
				$arHandlers[$name] = array(
					"TITLE" => $title,
					"ICON" => $icon_url_template,
					"SORT" => intval($sort)	
				);
				if (strlen($charset) > 0)
					$arHandlers[$name]["CHARSET"] = $charset;
				if ($charsBack)
					$arHandlers[$name]["CHARSBACK"] = true;
					
			}
		}
	}
}

$arResult["HANDLERS_ALL"] = $arHandlers;
if(!is_array($arParams["HANDLERS"]))
{
	if (LANGUAGE_ID != 'ru')
	{
		unset($arHandlers["vk"]);
		unset($arHandlers["mailru"]);
	}
	$arParams["HANDLERS"] = array_keys($arHandlers);
}
	
$arResult["BOOKMARKS"] = array();

if (defined('SITE_SERVER_NAME') && strlen(SITE_SERVER_NAME) > 0)
	$SiteServerName = SITE_SERVER_NAME;
else
	$SiteServerName = COption::GetOptionString("main", "server_name", $GLOBALS["SERVER_NAME"]);

if (strlen($SiteServerName) > 0)
{
	$protocol = (CMain::IsHTTPS() ? "https" : "http");
	$arResult["PAGE_URL"] = $protocol."://".$SiteServerName.$arParams["PAGE_URL"];
}
else
	$arResult["PAGE_URL"] = "";	

$arResult["PAGE_TITLE"] = $arParams["PAGE_TITLE"];

foreach($arResult["HANDLERS_ALL"] as $name=>$arHandler)
{
	if (in_array($name, $arParams["HANDLERS"]))
	{
		$PageTitle = $arResult["PAGE_TITLE"];
		if (array_key_exists("CHARSBACK", $arHandler) && $arHandler["CHARSBACK"])
			$PageTitleBack = htmlspecialcharsback($PageTitle);

		$arHandler["ICON"] = str_replace("#PAGE_URL#", $arResult["PAGE_URL"], $arHandler["ICON"]);

		if (array_key_exists("CHARSBACK", $arHandler) && $arHandler["CHARSBACK"])
		{
			$arHandler["ICON"] = str_replace("#PAGE_TITLE#", CUtil::JSEscape($PageTitleBack), $arHandler["ICON"]);
			$arHandler["ICON"] = str_replace("#PAGE_TITLE_ORIG#", CUtil::addslashes($PageTitle), $arHandler["ICON"]);
		}
		else
			$arHandler["ICON"] = str_replace("#PAGE_TITLE#", CUtil::addslashes($PageTitle), $arHandler["ICON"]);
			
		$arResult["BOOKMARKS"][$name]["ICON"] = $arHandler["ICON"];
		$arResult["BOOKMARKS"][$name]["SORT"] = $arHandler["SORT"];
	}
}

if (!function_exists('__bookmark_sort'))
{
	function __bookmark_sort($a, $b)
	{
		if ($a['SORT'] == $b['SORT'])
			return 0;
		if ($a['SORT'] < $b['SORT'])
			return -1;
		return 1;
	}
}
usort($arResult["BOOKMARKS"], "__bookmark_sort");


CUtil::InitJSCore();
$this->IncludeComponentTemplate();
?>