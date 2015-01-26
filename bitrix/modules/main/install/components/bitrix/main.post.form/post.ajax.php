<?
define("PUBLIC_AJAX_MODE", true);
define("NO_KEEP_STATISTIC", "Y");
define("NO_AGENT_STATISTIC","Y");
define("NO_AGENT_CHECK", true);
define("DisableEventsCheck", true);

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");
header('Content-Type: application/x-javascript; charset='.LANG_CHARSET);

if (
	!CModule::IncludeModule("socialnetwork")
	|| IsModuleInstalled("b24network")
)
{
	echo CUtil::PhpToJsObject(Array('ERROR' => 'MODULE_NOT_INSTALLED'));
	die();
}
if (check_bitrix_sessid())
{	
	if (isset($_POST["nt"]))
	{
		preg_match_all("/(#NAME#)|(#LAST_NAME#)|(#SECOND_NAME#)|(#NAME_SHORT#)|(#SECOND_NAME_SHORT#)|\\s|\\,/", urldecode($_REQUEST["nt"]), $matches);
		$nameTemplate = implode("", $matches[0]);
	}
	else
	{
		$nameTemplate = CSite::GetNameFormat(false);
	}

	if (isset($_POST['LD_SEARCH']) && $_POST['LD_SEARCH'] == 'Y')
	{
		CUtil::decodeURIComponent($_POST);

		$search = $_POST['SEARCH'];
		$searchResults = array(
			'USERS' => CSocNetLogDestination::SearchUsers($search, $nameTemplate, true, ($_POST['EXTRANET_SEARCH'] == "I"), ($_POST['EXTRANET_SEARCH'] == "E"), (isset($_POST['DEPARTMENT_ID']) && intval($_POST['DEPARTMENT_ID']) > 0 ? intval($_POST['DEPARTMENT_ID']) : false))
		);

		if (isset($_POST['CRM_SEARCH']) && $_POST['CRM_SEARCH'] == 'Y' && CModule::IncludeModule('crm'))
		{
			$siteNameFormat = CSite::GetNameFormat(false);

			$dbContacts = CCrmContact::GetListEx(
				$arOrder = array(),
				$arFilter = array('%FULL_NAME' => $search),
				$arGroupBy = false,
				$arNavStartParams = array('nTopCount' => 20),
				$arSelectFields = array('ID', 'NAME', 'SECOND_NAME', 'LAST_NAME', 'COMPANY_TITLE', 'PHOTO')
			);
			$arContacts = array();
			while ($dbContacts && ($arContact = $dbContacts->fetch()))
			{
				$arContacts['CRMCONTACT'.$arContact['ID']] = array(
					'id'         => 'CRMCONTACT'.$arContact['ID'],
					'entityType' => 'contacts',
					'entityId'   => $arContact['ID'],
					'name'       => htmlspecialcharsbx(CUser::FormatName(
						$siteNameFormat,
						array(
							'LOGIN'       => '',
							'NAME'        => $arContact['NAME'],
							'SECOND_NAME' => $arContact['SECOND_NAME'],
							'LAST_NAME'   => $arContact['LAST_NAME']
						),
						false, false
					)),
					'desc' => htmlspecialcharsbx($arContact['COMPANY_TITLE'])
				);

				if (!empty($arContact['PHOTO']) && intval($arContact['PHOTO']) > 0)
				{
					$arImg = CFile::ResizeImageGet($arContact['PHOTO'], array('width' => 30, 'height' => 30), BX_RESIZE_IMAGE_EXACT);
					$arContacts['CRMCONTACT'.$arContact['ID']]['avatar'] = $arImg['src'];
				}
			}

			$arCompanyTypeList = CCrmStatus::GetStatusListEx('COMPANY_TYPE');
			$arCompanyIndustryList = CCrmStatus::GetStatusListEx('INDUSTRY');
			$dbCompanies = CCrmCompany::GetListEx(
				$arOrder = array(),
				$arFilter = array('%TITLE' => $search),
				$arGroupBy = false,
				$arNavStartParams = array('nTopCount' => 20),
				$arSelectFields = array('ID', 'TITLE', 'COMPANY_TYPE', 'INDUSTRY',  'LOGO')
			);
			$arCompanies = array();
			while ($dbCompanies && ($arCompany = $dbCompanies->fetch()))
			{
				$arDesc = Array();
				if (isset($arCompanyTypeList[$arCompany['COMPANY_TYPE']]))
					$arDesc[] = $arCompanyTypeList[$arCompany['COMPANY_TYPE']];
				if (isset($arCompanyIndustryList[$arCompany['INDUSTRY']]))
					$arDesc[] = $arCompanyIndustryList[$arCompany['INDUSTRY']];

				$arCompanies['CRMCOMPANY'.$arCompany['ID']] = array(
					'id'         => 'CRMCOMPANY'.$arCompany['ID'],
					'entityId'   => $arCompany['ID'],
					'entityType' => 'companies',
					'name'       => htmlspecialcharsbx(str_replace(array(';', ','), ' ', $arCompany['TITLE'])),
					'desc'       => htmlspecialcharsbx(implode(', ', $arDesc))
				);

				if (!empty($arCompany['LOGO']) && intval($arCompany['LOGO']) > 0)
				{
					$arImg = CFile::ResizeImageGet($arCompany['LOGO'], array('width' => 30, 'height' => 30), BX_RESIZE_IMAGE_EXACT);
					$arCompanies['CRMCOMPANY'.$arCompany['ID']]['avatar'] = $arImg['src'];
				}
			}

			$dbLeads = CCrmLead::GetListEx(
				$arOrder = array(),
				$arFilter = array('LOGIC' => 'OR', '%FULL_NAME' => $search, '%TITLE' => $search),
				$arGroupBy = false,
				$arNavStartParams = array('nTopCount' => 20),
				$arSelectFields = array('ID', 'TITLE', 'NAME', 'SECOND_NAME', 'LAST_NAME', 'STATUS_ID')
			);
			$arLeads = array();
			while ($dbLeads && ($arLead = $dbLeads->fetch()))
			{
				$arLeads['CRMLEAD'.$arLead['ID']] = array(
					'id'         => 'CRMLEAD'.$arLead['ID'],
					'entityId'   => $arLead['ID'],
					'entityType' => 'leads',
					'name'       => htmlspecialcharsbx($arLead['TITLE']),
					'desc'       => htmlspecialcharsbx(CUser::FormatName(
						$siteNameFormat,
						array(
							'LOGIN'       => '',
							'NAME'        => $arLead['NAME'],
							'SECOND_NAME' => $arLead['SECOND_NAME'],
							'LAST_NAME'   => $arLead['LAST_NAME']
						),
						false, false
					))
				);
			}

			$dbDeals = CCrmDeal::GetListEx(
				$arOrder = array(),
				$arFilter = array('%TITLE' => $search),
				$arGroupBy = false,
				$arNavStartParams = array('nTopCount' => 20),
				$arSelectFields = array('ID', 'TITLE', 'COMPANY_TITLE', 'CONTACT_NAME', 'CONTACT_SECOND_NAME', 'CONTACT_LAST_NAME')
			);
			$arDeals = array();
			while ($dbDeals && ($arDeal = $dbDeals->fetch()))
			{
				$arDesc = array();
				if ($arDeal['COMPANY_TITLE'] != '')
					$arDesc[] = $arDeal['COMPANY_TITLE'];
				$arDesc[] = CUser::FormatName(
					$siteNameFormat,
					array(
						'LOGIN'       => '',
						'NAME'        => $arDeal['CONTACT_NAME'],
						'SECOND_NAME' => $arDeal['CONTACT_SECOND_NAME'],
						'LAST_NAME'   => $arDeal['CONTACT_LAST_NAME']
					),
					false, false
				);

				$arDeals['CRMDEAL'.$arDeal['ID']] = array(
					'id'         => 'CRMDEAL'.$arDeal['ID'],
					'entityId'   => $arDeal['ID'],
					'entityType' => 'deals',
					'name'       => htmlspecialcharsbx($arDeal['TITLE']),
					'desc'       => htmlspecialcharsbx(implode(', ', $arDesc))
				);
			}

			$searchResults['CONTACTS'] = $arContacts;
			$searchResults['COMPANIES'] = $arCompanies;
			$searchResults['LEADS'] = $arLeads;
			$searchResults['DEALS'] = $arDeals;
		}

		echo CUtil::PhpToJsObject($searchResults);
	}
	elseif ($_POST['LD_DEPARTMENT_RELATION'] == 'Y')
	{			
		echo CUtil::PhpToJsObject(Array(
			'USERS' => CSocNetLogDestination::GetUsers(Array('deportament_id' => $_POST['DEPARTMENT_ID'], "NAME_TEMPLATE" => $nameTemplate)), 
		));
	}
	else
	{
		echo CUtil::PhpToJsObject(Array('ERROR' => 'UNKNOWN_ERROR'));
	}
}
else
{
	echo CUtil::PhpToJsObject(Array('ERROR' => 'SESSION_ERROR'));
}
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");
?>