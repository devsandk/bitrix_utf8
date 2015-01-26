<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");
$APPLICATION->SetPageProperty("tags", "ККМ, контрольно-кассовые машина, штрих-кодовое оборудование, терминалы сбора данных, детекторы валют, счетчики банкнот, услуги ЦТО, автоматизациия торговых предприятий");
$APPLICATION->SetPageProperty("title", "Продажа программного обеспечения|Обслуживание ККМ|Выбрать кассовый аппарат|");
$APPLICATION->SetTitle("Програмное обеспечение");
?> 
<div class="slider"> 	 
  <div class="camera_wrap">	 	 
    <div data-src="/images/programnoe_obespechenie_1.jpg"><div class="camera_caption"><a href="http://entask.ru/catalog/atol/" ></a></div></div>
   
    <div data-src="/images/programnoe_obespechenie_2.jpg"><div class="camera_caption"><a href="http://entask.ru/catalog/versiya/" ></a></div></div>
   
    <div data-src="/images/programnoe_obespechenie_3.jpg"><div class="camera_caption"><a href="http://entask.ru/catalog/1s/" ></a></div></div>
   	 </div>
 	</div>
 
<br />
 
<br />
 
<br />
 
<br />
 <?$APPLICATION->IncludeComponent(
	"bitrix:catalog.section.list", 
	"template2", 
	array(
		"VIEW_MODE" => "TILE",
		"SHOW_PARENT_NAME" => "N",
		"HIDE_SECTION_NAME" => "N",
		"IBLOCK_TYPE" => "1c_catalog",
		"IBLOCK_ID" => "26",
		"SECTION_ID" => "",
		"SECTION_CODE" => "programmnoe_obespechenie",
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
);?> 
<br />
 
<p class="MsoNormal" style="text-align: justify; text-indent: 23.4pt;"><font color="#004A80">Согласно части 4 Гражданского кодекса РФ, а также пп26, п.2 ст.149 Налогового кодекса РФ каждый программный продукт (программа), правообладателем которого является ООО &laquo;Версия-Т&raquo; будет поставляться в виде <b>установочного комплекта</b> (материальный носитель, описание, коробка, ключ защиты), облагаемого НДС, и <b>простой (неисключительной) лицензии</b> (заключение лицензионного договора), необлагаемого НДС. Стоимость продукта складывается из стоимостей двух упомянутых частей. Таким образом на любое ПО &quot;Версия-Т&quot; выставляется 2 счета: один с НДС, другой - без. Будьте внимательны при выборе соответствующего продукта в каталоге и при оплате счетов! 
    <br />
   </font> </p>
 <font color="#004A80"> </font> 
<br />
 <?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");?>