<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

if (is_array($arResult['VALUE']) && count($arResult['VALUE']) > 0)
{
	if(!CModule::IncludeModule("crm"))
		return;


		
	$arParams['ENTITY_TYPE'] = Array();
	if ($arParams['arUserField']['SETTINGS']['LEAD'] == 'Y')
		$arParams['ENTITY_TYPE'][] = 'LEAD';
	if ($arParams['arUserField']['SETTINGS']['CONTACT'] == 'Y')
		$arParams['ENTITY_TYPE'][] = 'CONTACT';
	if ($arParams['arUserField']['SETTINGS']['COMPANY'] == 'Y')
		$arParams['ENTITY_TYPE'][] = 'COMPANY';	
	if ($arParams['arUserField']['SETTINGS']['DEAL'] == 'Y')
		$arParams['ENTITY_TYPE'][] = 'DEAL';

	$arParams['PREFIX'] = false;
	if (count($arParams['ENTITY_TYPE']) > 1)
		$arParams['PREFIX'] = true;

	$arValue = Array();	
	foreach ($arResult['VALUE'] as $value)
	{
		if($arParams['PREFIX'])
		{
			$ar = explode('_', $value);
			$arValue[CUserTypeCrm::GetLongEntityType($ar[0])][] = intval($ar[1]);
		}
		else
		{
			if (is_numeric($value))
				$arValue[$arParams['ENTITY_TYPE'][0]][] = $value;
			else
			{
				$ar = explode('_', $value);
				$arValue[CUserTypeCrm::GetLongEntityType($ar[0])][] = intval($ar[1]);
			}
		}
	}

	$arResult['VALUE'] = Array();
	if ($arParams['arUserField']['SETTINGS']['LEAD'] == 'Y'
	&& isset($arValue['LEAD']) && !empty($arValue['LEAD']))
	{
		$dbRes = CCrmLead::GetList(Array('TITLE'=>'ASC', 'LAST_NAME'=>'ASC', 'NAME' => 'ASC'), array('ID' => $arValue['LEAD']));
		while ($arRes = $dbRes->Fetch())
		{
			$arResult['VALUE']['LEAD'][$arRes['ID']] = Array(
				'ENTITY_TITLE' => $arRes['TITLE'],
				'ENTITY_LINK' => CComponentEngine::MakePathFromTemplate(COption::GetOptionString('crm', 'path_to_lead_show'), array('lead_id' => $arRes['ID']))
			);
		}
	}
	if ($arParams['arUserField']['SETTINGS']['CONTACT'] == 'Y' 
	&& isset($arValue['CONTACT']) && !empty($arValue['CONTACT']))
	{
		$nameFormat = CSite::GetNameFormat(false);
		if(class_exists('Bitrix\\Crm\\Format\\PersonNameFormatter'))
		{
			$nameFormat = Bitrix\Crm\Format\PersonNameFormatter::getFormat();
		}

		$dbRes = CCrmContact::GetList(Array('LAST_NAME'=>'ASC', 'NAME' => 'ASC'), array('ID' => $arValue['CONTACT']));			
		while ($arRes = $dbRes->Fetch())
		{
			$arResult['VALUE']['CONTACT'][$arRes['ID']] = Array(
				'ENTITY_TITLE' => CUser::FormatName(
					$nameFormat,
						array(
							'LOGIN' => '',
							'NAME' => $arRes['NAME'],
							'SECOND_NAME' => $arRes['SECOND_NAME'],
							'LAST_NAME' => $arRes['LAST_NAME']
						),
					false,
					false
				),
				'ENTITY_LINK' => CComponentEngine::MakePathFromTemplate(COption::GetOptionString('crm', 'path_to_contact_show'), array('contact_id' => $arRes['ID']))
			);
		}
	}
	if ($arParams['arUserField']['SETTINGS']['COMPANY'] == 'Y'
	&& isset($arValue['COMPANY']) && !empty($arValue['COMPANY']))
	{
		$dbRes = CCrmCompany::GetList(Array('TITLE'=>'ASC'), array('ID' => $arValue['COMPANY']));			
		while ($arRes = $dbRes->Fetch())
		{
			$arResult['VALUE']['COMPANY'][$arRes['ID']] = Array(
				'ENTITY_TITLE' => $arRes['TITLE'],
				'ENTITY_LINK' => CComponentEngine::MakePathFromTemplate(COption::GetOptionString('crm', 'path_to_company_show'), array('company_id' => $arRes['ID']))
			);
		}
	}
	if ($arParams['arUserField']['SETTINGS']['DEAL'] == 'Y'
	&& isset($arValue['DEAL']) && !empty($arValue['DEAL']))
	{
		$dbRes = CCrmDeal::GetList(Array('TITLE'=>'ASC'), array('ID' => $arValue['DEAL']));			
		while ($arRes = $dbRes->Fetch())
		{
			$arResult['VALUE']['DEAL'][$arRes['ID']] = Array(
				'ENTITY_TITLE' => $arRes['TITLE'],
				'ENTITY_LINK' => CComponentEngine::MakePathFromTemplate(COption::GetOptionString('crm', 'path_to_deal_show'), array('deal_id' => $arRes['ID']))
			);
		}
	}

}

?>