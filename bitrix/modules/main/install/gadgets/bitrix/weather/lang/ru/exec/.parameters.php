<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

$defCity = "c213"; //Moscow

$ob = new CHTTP();
$ob->http_timeout = 10;
$ob->Query(
	"GET",
	"export.yandex.ru",
	80,
	"/bar/reginfo.xml?".$url,
	false,
	"",
	"N"
);
if($ob->result)
{
	$res = str_replace("\xE2\x88\x92", "-", $ob->result);
	$xml = new CDataXML();
	$xml->LoadString($GLOBALS["APPLICATION"]->ConvertCharset($res, 'UTF-8', SITE_CHARSET));
	$node = $xml->SelectNodes('/info/region');
	if(is_object($node))
	{
		$attrId = $node->getAttribute("id");
		if($attrId > 0)
			$defCity = "c".$attrId;
	}
}

include(dirname(__FILE__).'/city.php');

asort($arCity);

$arParameters = Array(
	"PARAMETERS"=> Array(
		"CACHE_TIME" => array(
			"NAME" => "Время кеширования, сек (0-не кешировать)",
			"TYPE" => "STRING",
			"DEFAULT" => "3600"
			),
		"SHOW_URL" => Array(
				"NAME" => "Показывать ссылку на подробную информацию",
				"TYPE" => "CHECKBOX",
				"MULTIPLE" => "N",
				"DEFAULT" => "N",
			),
	),
	"USER_PARAMETERS"=> Array(
		"CITY"=>Array(
			"NAME" => "Город",
			"TYPE" => "LIST",
			"MULTIPLE" => "N",
			"DEFAULT" => $defCity,
			"VALUES"=>$arCity,
		),
	),
);
