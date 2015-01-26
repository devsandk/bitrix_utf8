<?

$rsLang = CLanguage::GetByID("ru");
$arLang = $rsLang->Fetch();
if (strtoupper($arLang['CHARSET']) == 'UTF-8') {
	include('wizard-utf8.php');
}
else {
	$MESS ['WD_STEP_0_TITLE'] = "Мастер установки шаблона Bitrixtemplates";
	$MESS ['WD_STEP_0_WIZARD_ABOUT'] = 'Данный мастер устанавливает на ваш сайт/сайты шаблоны, заказанные на bitrixtemplates.ru<br /> <br />
	<b>Описание шагов:</b><br /> <br />
	<ul>
	 <li>Шаг 1. Установка шаблона</li>
	 <li>Шаг 2. Копирование файлов/данных публичной части</li>
	 <li>Шаг 3. Вывод результатов работы мастера</li>
	</ul>';
	$MESS ['WD_STEP_0_CONTINUE'] = 'Нажмите "Далее" для установки или "Отмена" для выхода из мастера.';
	
	$MESS ['WD_STEP_1_TITLE'] = "Шаг 1. Установка шаблона";
	$MESS ['WD_STEP_1_TEMPLATES'] = "Мастер готов установить следующие шаблоны:";
	$MESS ['WD_STEP_1_NOT_INSTALLED'] = "Ошибка копирования шаблона";
	$MESS ['WD_STEP_1_COPY_PUB'] = 'Нажмите "Далее" для копирования публичной части';
	
	$MESS ['WD_STEP_2_TITLE'] = "Шаг 2. Копирование файлов/данных публичной части";
	$MESS ['WD_STEP_2_COPY_PUB'] = "Рекомендуется установить публичную часть шаблона, выберите сайты для установки";
	$MESS ['WD_STEP_2_ATTENTION'] = "Внимание! Старые версии включаемых областей будут утеряны.";
	$MESS ['WD_STEP_2_NOT_INSTALLED'] = "Ошибка копирования файлов";
	$MESS ['WD_STEP_2_INSTALL_DATA'] = 'Установить инфоблоки с демо-данными';
	$MESS ['WD_STEP_2_CONTINUE'] = 'Нажмите "Далее" для копирования или "Отмена" для выхода из мастера.';
	
	$MESS ['WD_FINISH_TITLE'] = 'Шаг 3. Вывод результатов работы мастера';
	$MESS ['WD_FINISH_RESULTS'] = 'Установка шаблона успешно завершена';
	$MESS ['WD_FINISH_TPL_INSTALLED'] = "Установлены шаблоны";
	$MESS ['WD_FINISH_PUB_INSTALLED'] = "Шаблоны и файлы публичной части установлены на сайты:";
	
	
	$MESS ['WD_CANCEL_TITLE'] = 'Работа мастера прервана';
	$MESS ['WD_CANCEL_NO_TPL'] = 'Шаблон не был установлен';
	$MESS ['WD_TPL_NOT_ASSIGN'] = 'Шаблон не был назначен сайту';
	$MESS ['WD_CANCEL_NO_PUB'] = 'Файлы публичной части не установлены';
	$MESS ['WD_CLOSE'] = 'Закрыть';
	
	$MESS ['WD_SITE_NOT_FOUND'] = 'Сайт не найден';
	$MESS ['WD_SITE_NOT_WRITABLE'] = 'Каталог сайта не доступен для записи';
}
?>