<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

require_once("scripts/utils.php");

class Step0 extends CWizardStep
{
	function InitStep()
	{
		$this->SetTitle(GetMessage("WD_STEP_0_TITLE"));
		$this->SetNextStep("step1");
		$this->SetStepID("step0");
		$this->SetCancelStep("cancel");
		$wizard = &$this->GetWizard();
		$wizard->SetDefaultVar('template_installed', array());
		$wizard->SetDefaultVar('public_files_installed', array());
		$wizard->SetDefaultVar('public_data_installed', array());
		$wizard->SetDefaultVar('public_data_updater', '');
	}

	function ShowStep()
	{
		$wizard = &$this->GetWizard();
		$bConvertCharset = $wizard->GetVar('convert_charset');
		
		$this->content .= '<p>' . GetMessage("WD_STEP_0_WIZARD_ABOUT") . '</p>';
		$this->content .= '<p>' . GetMessage("WD_STEP_0_CONTINUE") . '</p>';
		$bIsUTF = (defined('BX_UTF') && BX_UTF == true);
	}
}


class Step1 extends CWizardStep
{
	function InitStep()
	{
		$this->SetTitle(GetMessage("WD_STEP_1_TITLE"));
		$this->SetNextStep("step2");
		$this->SetStepID("step1");
		$this->SetCancelStep("cancel");
	}

	function ShowStep()
	{
		$this->content .= '<p>' . GetMessage("WD_STEP_1_TEMPLATES");
		if ($dh = opendir(dirname(__FILE__) . '/templates')) {
			$this->content .= '<ul>';
			while($file = readdir($dh)) {
				if (($file != '.') && ($file != '..') && is_dir(dirname(__FILE__) . "/templates/$file")) {
					$this->content .= '<li><b>' . htmlspecialchars($file) . '</b></li>';
				}
			}
			$this->content .= '</ul>';
		}
		$this->content .= '</p>';
		$this->content .= '<p>' . GetMessage("WD_STEP_0_CONTINUE") . '</p>';
	}
	
	function OnPostForm()
	{
		$wizard = &$this->GetWizard();
		$bIsUTF = (defined('BX_UTF') && BX_UTF == true);
		
		if ($wizard->IsNextButtonClick())
		{
			/*
			хрен там а не булева величина
			false - on error, null - on success
			CopyDirFiles(
			 string from,
			 string to,
			 bool rewrite = true,
			 bool recursive = false,
			 bool delete_after_copy = false,
			 string exclude = ""
			);
			*/
			if (!$bIsUTF) {
				if (CopyDirFiles(str_replace('\\', '/', dirname(__FILE__)) . '/templates', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/templates', true, true) !== false) {
					if ($dh = opendir(dirname(__FILE__) . '/templates')) {
						while($file = readdir($dh)) {
							if (($file != '.') && ($file != '..') && is_dir(dirname(__FILE__) . "/templates/$file")) {
								$tmpls[] = htmlspecialchars($file);
							}
						}
						$wizard->SetVar('template_installed', $tmpls);
					}
				}
				else {
					$this->SetError( GetMessage('WD_STEP_0_NOT_INSTALLED') );
				}
			}
			else {
				if (WizardServices::CopyDirFilesEx(str_replace('\\', '/', dirname(__FILE__)) . '/templates', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/templates') !== false) {
					if ($dh = opendir(dirname(__FILE__) . '/templates')) {
						while($file = readdir($dh)) {
							if (($file != '.') && ($file != '..') && is_dir(dirname(__FILE__) . "/templates/$file")) {
								$tmpls[] = htmlspecialchars($file);
							}
						}
						$wizard->SetVar('template_installed', $tmpls);
					}
				}
				else {
					$this->SetError( GetMessage('WD_STEP_0_NOT_INSTALLED') );
				}
			}
		}
	}
	
	
}

class Step2 extends CWizardStep
{
	
	function InitStep()
	{
		$this->SetTitle(GetMessage("WD_STEP_2_TITLE"));
		$this->SetNextStep("final");
		$this->SetStepID("step2");
		$this->SetCancelStep("cancel");
	}

	function ShowStep()
	{
		
		
		$this->content .= '<p>' . GetMessage('WD_STEP_2_COPY_PUB') . '<br />';
		$this->content .= '' . GetMessage('WD_STEP_2_ATTENTION') . '</p>';
		$rS = CSite::GetList($ord='id', $dir='asc', array('ACTIVE'=>'Y'));
		while($arr = $rS->Fetch()) {
			$this->content .= $this->ShowCheckboxField('sites[]', $arr['LID'], array('checked'=>'checked')) . $arr['NAME'] . '<br />';
		}
		$dataFolder = str_replace('\\', '/', dirname(__FILE__)) . '/public_data';
		if (is_dir($dataFolder)) {
			$wizard = &$this->GetWizard();
			$pub_data = array();
			if ($dh = opendir($dataFolder)) {
				while($file = readdir($dh)) {
					if ($file != '.' && $file != '..' && is_file("$dataFolder/$file")) {
						$ext = end(explode('.',$file));
						if (ToUpper($ext) == 'XML') {
							$pub_data[] = array(
								'filepath'=>$file,
								'name'=>substr($file,0,-4),
							);
						}
						if ($file == 'update.php') {
							$wizard->SetVar('public_data_updater', $file);
						}
					}
				}
			}
			if (count($pub_data)) {
				$wizard->SetVar('public_data_installed', $pub_data);
				//$this->content .= $this->ShowCheckboxField('install_data', 'Y', array('checked'=>'checked')) . GetMessage('WD_STEP_2_INSTALL_DATA') . '<br />';
			}
		}
		$this->content .= '<p>' . GetMessage('WD_STEP_2_CONTINUE') . '</p>';
	}
	
	function OnPostForm()
	{
		$wizard = &$this->GetWizard();
		
		if ($wizard->IsNextButtonClick())
		{
			$SITES = $wizard->GetVar('sites');
			$arSitesPassed = array();
			$pub_files = $wizard->GetVar('public_files_installed');
			$pub_data = $wizard->GetVar('public_data_installed');
			$pub_updater = $wizard->GetVar('public_data_updater');
			
			$arErrors=array();
			
			if (is_array($SITES) && count($SITES)) {
				$rS = CSite::GetList($ord='id', $dir='asc', array('ACTIVE'=>'Y'));
				$arSites = array();
				while($arr = $rS->Fetch()) {
					$arSites[$arr['LID']] = $arr;
				}
				
				foreach($SITES as $ST) {
					if (! in_array($ST, array_keys($arSites)) || !($arSites[$ST]['DIR'] || $arSites[$ST]['DOC_ROOT'])) {
						$arErrors[] = array('LID'=>$ST, 'MSG'=>GetMessage('WD_SITE_NOT_FOUND'));
						continue;
					}
					if (! empty($arSites[$ST]['DOC_ROOT'])) {
						if (! is_writable($arSites[$ST]['DOC_ROOT']) ) {
							$arErrors[] = array('LID'=>$ST, 'NAME'=>$arSites[$ST]['NAME'], 'PATH'=>$arSites[$ST]['DOC_ROOT'], 'MSG'=>GetMessage('WD_SITE_NOT_WRITABLE'));
							continue;
						}
						else {
							$doc_root = preg_replace('#\/$#', '', $arSites[$ST]['DOC_ROOT']);
						}
					}
					else {
						if (! is_writable($_SERVER['DOCUMENT_ROOT'] . $arSites[$ST]['DIR']) ) {
							$arErrors[] = array('LID'=>$ST, 'NAME'=>$arSites[$ST]['NAME'], 'PATH'=>$_SERVER['DOCUMENT_ROOT'] . $arSites[$ST]['DIR'], 'MSG'=>GetMessage('WD_SITE_NOT_WRITABLE'));
							continue;
						}
						else {
							$doc_root = preg_replace('#\/$#', '', $_SERVER['DOCUMENT_ROOT'] . $arSites[$ST]['DIR']);
						}
					}
					$tmpls = $wizard->GetVar('template_installed');
					$arFields=array();
					$arFields['NAME'] = $arSites[$ST]['NAME'];
					$index=1;
					foreach($tmpls as $tp) {
						$arFields["TEMPLATE"][] = array(
							"TEMPLATE" => $tp,
							"SORT" => $index++,
							"CONDITION" => ''
						);
					}
					
					$bIsUTF = (defined('BX_UTF') && BX_UTF == true);
					
					if (!$bIsUTF) {
						if (CopyDirFiles(str_replace('\\', '/', dirname(__FILE__)) . '/public_files', $doc_root, true, true) !== false) {
							$pub_files[] = '[' . $arSites[$ST]['LID'] . '] ' . $arSites[$ST]['NAME'];
							
							$langs = new CLang;
							if ($langs->Update($ST, $arFields) === false) {
								$arErrors[] = array('LID'=>$ST, 'NAME'=>$arSites[$ST]['NAME'], 'MSG'=>GetMessage('WD_TPL_NOT_ASSIGN'));
							}
							$arSitesPassed[] = $ST;
						}
						else {
							$this->SetError( GetMessage('WD_STEP_2_NOT_INSTALLED') );
						}
					}
					else {
						if (WizardServices::CopyDirFilesEx(str_replace('\\', '/', dirname(__FILE__)) . '/public_files', $doc_root) !== false) {
							
							$pub_files[] = '[' . $arSites[$ST]['LID'] . '] ' . $arSites[$ST]['NAME'];
							
							$langs = new CLang;
							if ($langs->Update($ST, $arFields) === false) {
								$arErrors[] = array('LID'=>$ST, 'NAME'=>$arSites[$ST]['NAME'], 'MSG'=>GetMessage('WD_TPL_NOT_ASSIGN'));
							}
							$arSitesPassed[] = $ST;
						}
						else {
							$this->SetError( GetMessage('WD_STEP_2_NOT_INSTALLED') );
						}
					}
				}
			}
			$wizard->SetVar('errors', $arErrors);
			$wizard->SetVar('public_files_installed', $pub_files);
			//$install_data = $wizard->GetVar('install_data');
			if (count($arSitesPassed) && count($pub_data)) {
				CModule::IncludeModule('iblock');
				// create iblock type
				$arType = array(
					'ID'=>'BT',
					"SECTIONS" => "Y",
					"IN_RSS" => "N",
					"SORT" => 100,
					"LANG" => Array(),
				);
				$arLanguages = Array();
				$rsLanguage = CLanguage::GetList($by, $order, array());
				while($arLanguage = $rsLanguage->Fetch())
					$arLanguages[] = $arLanguage["LID"];	
					
				$bIBType = true;
				$dbType = CIBlockType::GetList(Array(),Array("=ID" => $arType["ID"]));
				if(! $dbType->Fetch()) {
					foreach($arLanguages as $languageID)
					{
						$arType["LANG"][$languageID]["NAME"] = 'Bitrixtemplates';
						$arType["LANG"][$languageID]["ELEMENT_NAME"] = 'Item';
						$arType["LANG"][$languageID]["SECTION_NAME"] = 'Section';
					}
					$iblockType = new CIBlockType;
					$bIBType = $iblockType->Add($arType);
				}
				
				if ($bIBType) {
					$arCodeToId = array();
					foreach($pub_data as $arF) {
						$iblockCode = $arF['name'];
						$rsIBlock = CIBlock::GetList(array(), array("CODE" => $iblockCode, "TYPE" => $arType['ID']));
						if ($arIBlock = $rsIBlock->Fetch())
						{
							CIBlock::Delete($arIBlock["ID"]); 
						}
						$filepath = str_replace('\\', '/', dirname(__FILE__)) . '/public_data/'.$arF['filepath'];
						$filepath = preg_replace('#^.+?\/bitrix\/#','/bitrix/', $filepath);
						//echo $filepath;
						$iblockID = WizardServices::ImportIBlockFromXML(
							$filepath,
							$iblockCode,
							$arType['ID'],
							$arSitesPassed
						);
						$arCodeToId[$iblockCode] = $iblockID;
					}
					if ($pub_updater) {
						$updater = str_replace('\\', '/', dirname(__FILE__)) . '/public_data/'.$pub_updater;
						$arUpdate = array();
						include($updater);
						if (is_array($arUpdate)) {
							foreach($arUpdate as $arData) {
								$file = $_SERVER[DOCUMENT_ROOT].$arData['file'];
								//echo $file;
								//print_r($arCodeToId);
								$iblockCode = ToUpper($arData['code']).'_IBLOCK_CODE';
								$iblockId = ToUpper($arData['code']).'_IBLOCK_ID';
								$id = $arCodeToId[$arData['code']];
								if (file_exists($file) && $id) {
									CWizardUtil::ReplaceMacros($file, array($iblockCode => $arType['ID'], $iblockId => $id));
								}
							}
						}
					}
				}
			}
		}
	}
}


class FinalStep extends CWizardStep
{

	function InitStep()
	{
		$this->SetTitle(GetMessage("WD_FINISH_TITLE"));
		$this->SetStepID("final");
		$this->SetCancelCaption(GetMessage("WD_CLOSE"));
		$this->SetCancelStep("final");
	}

	function ShowStep()
	{
		$wizard = &$this->GetWizard();
		
		$this->content .= '<p><b>' . GetMessage("WD_FINISH_RESULTS") . '</b></p>';
		$tmpls = $wizard->GetVar('template_installed');
		if (is_array($tmpls) && count($tmpls)) {
			$this->content .= '<p>' . GetMessage("WD_FINISH_TPL_INSTALLED") . ':</p>';
			$this->content .= '<b>' . implode('<br />', $tmpls) . '</b>';
		}
		$pub_sites = $wizard->GetVar('public_files_installed');
		if (is_array($pub_sites) && count($pub_sites)) {
			$this->content .= '<p>' . GetMessage("WD_FINISH_PUB_INSTALLED") . '<br /> <br />';
			$this->content .= '<b>' . implode('<br />', $pub_sites) . '</b>';
			$this->content .= '</p>';
		}
		$arErrors = $wizard->GetVar('errors');
		if (is_array($arErrors) && count($arErrors)) {
			$this->content .= '<p style="color:red;">' . GetMessage('WD_FINISH_ERRORS') . '</p>';
			foreach($arErrors as $err) {
				$this->content .= '<p><b>' . $err['MSG'] . '</b><br />';
				if ($err['LID']) {
					$this->content .= 'LID: ' . $err['LID'] . '<br />';
				}
				if ($err['NAME']) {
					$this->content .= 'NAME: ' . $err['NAME'] . '<br />';
				}
				if ($err['PATH']) {
					$this->content .= 'PATH: ' . $err['PATH'] . '<br />';
				}
			}
			$this->content .= '</p>';
		}
	}
}

class CancelStep extends CWizardStep
{

	function InitStep()
	{
		$this->SetTitle(GetMessage("WD_CANCEL_TITLE"));
		$this->SetStepID("cancel");
		$this->SetCancelCaption(GetMessage("WD_CLOSE"));
		$this->SetCancelStep("cancel");
	}

	function ShowStep()
	{
		$wizard = &$this->GetWizard();
		$tmpls = $wizard->GetVar('template_installed');
		if (is_array($tmpls) && count($tmpls)) {
			$this->content .= '<p style="color:#3c3;">' . GetMessage("WD_FINISH_TPL_INSTALLED") . ':<br />';
			$this->content .= '<b>' .  implode('<br />', $tmpls) . '</b>';
			$this->content .= '</p>';
		}
		else {
			$this->content .= '<p style="color:#f33;">' . GetMessage("WD_CANCEL_NO_TPL") . '!</p>';
		}
		if ($wizard->GetVar('public_files_installed')) {
			$this->content .= '<p style="color:#3c3;">' . GetMessage("WD_FINISH_PUB_INSTALLED") . '</p>';
		}
		else {
			$this->content .= '<p style="color:#f33;">' . GetMessage("WD_CANCEL_NO_PUB") . '!</p>';
		}
	}
}
?>