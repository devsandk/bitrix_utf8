<?php
$pull_default_option = array(
	'path_to_listener' => "http://#DOMAIN#/bitrix/sub/",
	'path_to_listener_secure' => "https://#DOMAIN#/bitrix/sub/",
	'path_to_mobile_listener' => "http://#DOMAIN#:8893/bitrix/sub/",
	'path_to_mobile_listener_secure' => "https://#DOMAIN#:8894/bitrix/sub/",
	'path_to_websocket' => "ws://#DOMAIN#/bitrix/subws/",
	'path_to_websocket_secure' => "wss://#DOMAIN#/bitrix/subws/",
	'path_to_publish' => 'http://127.0.0.1:8895/bitrix/pub/',
	'nginx_version' => '2',
	'nginx_command_per_hit' => '100',
	'nginx' => 'N',
	'push' => 'N',
	'websocket' => 'N',
);
?>