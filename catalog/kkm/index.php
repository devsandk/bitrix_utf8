<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");
$APPLICATION->SetPageProperty("description", "Энтаск предлагат линейку кассовых аппаратов для автоматизации торгового зала.Регистрация торгового оборудованиея в налоговой");
$APPLICATION->SetPageProperty("title", "ККМ|Обслуживание ККМ|Выбрать кассовый аппарат|Постановка на учет в налоговой инспекции");
$APPLICATION->SetTitle("ККМ");
?> 
<div class="slider"> 	 
  <div class="camera_wrap">	 	 
    <div data-src="/images/kkm_1.jpg">
<div class="camera_caption"><a href="http://entask.ru/catalog/avtonomnye_kkm/" ></a></div>
</div>
   
    <div data-src="/images/kkm_2.jpg">
<div class="camera_caption"><a href="http://entask.ru/catalog/fiskalnye_registratory/" ></a></div>
</div>
   
    <div data-src="/images/kkm_3.jpg">
<div class="camera_caption"><a href="http://entask.ru/catalog/chekovye_printery/" >/</a></div>
</div>
   	 </div>
 
  <br />
 
  <br />
 
  <br />
 
  <br />
 <?$APPLICATION->IncludeComponent(
	"bitrix:catalog.section.list", 
	"template3", 
	array(
		"VIEW_MODE" => "TILE",
		"SHOW_PARENT_NAME" => "N",
		"HIDE_SECTION_NAME" => "N",
		"IBLOCK_TYPE" => "1c_catalog",
		"IBLOCK_ID" => "26",
		"SECTION_ID" => "",
		"SECTION_CODE" => "kkm",
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
);?></div>
 <?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");?>