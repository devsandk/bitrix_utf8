<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
	die();

/**
 * @var array $arParams
 * @var array $arResult
 * @var CBitrixComponent $component
 * @global CMain $APPLICATION
 * @global CUser $USER
 */
?>
<?$APPLICATION->restartBuffer();?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
	<head>
		<title><?=getMessage('SECURITY_USER_RECOVERY_CODES_PRINT_TITLE')?></title>
		<meta http-equiv="Content-Type" content="text/html; charset=<?=LANG_CHARSET?>">
		<script type="application/javascript">
			var __readyHandler = null;

			/* ready */
			if (document.addEventListener)
			{
				__readyHandler = function()
				{
					document.removeEventListener('DOMContentLoaded', __readyHandler, false);
					onReady();
				}
			}
			else if (document.attachEvent)
			{
				__readyHandler = function()
				{
					if (document.readyState === 'complete')
					{
						document.detachEvent('onreadystatechange', __readyHandler);
						onReady();
					}
				}
			}

			function bindReady()
			{
				if (document.readyState === 'complete')
				{
					return onReady();
				}

				if (document.addEventListener)
				{
					document.addEventListener('DOMContentLoaded', __readyHandler, false);
				}
				else if (document.attachEvent) // IE
				{
					document.attachEvent('onreadystatechange', __readyHandler);
				}
			}

			function onReady()
			{
				setTimeout(window.print, 100);
				setTimeout(window.close, 500);
			}
		</script>
	</head>
<body>
	<h3>
		<?=getMessage('SECURITY_USER_RECOVERY_CODES_PRINT_TITLE')?>
	</h3>

<?if ($arResult["MESSAGE"]):?>
	<?=htmlspecialcharsbx($arResult["MESSAGE"]);?>
<?else:?>
	<p>
		<?=htmlspecialcharsbx($arResult['ISSUER'])?> (<?=htmlspecialcharsbx($USER->getLogin())?>)
	</p>
	<ol>
		<?foreach ($arResult['CODES'] as $code):?>
			<?if ($code['USED'] === 'N'):?>
				<li style="clear: both;"><?=htmlspecialcharsbx($code['VALUE'])?></li>
			<?endif;?>
		<?endforeach;?>
	</ol>
	<?if ($arResult['CREATE_DATE']):?>
		<p>
			<?=getMessage('SECURITY_USER_RECOVERY_CODES_PRINT_CREATED', array('#DATE#' => $arResult['CREATE_DATE']))?>
		</p>
	<?endif?>
	<p>
		<?=getMessage('SECURITY_USER_RECOVERY_CODES_PRINT_NOTE')?>
	</p>
	</body>
	<script>
		bindReady();
	</script>
	</html>
<?endif?>
<?die;?>