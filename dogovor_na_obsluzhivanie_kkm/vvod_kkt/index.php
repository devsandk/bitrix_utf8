<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");
$APPLICATION->SetTitle("Ввод ККТ в эксплуатацию");
?><span style="background-color: rgb(255, 255, 255);">Ввод в эксплуатацию является обязательной процедурой при начале работы с новой контрольно-кассовой техникой. Прежде чем пользователь сможет начать работу с кассовым аппаратом, специалистам ЦТО предстоит произвести ряд манипуляций. 
  <br />
 К таковым относятся: 
  <br />
 - удаление транспортировочных элементов из состава оборудования 
  <br />
 - досборка в эксплуатационное состояние (установка элементов крепления, расходных материалов, подсоединение разъёмов) 
  <br />
 - проверка опломбирования и наличия средств визуального контроля
  <br />
- фискализация ККТ в налоговой инспекции. 
  <br />
 </span><span style="background-color: rgb(255, 255, 255);"></span> 
<div><span style="background-color: rgb(255, 255, 255);"> 
    <br />
   </span></div>
 
<div> 
  <h2>ОТПРАВИТЬ ЗАЯВКУ  
    <br />
   </h2>
 <?$APPLICATION->IncludeComponent(
	"bitrix:main.feedback",
	"",
	Array(
		"USE_CAPTCHA" => "Y",
		"OK_TEXT" => "Спасибо, ваше сообщение принято.",
		"EMAIL_TO" => "info@entask.ru",
		"REQUIRED_FIELDS" => array(),
		"EVENT_MESSAGE_ID" => array()
	)
);?> 
  <br />
 
  <br />
 </div>
 <?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");?>