<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();
$this->IncludeComponentLang("files.php");
class CCommentFiles
{
	var $filesCount = 1;
	var $imageSize = 100;
	var $component = null;

	function __construct(&$component)
	{
		global $APPLICATION;
		$this->component =& $component;
		$arResult =& $component->arResult;
		$arParams =& $component->arParams;

		$_REQUEST["FILES"] = is_array($_REQUEST["FILES"]) ? $_REQUEST["FILES"] : array();
		$_REQUEST["FILES_TO_UPLOAD"] = is_array($_REQUEST["FILES_TO_UPLOAD"]) ? $_REQUEST["FILES_TO_UPLOAD"] : array();
		
		if (isset($arParams['FILES_COUNT']) && (intval($arParams['FILES_COUNT']) > 0 || $arParams['FILES_COUNT']===0))
			$this->filesCount = intval($arParams['FILES_COUNT']);
		if (isset($arParams['IMAGE_SIZE']) && (intval($arParams['IMAGE_SIZE']) > 0 || $arParams['IMAGE_SIZE']===0))
			$this->imageSize = intval($arParams['IMAGE_SIZE']);

		$APPLICATION->AddHeadScript("/bitrix/js/main/utils.js");

		AddEventHandler("forum", "OnPrepareComments", Array(&$this, "OnPrepareComments"));

		if ($arResult["FORUM"]["ALLOW_UPLOAD"] !== "N")
		{
			AddEventHandler("forum", "OnCommentAdd", Array(&$this, "OnCommentAdd"));
			AddEventHandler("forum", "OnCommentPreview", Array(&$this, "OnCommentPreview"));
		}
	}

	function OnPrepareComments()
	{
		$arResult =& $this->component->arResult;
		$arParams =& $this->component->arParams;

		$arMessages = &$arResult['MESSAGES'];
		if (!empty($arMessages) && is_array($arMessages))
		{
			$res = array_keys($arMessages);
			$arFilter = array("FORUM_ID" => $arParams["FORUM_ID"], "TOPIC_ID" => $arResult["FORUM_TOPIC_ID"],
				"APPROVED" => "Y", ">MESSAGE_ID" => intVal(min($res)) - 1, "<MESSAGE_ID" => intVal(max($res)) + 1);
			$db_files = CForumFiles::GetList(array("MESSAGE_ID" => "ASC"), $arFilter);
			if ($db_files && $res = $db_files->Fetch())
			{
				do
				{
					$res["SRC"] = CFile::GetFileSRC($res);
					if ($arMessages[$res["MESSAGE_ID"]]["~ATTACH_IMG"] == $res["FILE_ID"])
					{
						// attach for custom
						$arMessages[$res["MESSAGE_ID"]]["~ATTACH_FILE"] = $res;
						$arMessages[$res["MESSAGE_ID"]]["ATTACH_IMG"] = CFile::ShowFile($res["FILE_ID"], 0,
							$this->imageSize, $this->imageSize, true, "border=0", false);
						$arMessages[$res["MESSAGE_ID"]]["ATTACH_FILE"] = $arMessages[$res["MESSAGE_ID"]]["ATTACH_IMG"];
					}
					$arMessages[$res["MESSAGE_ID"]]["FILES"][$res["FILE_ID"]] = $res;
					//$arResult["FILES"][$res["FILE_ID"]] = $res;
				} while ($res = $db_files->Fetch());
			}
		}
	}

	function OnCommentPreview()
	{
		$arResult =& $this->component->arResult;
		$arParams =& $this->component->arParams;

		$arError = array();
		$arFields = array(
			"FORUM_ID" => intVal($arParams["FORUM_ID"]), 
			"TOPIC_ID" => 0, 
			"MESSAGE_ID" => 0, 
			"USER_ID" => intVal($GLOBALS["USER"]->GetID())
		);
		$arFiles = array();
		$arFilesExists = array();
		$res = array();
		foreach ($_FILES as $key => $val)
		{
			if ((substr($key, 0, strLen("FILE_NEW")) == "FILE_NEW") && !empty($val["name"]))
				$arFiles[] = $_FILES[$key];
		}
		foreach ($_REQUEST["FILES"] as $key => $val)
		{
			if (!in_array($val, $_REQUEST["FILES_TO_UPLOAD"]))
			{
				$arFiles[$val] = array("FILE_ID" => $val, "del" => "Y");
				unset($_REQUEST["FILES"][$key]);
				unset($_REQUEST["FILES_TO_UPLOAD"][$key]);
			}
			else 
			{
				$arFilesExists[$val] = array("FILE_ID" => $val);
			}
		}
		if (!empty($arFiles))
		{
			$res = CForumFiles::Save($arFiles, $arFields);
			$res1 = $GLOBALS['APPLICATION']->GetException();
			if ($res1)
				$arError[] = array(
					"code" => "file upload error",
					"title" => $res1->GetString());
		}

		$res = is_array($res) ? $res : array();
		foreach ($res as $key => $val)
			$arFilesExists[$key] = $val;
		$arFilesExists = array_keys($arFilesExists);
		sort($arFilesExists);
		$arResult["MESSAGE_VIEW"]["FILES"] = $_REQUEST["FILES"] = $arFilesExists;	

		$arResult["REVIEW_FILES"] = array();
		foreach ($_REQUEST["FILES"] as $key => $val)
			$arResult["REVIEW_FILES"][$val] = CFile::GetFileArray($val);

		if (!empty($arError))
			$arResult['ERROR'] = $arError;
	}

	function OnCommentPreviewDisplay()
	{
		$arResult =& $this->component->arResult;
		$arParams =& $this->component->arParams;

		if (empty($arResult["REVIEW_FILES"]))
			return null;

		ob_start();
		if (!empty($arResult["REVIEW_FILES"]))
		{
?>
			<div class="comments-post-attachments">
				<label><?=GetMessage("F_ATTACH_FILES")?></label>
<?
			$parentComponent = null;
			if (isset($GLOBALS['forumComponent']) && is_object($GLOBALS['forumComponent']))
				$parentComponent =&$GLOBALS['forumComponent'];
				foreach ($arResult["REVIEW_FILES"] as $arFile)
				{
?>
					<div class="comments-post-attachment"><?
					?><?$GLOBALS["APPLICATION"]->IncludeComponent(
						"bitrix:forum.interface", "show_file",
						Array(
							"FILE" => $arFile,
							"WIDTH" => $arResult["PARSER"]->image_params["width"],
							"HEIGHT" => $arResult["PARSER"]->image_params["height"],
							"CONVERT" => "N",
							"FAMILY" => "FORUM",
							"SINGLE" => "Y",
							"RETURN" => "N",
							"SHOW_LINK" => "Y"),
						$parentComponent,
						array("HIDE_ICONS" => "Y"));
					?></div>
<?				}?>
			</div>
<?		}
		return array(array('DISPLAY' => 'AFTER', 'SORT' => '50', 'TEXT' => ob_get_clean()));
	}

	function OnCommentDisplay($arComment)
	{
		$arResult =& $this->component->arResult;
		$arParams =& $this->component->arParams;

		if (empty($arComment["FILES"])) 
			return null;
		ob_start();
		foreach ($arComment["FILES"] as $arFile)
		{
			if (!in_array($arFile["FILE_ID"], $arComment["FILES_PARSED"]))
			{
				?><div class="comments-message-img"><?
				?><?$GLOBALS["APPLICATION"]->IncludeComponent(
				"bitrix:forum.interface", "show_file",
				Array(
					"FILE" => $arFile,
					"WIDTH" => $arResult["PARSER"]->image_params["width"],
					"HEIGHT" => $arResult["PARSER"]->image_params["height"],
					"CONVERT" => "N",
					"FAMILY" => "FORUM",
					"SINGLE" => "Y",
					"RETURN" => "N",
					"SHOW_LINK" => "Y"),
				$this->component,
				array("HIDE_ICONS" => "Y"));
				?></div><?
			}
		}
		return array(array('DISPLAY' => 'AFTER', 'SORT' => '50', 'TEXT' => ob_get_clean()));	
	}

	function OnCommentFormDisplay()
	{
		$arResult =& $this->component->arResult;
		$arParams =& $this->component->arParams;

		ob_start();
?>
		<div class="comments-reply-field comments-reply-field-upload">
<?
			$iCount = 0;
			if (!empty($arResult["REVIEW_FILES"]))
			{
				foreach ($arResult["REVIEW_FILES"] as $key => $val)
				{
					$iCount++;
					$sFileSize = CFile::FormatSize(intval($val["FILE_SIZE"]));
?>
					<div class="comments-uploaded-file">
						<input type="hidden" name="FILES[<?=$key?>]" value="<?=$key?>" />
						<input type="checkbox" name="FILES_TO_UPLOAD[<?=$key?>]" id="FILES_TO_UPLOAD_<?=$key?>" value="<?=$key?>" checked="checked" />
						<label for="FILES_TO_UPLOAD_<?=$key?>"><?=$val["ORIGINAL_NAME"]?> (<?=$val["CONTENT_TYPE"]?>) <?=$sFileSize?>
							( <a href="/bitrix/components/bitrix/forum.interface/show_file.php?action=download&amp;fid=<?=$key?>"><?=GetMessage("F_DOWNLOAD")?></a> )
						</label>
					</div>
<?
				}
			}

			if ($iCount < $this->filesCount)
			{
				$sFileSize = CFile::FormatSize(intval(COption::GetOptionString("forum", "file_max_size", 5242880)));
?>
				<div class="comments-upload-info" style="display:none;" id="upload_files_info_<?=$arParams["form_index"]?>">
<?
					if ($arParams["FORUM"]["ALLOW_UPLOAD"] == "F")
					{
?>
						<span><?=str_replace("#EXTENSION#", $arParams["FORUM"]["ALLOW_UPLOAD_EXT"], GetMessage("F_FILE_EXTENSION"))?></span>
<?
					}
?>
					<span><?=str_replace("#SIZE#", $sFileSize, GetMessage("F_FILE_SIZE"))?></span>
				</div>
<?
			
				for ($ii = $iCount; $ii < $this->filesCount; $ii++)
				{
?>
					<div class="comments-upload-file" style="display:none;" id="upload_files_<?=$ii?>_<?=$arParams["form_index"]?>">
						<input name="FILE_NEW_<?=$ii?>" type="file" value="" size="30" />
					</div>
<?
				}
?>
				<a href="javascript:void(0);" onclick="AttachFile('<?=$iCount?>', '<?=($ii - $iCount)?>', '<?=$arParams["form_index"]?>', this); return false;">
					<span><?=($arResult["FORUM"]["ALLOW_UPLOAD"]=="Y") ? GetMessage("F_LOAD_IMAGE") : GetMessage("F_LOAD_FILE") ?></span>
				</a>
<?
			}
?>
		</div>
<?
		return array(array('DISPLAY' => 'AFTER', 'SORT' => '50', 'TEXT' => ob_get_clean()));
	}

	function OnCommentAdd($entityType, $entityID, &$arPost)
	{
		$arFiles = array();
		if (!empty($_REQUEST["FILES"]))
		{
			foreach ($_REQUEST["FILES"] as $key)
			{
				$arFiles[$key] = array("FILE_ID" => $key);
				if (!in_array($key, $_REQUEST["FILES_TO_UPLOAD"]))
					$arFiles[$key]["del"] = "Y";
			}
		}
		if (!empty($_FILES))
		{
			$res = array();
			foreach ($_FILES as $key => $val)
			{
				if (substr($key, 0, strLen("FILE_NEW")) == "FILE_NEW" && !empty($val["name"]))
					$arFiles[] = $_FILES[$key];
			}
		}
		if (!isset($arPost['FILES']))
			$arPost['FILES'] = array();
		$arPost['FILES'] = array_merge($arPost['FILES'], $arFiles);
	}
}
?>
