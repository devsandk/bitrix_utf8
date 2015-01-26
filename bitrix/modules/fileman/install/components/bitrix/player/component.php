<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

define(BX_FM_MPLAYER,"/bitrix/components/bitrix/player/mediaplayer/player");

$player_type = $arParams['PLAYER_TYPE'];
$fp = $arParams['PATH'];

if (strlen($fp) > 0 && strpos($fp, '.') !== false)
	$ext = (strlen($fp) > 0 && strpos($fp, '.') !== false) ? strtolower(GetFileExtension($fp)) : '';

if ($player_type == 'auto')
	$player_type = (in_array($ext, array('wmv', 'wma'))) ? 'wmv' : 'flv';

if ($ext == 'swf' && $arParams['ALLOW_SWF'] != 'Y')
	return CComponentUtil::__ShowError(GetMessage("SWF_DENIED"));

CUtil::InitJSCore(array('ajax'));

if (!function_exists(escapeFlashvar))
{
	function escapeFlashvar($str)
	{
		$str = str_replace('?', '%3F', $str);
		$str = str_replace('=', '%3D', $str);
		$str = str_replace('&', '%26', $str);
		return $str;
	}

	function isYes($str)
	{
		if (strtoupper($str) == 'Y')
			return 'true';
		return 'false';
	}

	function addFlashvar(&$config, $key, $value, $default = false)
	{
		if (!isset($value) || $value == '' || $value == $default)
			return;
		$config[$key] = escapeFlashvar($value);
	}

	function addWMVJSConfig(&$str, $key, $value, $default = false)
	{
		if (!isset($value) || $value == '' || $value === $default)
			return;
		if ($str != '{')
			$str .= ',';
		$str .= $key.': \''.CUtil::JSEscape($value).'\'';
	}

	function findCorrectFile($path, &$strWarn, $warning = false)
	{
		$arUrl = CHTTP::ParseURL($path);
		if ($arUrl && is_array($arUrl))
		{
			if (isset($arUrl['host'], $arUrl['scheme'])) // abs path
			{
				if (strpos($arUrl['host'], 'xn--') !== false) // Cyrilyc url - punycoded
				{
					// Do nothing
				}
				else
				{
					$originalPath = $path;
					$path = $arUrl['scheme'].'://'.$arUrl['host'];

					$arErrors = array();
					if(defined("BX_UTF"))
						$punicodedPath = CBXPunycode::ToUnicode($path, $arErrors);
					else
						$punicodedPath = CBXPunycode::ToASCII($path, $arErrors);

					if ($pathPunicoded == $path)
						return $originalPath;
					else
						$path = $punicodedPath;

					if (($arUrl['port'] && ($arUrl['scheme'] != 'http' || $arUrl['port'] != 80) && ($arUrl['scheme'] != 'https' || $arUrl['port'] != 443)))
						$path .= ':'.$arUrl['port'];
					$path .= $arUrl['path_query'];
				}
			}
			else // relative path
			{
				$DOC_ROOT = $_SERVER["DOCUMENT_ROOT"];
				$path = Rel2Abs("/", $path);
				$path_ = $path;

				$io = CBXVirtualIo::GetInstance();

				if (!$io->FileExists($DOC_ROOT.$path))
				{
					if(CModule::IncludeModule('clouds'))
					{
						$path = CCloudStorage::FindFileURIByURN($path, "component:player");
						if($path == "")
						{
							if ($warning)
								$strWarn .= $warning."<br />";
							$path = $path_;
						}
					}
					else
					{
						if ($warning)
							$strWarn .= $warning."<br />";
						$path = $path_;
					}
				}
				elseif (strpos($_SERVER['HTTP_HOST'], 'xn--') !== false) // It's cyrilyc site
				{
					$path = CHTTP::URN2URI($path);
				}
			}
		}

		return $path;
	}
}

$warning = '';
$arResult["WIDTH"] = intval($arParams['WIDTH']);
if ($arResult["WIDTH"] <= 0)
	$arResult["WIDTH"] = 400;

$arResult["HEIGHT"] = intval($arParams['HEIGHT']);
if ($arResult["HEIGHT"] <= 0)
	$arResult["HEIGHT"] = 300;

// Only for render in editor
if ($arParams['BX_EDITOR_RENDER_MODE'] == 'Y')
{
?>
<div style="width: <?= $arResult["WIDTH"]?>px; height:<?= $arResult["HEIGHT"]?>px; background: #000; color: #fff; font-weight: bold; padding: 10px;"><?= GetMessage("ABOUT_TEXT")?></div>
<?
	return;
}

if (strlen($arParams['STREAMER']) > 0)
	$path = $fp;
else
	$path = findCorrectFile($fp, $warning, ($arParams["CHECK_FILE"] == "N" ? "" : GetMessage("INCORRECT_FILE")));

$preview = (strlen($arParams['PREVIEW'])) ? findCorrectFile($arParams['PREVIEW'], $w = '') : '';
$logo = (strlen($arParams['LOGO']) > 0) ? findCorrectFile($arParams['LOGO'], $w = '') : '';

if (intval($arParams['VOLUME']) > 100)
	$arParams['VOLUME'] = 100;
if (intval($arParams['VOLUME']) < 0)
	$arParams['VOLUME'] = 0;

if (isset($arParams['PLAYER_ID']) && strlen($arParams['PLAYER_ID']) > 0)
	$arResult["ID"] = $arParams['PLAYER_ID'];
else
	$arResult["ID"] = "bx_".$player_type."_player_".rand();

if ($player_type == 'flv') // FLASH PLAYER
{
	$arResult['PATH'] = $path;

	$jwConfig = array(
		'file' => $GLOBALS["APPLICATION"]->ConvertCharset($path, LANG_CHARSET, "UTF-8"),
		'height' => $arResult['HEIGHT'],
		'width' => $arResult['WIDTH'],
		'dock' => true,
		'id' => $arResult["ID"],
		'controlbar' => isset($arParams['CONTROLBAR']) ? $arParams['CONTROLBAR'] : 'bottom'
	);

	if ($arParams["USE_PLAYLIST"] == 'Y')
	{
		$jwConfig['players'] = array(
			array('type' => 'flash','src' => BX_FM_MPLAYER)
		);
		addFlashvar($jwConfig, 'playlist', $arParams['PLAYLIST'], 'none');
		addFlashvar($jwConfig, 'playlistsize', $arParams['PLAYLIST_SIZE'], '180');
	}
	else
	{
		if (strpos($path, "youtu"))
		{
			$jwConfig['flashplayer'] = BX_FM_MPLAYER;
		}
		else
		{
			$jwConfig['players'] = array(
				array('type' => 'html5'),
				array('type' => 'flash', 'src' => BX_FM_MPLAYER)
			);
		}
	}

	addFlashvar($jwConfig, 'image', $preview, '');

	// Logo
	if ($logo != '' && $arParams["LOGO_POSITION"] != "none")
	{
		$logoLink = trim($arParams["LOGO_LINK"]) != "" ? $arParams["LOGO_LINK"] : GetMessage("ABOUT_LINK");
		addFlashvar($jwConfig, 'logo.position', $arParams["LOGO_POSITION"]);
		addFlashvar($jwConfig, 'logo.file', $logo);
		addFlashvar($jwConfig, 'logo.link', $logoLink);
	}
	else
	{
		addFlashvar($jwConfig, 'logo.hide', 'true');
	}

	// Skining
	$skinPath = rtrim($arParams['SKIN_PATH'], "/")."/";
	$skinExt = strtolower(GetFileExtension($arParams['SKIN']));
	$skinName = substr($arParams['SKIN'], 0, - strlen($skinExt) - 1);

	if ($arParams['SKIN'] != '' && $arParams['SKIN'] != 'default')
	{
		if ($skinExt == 'swf' || $skinExt == 'zip')
		{
			if (file_exists($_SERVER["DOCUMENT_ROOT"].$skinPath.$arParams['SKIN']))
			{
				$skin = $skinPath.$arParams['SKIN'];
			}
			elseif (file_exists($_SERVER["DOCUMENT_ROOT"].$skinPath.$skinName.'/'.$arParams['SKIN']))
			{
				$skin = $skinPath.$skinName.'/'.$arParams['SKIN'];
			}
			else
			{
				$fname = substr($arParams['SKIN'], 0, strrpos($arParams['SKIN'], '.'));
				if ($skinExt == 'swf' && file_exists($_SERVER["DOCUMENT_ROOT"].$skinPath.$fname.'.zip'))
					$skin = $skinPath.$fname.'.zip';
				else
					$skin = '';
			}
			addFlashvar($jwConfig, 'skin', $skin);
		}
	}

	addFlashvar($jwConfig, 'autostart', isYes($arParams['AUTOSTART']), 'false');
	addFlashvar($jwConfig, 'repeat', $arParams['REPEAT'], 'none');
	addFlashvar($jwConfig, 'volume', $arParams['VOLUME'], 90);
	addFlashvar($jwConfig, 'mute', isYes($arParams['MUTE']), 'false');
	addFlashvar($jwConfig, 'shuffle', isYes($arParams['SHUFFLE']), 'false');
	addFlashvar($jwConfig, 'item', $arParams['START_ITEM'], '0');
	addFlashvar($jwConfig, 'bufferlength', $arParams['BUFFER_LENGTH'], '1');

	// File info
	addFlashvar($jwConfig, 'title', $arParams['FILE_TITLE']);
	addFlashvar($jwConfig, 'duration', $arParams['FILE_DURATION']);
	addFlashvar($jwConfig, 'author', $arParams['FILE_AUTHOR']);
	addFlashvar($jwConfig, 'date', $arParams['FILE_DATE']);
	addFlashvar($jwConfig, 'description', $arParams['FILE_DESCRIPTION']);

	// Append plugins
	if (is_array($arParams['PLUGINS']) && count($arParams['PLUGINS']) > 0)
		$jwConfig['plugins'] = array();

	// Append plugins vars
	for ($i = 0, $l = count($arParams['PLUGINS']); $i < $l; $i++)
	{
		if (strlen($arParams['PLUGINS'][$i]) <= 0)
			continue;

		$plArray = array();
		$pluginName = preg_replace("/[^a-zA-Z0-9_-]/i", "_", trim($arParams['PLUGINS'][$i]));

		if (isset($arParams["PLUGINS_".strtoupper($pluginName)]))
		{
			$arFlashVars = explode("\n", trim($arParams["PLUGINS_".strtoupper($pluginName)]));
			for ($j = 0, $n = count($arFlashVars); $j < $n; $j++)
			{
				$var_ = explode("=", trim($arFlashVars[$j]));
				if (count($var_) < 2 || strlen($var_[0]) <= 0 || strlen($var_[1]) <= 0)
					continue;
				addFlashvar($plArray, $var_[0], $var_[1]);
			}
		}
		$jwConfig['plugins'][$arParams['PLUGINS'][$i]] = $plArray;
	}

	// Append additional flashvars
	$arFlashVars = explode("\n", trim($arParams["ADDITIONAL_FLASHVARS"]));
	for ($j = 0, $n = count($arFlashVars); $j < $n; $j++)
	{
		$var_ = explode("=", trim($arFlashVars[$j]));
		if (count($var_) < 2 || strlen($var_[0]) <= 0 || strlen($var_[1]) <= 0)
			continue;
		addFlashvar($jwConfig, $var_[0], $var_[1]);
	}

	if (strpos($path, "youtube.") !== false || strpos($path, "y2u.be") !== false)
		$arParams['PROVIDER'] = "youtube";

	addFlashvar($jwConfig, 'provider', $arParams['PROVIDER']);

	if (strlen($arParams['STREAMER']) > 0)
		addFlashvar($jwConfig, 'streamer', $arParams['STREAMER']);

	addFlashvar($jwConfig, 'abouttext', GetMessage('ABOUT_TEXT'), '');
	addFlashvar($jwConfig, 'aboutlink', GetMessage('ABOUT_LINK'), '');
	if ($arParams['CONTENT_TYPE'])
		addFlashvar($jwConfig, 'type', $arParams['CONTENT_TYPE'], '');

	$arResult['jwConfig'] = CUtil::PhpToJSObject($jwConfig);
}
else // WMV PLAYER
{
	$conf = "{";
	addWMVJSConfig($conf, 'file', $path, '');
	addWMVJSConfig($conf, 'image', $preview, '');

	addWMVJSConfig($conf, 'width', $arResult["WIDTH"]);
	addWMVJSConfig($conf, 'height', $arResult["HEIGHT"]);
	addWMVJSConfig($conf, 'backcolor', $arParams["CONTROLS_BGCOLOR"], 'FFFFFF');
	addWMVJSConfig($conf, 'frontcolor', $arParams["CONTROLS_COLOR"], '000000');
	addWMVJSConfig($conf, 'lightcolor', $arParams["CONTROLS_OVER_COLOR"], '000000');
	addWMVJSConfig($conf, 'screencolor', $arParams["SCREEN_COLOR"], '000000');

	addWMVJSConfig($conf, 'shownavigation', isYes($arParams["SHOW_CONTROLS"]), 'true');
	addWMVJSConfig($conf, 'showdigits', isYes($arParams["SHOW_DIGITS"]), 'true');

	addWMVJSConfig($conf, 'autostart', isYes($arParams["AUTOSTART"]), 'false');
	addWMVJSConfig($conf, 'repeat', $arParams["REPEAT"] != "none", 'false');
	addWMVJSConfig($conf, 'volume', $arParams['VOLUME'], 80);
	addWMVJSConfig($conf, 'bufferlength', $arParams['BUFFER_LENGTH'], 3);
	addWMVJSConfig($conf, 'link', $arParams['DOWNLOAD_LINK'], '');
	addWMVJSConfig($conf, 'linktarget', $arParams['DOWNLOAD_LINK_TARGET'], '_self');

	addWMVJSConfig($conf, 'title', $arParams['FILE_TITLE']);
	addWMVJSConfig($conf, 'duration', $arParams['FILE_DURATION']);
	addWMVJSConfig($conf, 'author', $arParams['FILE_AUTHOR']);
	addWMVJSConfig($conf, 'date', $arParams['FILE_DATE']);
	addWMVJSConfig($conf, 'description', $arParams['FILE_DESCRIPTION']);

	// Append additional js vars
	$arWMVVars = explode("\n", trim($arParams["ADDITIONAL_WMVVARS"]));
	for ($j = 0, $n = count($arWMVVars); $j < $n; $j++)
	{
		$var_ = explode("=", trim($arWMVVars[$j]));
		if (count($var_) == 2 && strlen($var_[0]) > 0 && strlen($var_[1]) > 0)
			addWMVJSConfig($conf, $var_[0], $var_[1]);
	}
	if ($arParams["WMODE_WMV"] == 'windowless')
		addWMVJSConfig($conf, 'windowless', 'true', '');
	$conf .= "}";

	$arResult["WMV_CONFIG"] = $conf;
	if ($arParams["SHOW_CONTROLS"] == 'Y')
		$arResult["HEIGHT"] += 20;

	$arResult["USE_JS_PLAYLIST"] = (($arParams["USE_PLAYLIST"] == 'Y'));
	$playlist_conf = false;
	if ($arResult["USE_JS_PLAYLIST"])
	{
		$playlist_conf = '{';
		addWMVJSConfig($playlist_conf, 'format', $arParams['PLAYLIST_TYPE'], 'xspf');
		addWMVJSConfig($playlist_conf, 'size', $arParams['PLAYLIST_SIZE'], '180');
		addWMVJSConfig($playlist_conf, 'image_height', $arParams['PLAYLIST_PREVIEW_HEIGHT']);
		addWMVJSConfig($playlist_conf, 'image_width', $arParams['PLAYLIST_PREVIEW_WIDTH']);
		addWMVJSConfig($playlist_conf, 'position', $arParams['PLAYLIST'] == 'right' ? 'right' : 'bottom', 'right');
		addWMVJSConfig($playlist_conf, 'path', $path, '');
		$playlist_conf .= "}";
	}
	$arResult["PLAYLIST_CONFIG"] = $playlist_conf;
}
$arResult["PLAYER_TYPE"] = $player_type;

if($arParams["USE_PLAYLIST"] == 'Y')
{
	$playlistExists = file_exists($_SERVER["DOCUMENT_ROOT"].$path);
	if (!$playlistExists)
		$warning = GetMessage('INCORRECT_PLAYLIST');

	//Icons
	$bShowIcon = $USER->IsAuthorized();
	if ($bShowIcon && strlen($path) > 0)
	{
		$playlist_edit_url = $APPLICATION->GetPopupLink(
			array(
				"URL"=> "/bitrix/components/bitrix/player/player_playlist_edit.php?lang=".LANGUAGE_ID.
					"&site=".SITE_ID."&back_url=".urlencode($_SERVER["REQUEST_URI"]).
					"&path=".urlencode($path)."&contID=".urlencode($arResult["ID"]),
				"PARAMS" => array(
					'width' => '850',
					'height' => '400'
				)
			)
		);

		if (!$playlistExists)
			$warning .= '<br><a href="javascript:'.$playlist_edit_url.'">'.GetMessage("PLAYER_PLAYLIST_ADD").'</a>';
		$arIcons = Array(Array(
			"URL" => 'javascript:'.$playlist_edit_url,
			"ICON" => "bx-context-toolbar-edit-icon",
			"TITLE" => ($playlistExists ? GetMessage("PLAYER_PLAYLIST_EDIT") : GetMessage("PLAYER_PLAYLIST_ADD")),
		));
		echo '<script>if (JCPopup) {window.jsPopup_playlist = new JCPopup({suffix: "playlist", zIndex: 3000});}</script>'; // create instance of JCPopup: jsPopup_playlist
		$this->AddIncludeAreaIcons($arIcons);
	}
}

if(isset($arParams['INIT_PLAYER']))
	$arResult['INIT_PLAYER'] = $arParams['INIT_PLAYER'];
else
	$arResult['INIT_PLAYER'] = "Y";

if (strlen($warning) > 0)
	return CComponentUtil::__ShowError($warning);

$this->IncludeComponentTemplate();
?>