<?

$rsLang = CLanguage::GetByID("ru");
$arLang = $rsLang->Fetch();
if (strtoupper($arLang['CHARSET']) == 'UTF-8') {
	include('.description-utf8.php');
}
else {
	$MESS["WD_TITLE"] = "Мастер установки шаблона Bitrixtemplates";
	$MESS["WD_TITLE_DESCR"] = "Мастер устанавливает шаблон(ы) и файлы шаблона для публичной части сайта";
}
?>