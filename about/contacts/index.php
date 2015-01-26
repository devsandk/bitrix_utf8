<?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");
$APPLICATION->SetPageProperty("title", "ЭНТАСК:схема проезда, задайте вопрос");
$APPLICATION->SetTitle("ЭНТАСК:схема проезда");
?> 
<div class="bx_page"> 	 
  <div class="bx_page"> 
    <h2>ЗАДАТЬ ВОПРОС</h2>
   </div>
 
  <p><?$APPLICATION->IncludeComponent(
	"bitrix:main.feedback",
	"eshop_adapt",
	Array(
		"USE_CAPTCHA" => "Y",
		"OK_TEXT" => "Спасибо, ваше сообщение принято.",
		"EMAIL_TO" => "info@entask.ru",
		"REQUIRED_FIELDS" => array(),
		"EVENT_MESSAGE_ID" => array()
	)
);?></p>
 
  <p><font size="4"><b>Телефон:</b> +7(495)788-93-05</font></p>
 
  <p><font size="4"><font size="4">                  +7(495)788-09-56 
        <br />
       </font></font></p>
 
  <p><font size="4"><font size="4">                  +7(495)788-93-12</font></font></p>
 
  <p><font size="4"><font size="4"><b>Адрес электронной почты</b>: info@entask.ru 
        <br />
       </font></font></p>
 
  <p><font size="4"> 	<b>Адрес:</b> г. Москва, Анненский пр-д, д.1</font></p>
 	<?$APPLICATION->IncludeComponent("bitrix:map.google.view", ".default", array(
	"INIT_MAP_TYPE" => "ROADMAP",
	"MAP_DATA" => "a:4:{s:10:\"google_lat\";d:55.799353357107;s:10:\"google_lon\";d:37.5946;s:12:\"google_scale\";i:13;s:10:\"PLACEMARKS\";a:1:{i:0;a:3:{s:4:\"TEXT\";s:41:\"ООО \"ЭНТАСК\"###RN###Анненский проезд, д.1\";s:3:\"LON\";d:37.6076602935791;s:3:\"LAT\";d:55.8020890232665;}}}",
	"MAP_WIDTH" => "600",
	"MAP_HEIGHT" => "500",
	"CONTROLS" => array(
		0 => "TYPECONTROL",
	),
	"OPTIONS" => array(
		0 => "ENABLE_SCROLL_ZOOM",
		1 => "ENABLE_DBLCLICK_ZOOM",
		2 => "ENABLE_DRAGGING",
		3 => "ENABLE_KEYBOARD",
	),
	"MAP_ID" => ""
	),
	false
);?> 
  <br />
 <small><a href="https://www.google.ru/maps/place/Анненский+пр.,+1,+Москва/@55.802819,37.6073,17z/data=!3m1!4b1!4m2!3m1!1s0x46b53600c1a3ba4b:0x47e7386beaba64ad?hl=ru" style="color:#0000FF;text-align:left" target="_blank" >Просмотреть увеличенную карту</a></small></div>
 
<div class="bx_page"> 
  <p> 
    <br />
   </p>
 
  <p><b><span style="font-size: 22pt; color: rgb(51, 51, 51); text-transform: uppercase;"><font size="5">ПЕШКОМ:</font><o:p></o:p></span></b></p>
 
  <p><b><span style="font-size: 7.5pt; color: rgb(51, 51, 51); text-transform: uppercase;"> </span></b><b><span style="font-size: 7.5pt; color: rgb(51, 51, 51); text-transform: uppercase;">1. </span></b><b><span style="font-size: 7.5pt; color: rgb(0, 102, 255); text-transform: uppercase;">От метро &quot;марьина роща&quot;</span></b><b><span style="font-size: 7.5pt; color: rgb(51, 51, 51); text-transform: uppercase;"> 10 мин. пешком в сторону останкинской телебашни. Либо любой транспорт до остановки &quot;Поликлиника&quot; (около &quot;АШАНа&quot; на Шереметьевской) далее пешком.</span></b></p>
 
  <p><o:p></o:p></p>
 
  <p><b><span style="font-size: 7.5pt; color: rgb(51, 51, 51); text-transform: uppercase;">2. </span></b><b><span style="font-size: 7.5pt; color: rgb(0, 102, 255); text-transform: uppercase;">От метро &quot;ВДНХ&quot;</span></b><b><span style="font-size: 7.5pt; color: rgb(51, 51, 51); text-transform: uppercase;"> троллейбус №13 или 69 до остановки &quot;Поликлиника&quot; (около &quot;АШАНа&quot; на Шереметьевской) далее пешком.</span></b><o:p></o:p></p>
 
  <p><b><span style="font-size: 7.5pt; color: rgb(51, 51, 51); text-transform: uppercase;">3. </span></b><b><span style="font-size: 7.5pt; color: rgb(0, 102, 255); text-transform: uppercase;">От метро &quot;Рижская&quot;</span></b><b><span style="font-size: 7.5pt; color: rgb(51, 51, 51); text-transform: uppercase;"> автобус №19 до остановки &quot;Поликлиника&quot; (около &quot;АШАНа&quot; на Шереметьевской) далее пешком.</span></b><span style="line-height: 115%;"> </span><b><span style="font-size: 22pt; color: rgb(51, 51, 51); text-transform: uppercase;"> </span></b></p>
 
  <p><b><span style="font-size: 22pt; color: rgb(51, 51, 51); text-transform: uppercase;"><img src="/upload/medialibrary/56b/56b61fd152871b94ac904d657f95b8f0.jpg" title="way4" border="0" alt="way4" width="400" height="267"  /> 
        <br />
      </span></b></p>
 
  <p><font size="5"><b><span style="font-size: 22pt; color: rgb(51, 51, 51); text-transform: uppercase;">НА МАШИНЕ:</span></b></font><o:p></o:p></p>
 
  <p class="MsoNormal"><span style="line-height: 115%;">По Шереметьевской улице в центр проезжаем справа церковь.</span></p>

  <p class="MsoNormal"><span style="line-height: 115%;"><img src="/upload/medialibrary/3a3/3a3c8a150d3a2ea1b5335d967f58d29a.jpg" title="way1" border="0" alt="way1" width="400" height="267"  /></span></p>
 
  <p class="MsoNormal"><span style="line-height: 115%;">Перед эстакадой уходим правее.</span></p>

  <p class="MsoNormal"><span style="line-height: 115%;"><img src="/upload/medialibrary/369/36977d187883d0caba36f4e90d569b31.jpg" title="way2" border="0" alt="way2" width="400" height="267"  /></span></p>
 
  <p class="MsoNormal"><span style="line-height: 115%;">Едем вдоль ж\д путей до въезда в гаражи. Перед ними &ndash; направо.</span></p>

  <p class="MsoNormal"><span style="line-height: 115%;"><img src="/upload/medialibrary/a26/a2678a4ebe038801e1cf0e24770a4086.jpg" title="way3" border="0" alt="way3" width="400" height="267"  /></span></p>
 
  <p class="MsoNormal"><span style="line-height: 115%;">Вам сюда!</span></p>

  <p class="MsoNormal"><img src="/upload/medialibrary/56b/56b61fd152871b94ac904d657f95b8f0.jpg" title="way4" border="0" alt="way4" width="400" height="267"  />
    <br />
  <span style="line-height: 115%;"><o:p></o:p></span></p>
 
  <p class="MsoNormal"></p>
 </div>
 <?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php")?>