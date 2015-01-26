<?
$MESS["PULL_TAB_SETTINGS"] = "Настройки";
$MESS["PULL_TAB_TITLE_SETTINGS"] = "Настройка параметров модуля";
$MESS["PULL_OPTIONS_PATH_TO_LISTENER"] = "Путь для чтения команд (HTTP)";
$MESS["PULL_OPTIONS_PATH_TO_LISTENER_SECURE"] = "Путь для чтения команд (HTTPS)";
$MESS["PULL_OPTIONS_PATH_TO_LISTENER_DESC"] = "Рекомендуется использовать стандартный порт для HTTP или HTTPS.<br> Используйте 8893 (HTTP) и 8894 (HTTPS) только для версии модуля nginx-push-stream-module 0.3.4";
$MESS["PULL_OPTIONS_PATH_TO_MOBILE_LISTENER"] = "Путь для чтения команд на мобильном приложении (HTTP)";
$MESS["PULL_OPTIONS_PATH_TO_MOBILE_LISTENER_SECURE"] = "Путь для чтения команд на мобильном приложении (HTTPS)";
$MESS["PULL_OPTIONS_PATH_TO_MOBILE_LISTENER_DESC"] = "Всегда используйте нестандартные порты (например 8893 для HTTP и 8894 для HTTPS) для мобильных приложений, т.к. не все мобильные телефоны поддерживают Long pooling на стандартном порту.";
$MESS["PULL_OPTIONS_PATH_TO_WEBSOCKET"] = "Путь для чтения команд через WebSocket (HTTP)";
$MESS["PULL_OPTIONS_PATH_TO_WEBSOCKET_SECURE"] = "Путь для чтения команд через WebSocket (HTTPS)";
$MESS["PULL_OPTIONS_PATH_TO_PUBLISH"] = "Путь для публикации команд";
$MESS["PULL_OPTIONS_PUSH"] = "Отправлять PUSH уведомления на мобильные телефоны";
$MESS["PULL_OPTIONS_WEBSOCKET"] = 'Включить поддержку WebSocket';
$MESS["PULL_OPTIONS_WEBSOCKET_DESC"] = 'Настройка доступа для всех современных браузеров, для более ранних версий будет использована технология Long pooling.';
$MESS["PULL_OPTIONS_NGINX"] = 'На сервере установлен <b>"Сервер очередей"</b> (nginx-push-stream-module)';
$MESS["PULL_OPTIONS_NGINX_CONFIRM"] = 'Внимание: перед включением этой опции вам необходимо установить "Сервер очередей" (nginx-push-stream-module)';
$MESS["PULL_OPTIONS_NGINX_VERSION"] = 'На сервер установлена';
$MESS["PULL_OPTIONS_NGINX_VERSION_034"] = 'Виртуальная машина 4.2 - 4.3 (nginx-push-stream-module 0.3.4)';
$MESS["PULL_OPTIONS_NGINX_VERSION_040"] = 'Виртуальная машина 4.4 и выше (nginx-push-stream-module 0.4.0)';
$MESS["PULL_OPTIONS_NGINX_VERSION_034_DESC"] = 'Модуль nginx-push-stream-module 0.4.0 рекомендован к обязательной установке.<br> При использовании модуля nginx-push-stream-module 0.3.4 не будет доступна работа WebSocket и массовая рассылка команд.';
$MESS["PULL_OPTIONS_NGINX_BUFFER"] = 'Максимальное кол-во отправленных команд за одно подключение к серверу';
$MESS["PULL_OPTIONS_NGINX_BUFFERS_DESC"] = 'Данная настройка зависит от настройки "large_client_header_buffers" сервера "nginx", параметр рассчитан для значения <b>8k</b>';

$MESS["PULL_OPTIONS_WS_CONFIRM"] = 'Внимание: перед включением этой опции вам необходимо убедиться что "Сервер очередей" (nginx-push-stream-module) настроен на поддержку WebSocket';
$MESS["PULL_OPTIONS_NGINX_DOC"] = 'Прочитать подробно об установке и настройке <b>"Сервера очередей"</b> (nginx-push-stream-module) вы можете в';
$MESS["PULL_OPTIONS_NGINX_DOC_LINK"] = "документации";
$MESS["PULL_OPTIONS_STATUS"] = "Состояние модуля";
$MESS["PULL_OPTIONS_STATUS_Y"] = "Активен";
$MESS["PULL_OPTIONS_STATUS_N"] = "Не активен";
$MESS["PULL_OPTIONS_USE"] = "Используют модули";
$MESS["PULL_OPTIONS_SITES"] = "Не использовать модуль на сайтах";
?>