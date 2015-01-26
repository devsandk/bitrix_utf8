<?
/* This code captures parse errors*/
register_shutdown_function('error_alert');

function error_alert()
{
	$arErrorType = array(
		E_ERROR => "Fatal error",
		E_PARSE => "Parse error",
	);
	$e = error_get_last();
	if(is_null($e) === false && isset($arErrorType[$e['type']]))
	{
		ob_end_clean();
		echo "<h2>".GetMessage("php_cmd_error")."&nbsp;</h2><p>";
		echo '<b>'.$arErrorType[$e['type']].'</b>: '.htmlspecialcharsbx($e['message']).' in <b>'.htmlspecialcharsbx($e['file']).'</b> on line <b>'.htmlspecialcharsbx($e['line']).'</b>';
	}
	else
	{
		global $DB;
		if(
			isset($DB)
			&& is_object($DB)
			&& $DB->GetErrorMessage() != ''
		)
		{
			ob_end_clean();
			echo "<h2>".GetMessage("php_cmd_error")."&nbsp;</h2><p>";
			echo '<font color=#ff0000>Query Error: '.htmlspecialcharsbx($DB->GetErrorSQL()).'</font> ['.htmlspecialcharsbx($DB->GetErrorMessage()).']';
		}
	}
}
define("BX_COMPRESSION_DISABLED", true);
/* This code captures parse errors*/

function isTextMode()
{
	return (isset($_POST['result_as_text']) && $_POST['result_as_text'] === 'y');
}

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
define("HELP_FILE", "utilities/php_command_line.php");

/**
 * @global \CUser $USER
 * @global \CMain $APPLICATION
 **/

if(!$USER->CanDoOperation('view_other_settings'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

$isAdmin = $USER->CanDoOperation('edit_php');

IncludeModuleLangFile(__FILE__);

if(
	$_SERVER['REQUEST_METHOD'] == 'POST'
	&& $_POST["ajax"] === "y"
)
{
	CUtil::JSPostUnescape();
	require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_js.php");

	if(
		$_POST['query'] <> ''
		&& $isAdmin
		&& check_bitrix_sessid()
	)
	{
		printf('<h2>%s</h2>', getMessage('php_cmd_result'));

		if (isTextMode())
			ini_set('html_errors', 0);

		ob_start();
		$query = rtrim($_POST['query'], ";\x20\n").";\n";
		eval($query);
		$response = ob_get_clean();

		if (isTextMode())
		{
			printf('<pre>%s</pre>', htmlspecialcharsEx($response));
		}
		else
		{
			printf('<p>%s</p>', $response);
		}
	}

	require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin_js.php");
	die();
}

$APPLICATION->SetTitle(GetMessage("php_cmd_title"));

CJSCore::Init(array('ls'));
require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/prolog_admin_after.php");

$aTabs = array(
	array(
		"DIV" => "tab1",
		"TAB" => GetMessage("php_cmd_input"),
		"TITLE" => GetMessage("php_cmd_php"),
	),
);
$editTab = new CAdminTabControl("editTab", $aTabs);
?>
<form name="form1" action="<?echo $APPLICATION->GetCurPage()?>?lang=<?=LANG?>" method="POST">
<?
$editTab->Begin();
$editTab->BeginNextTab();
?>
<tr valign="top">
	<td width="100%" colspan="2">
		<textarea cols="60" name="query" id="query" rows="15" wrap="OFF" style="width:100%;"><?echo htmlspecialcharsbx($_REQUEST['query']); ?></textarea><br />
	</td>
</tr>
<?$editTab->Buttons();
?>
<input<?if(!$isAdmin) echo " disabled"?> type="button" accesskey="x" name="execute" value="<?echo GetMessage("php_cmd_button")?>" onclick="return __FPHPSubmit();" class="adm-btn-save">
<input type="reset" value="<?echo GetMessage("php_cmd_button_clear")?>">

<input type="checkbox" value="Y" name="result_as_text" id="result_as_text">
<label for="result_as_text"><?=GetMessage("php_cmd_text_result")?></label>
<?
$editTab->End();
?>
</form>
<script>
	BX.ready(
		function init()
		{
			var resultAsText = BX.localStorage.get('result_as_text');
			BX('result_as_text').checked = resultAsText != 'n';
		}
	);

	function __FPHPSubmit()
	{
		if(confirm('<?=GetMessageJS("php_cmd_confirm")?>'))
		{
			var resultAsText = BX('result_as_text').checked? 'y': 'n';
			if (resultAsText != BX.localStorage.get('result_as_text'))
				BX.localStorage.set('result_as_text', resultAsText);

			window.scrollTo(0, 500);
			ShowWaitWindow();
			BX.ajax.post(
				'php_command_line.php?lang=' + phpVars.LANGUAGE_ID + '&sessid=' + phpVars.bitrix_sessid,
				{
					query: BX('query').value,
					result_as_text: resultAsText,
					ajax: 'y'
				},
				function(result){
					document.getElementById('result_div').innerHTML = result;
					CloseWaitWindow();
				}
			);
		}
	}
</script>
<?
if(COption::GetOptionString('fileman', "use_code_editor", "Y") == "Y" && CModule::IncludeModule('fileman'))
{
	CCodeEditor::Show(array(
		'textareaId' => 'query',
		'height' => 350,
		'forceSyntax' => 'php',
	));
}
?>
<div id="result_div"></div>
<?
require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin.php");
?>