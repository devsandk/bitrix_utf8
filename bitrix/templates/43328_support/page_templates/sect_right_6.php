<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>

<h2 class="indenth2-2 mar0">contact form</h2>
<?$APPLICATION->IncludeComponent("codenails:main.feedback", "feedback", Array(
	"USE_CAPTCHA" => "Y",	// Использовать защиту от автоматических сообщений (CAPTCHA) для неавторизованных пользователей
	"OK_TEXT" => "Спасибо, ваше сообщение принято.",	// Сообщение, выводимое пользователю после отправки
	"EXT_FIELDS" => array(	// Дополнительные поля
		0 => "Телефон",
	),
	"EMAIL_TO" => "my@emlo.com",	// E-mail, на который будет отправлено письмо
	"REQUIRED_FIELDS" => array(	// Обязательные поля для заполнения
		0 => "NAME",
		1 => "EMAIL",
		2 => "MESSAGE",
	),
	"EVENT_MESSAGE_ID" => array(	// Почтовые шаблоны для отправки письма
		0 => "7",
	)
	),
	false
);?>