<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");
$APPLICATION->SetPageProperty("title", "Автоматизация торгового зала|POS-терминалы|Торговое оборудование");
$APPLICATION->SetTitle("Торговое оборудование");
?> 
<div class="slider"> 	 
  <div class="camera_wrap">	 	 
    <div data-src="/images/torgovoe_oborudovanie_1.jpg"><div class="camera_caption"><a href="http://entask.ru/catalog/kompyutery_pos_i_komplektuyushchie/" ></a></div></div>
   
    <div data-src="/images/torgovoe_oborudovanie_2.jpg"><div class="camera_caption"><a href="http://entask.ru/catalog/schetchiki_posetiteley/" ></a></div></div>
   
    <div data-src="/images/torgovoe_oborudovanie_3.jpg"><div class="camera_caption"><a href="http://entask.ru/catalog/skanery_shk/" ></a></div></div>
   	 </div>
 	</div>
 
<br />
 
<br />
 
<br />
 
<br />
 <?$APPLICATION->IncludeComponent(
	"bitrix:catalog.section.list", 
	"template4", 
	array(
		"VIEW_MODE" => "TILE",
		"SHOW_PARENT_NAME" => "N",
		"HIDE_SECTION_NAME" => "N",
		"IBLOCK_TYPE" => "1c_catalog",
		"IBLOCK_ID" => "26",
		"SECTION_ID" => "",
		"SECTION_CODE" => "torgovoe_oborudovanie",
		"SECTION_URL" => "#SITE_DIR#catalog/#CODE#/",
		"COUNT_ELEMENTS" => "N",
		"TOP_DEPTH" => "2",
		"SECTION_FIELDS" => array(
			0 => "",
			1 => "",
		),
		"SECTION_USER_FIELDS" => array(
			0 => "",
			1 => "",
		),
		"ADD_SECTIONS_CHAIN" => "Y",
		"CACHE_TYPE" => "A",
		"CACHE_TIME" => "36000000",
		"CACHE_GROUPS" => "N"
	),
	false
);?><?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");?>