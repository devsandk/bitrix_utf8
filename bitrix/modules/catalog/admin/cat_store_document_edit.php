<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/catalog/prolog.php");

if(!($USER->CanDoOperation('catalog_read') || $USER->CanDoOperation('catalog_store')))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
CModule::IncludeModule("catalog");
$bReadOnly = !$USER->CanDoOperation('catalog_store');

IncludeModuleLangFile(__FILE__);

if ($ex = $APPLICATION->GetException())
{
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	$strError = $ex->GetString();
	ShowError($strError);
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
	die();
}

$ID = 0;
if (isset($_REQUEST['ID']))
	$ID = (int)$_REQUEST['ID'];
if ($ID < 0)
	$ID = 0;

$userId = (int)$USER->GetID();
$docType = '';
if (isset($_REQUEST["DOCUMENT_TYPE"]))
{
	$docType = (string)$_REQUEST['DOCUMENT_TYPE'];
}
$arSitesShop = array();
$arSitesTmp = array();
$rsSites = CSite::GetList($_REQUEST["by"] = "id", $_REQUEST["order"] = "asc", array("ACTIVE" => "Y"));
while ($arSite = $rsSites->GetNext())
{
	$site = COption::GetOptionString("sale", "SHOP_SITE_".$arSite["ID"], "");
	if ($arSite["ID"] == $site)
	{
		$arSitesShop[] = array("ID" => $arSite["ID"], "NAME" => $arSite["NAME"]);
	}
	$arSitesTmp[] = array("ID" => $arSite["ID"], "NAME" => $arSite["NAME"]);
}

$rsCount = count($arSitesShop);
if($rsCount <= 0)
{
	$arSitesShop = $arSitesTmp;
	$rsCount = count($arSitesShop);
}
$rsContractors = CCatalogContractor::GetList();
$arContractors = array();
while($arContractor = $rsContractors->Fetch())
{
	$arContractors[] = $arContractor;
}
$arMeasureCode = $arResult = array();
$arStores = array();
$rsStores = CCatalogStore::GetList(array(), array("ACTIVE" => "Y"));
while($arStore = $rsStores->GetNext())
{
	$arStores[$arStore["ID"]] = $arStore;
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && strlen($_REQUEST["Update"]) > 0 && !$bReadOnly && check_bitrix_sessid())
{
	if (!$_REQUEST["cancellation"] && ($_REQUEST["save_document"] || $_REQUEST["save_and_conduct"]))
	{
		$contractorId = intval($_REQUEST["CONTRACTOR_ID"]);
		$currency = '';
		$result = array();
		$docId = 0;
		if($_REQUEST["CAT_CURRENCY_STORE"])
			$currency = $_REQUEST["CAT_CURRENCY_STORE"];

		$arGeneral = array(
			"DOC_TYPE" => $docType,
			"SITE_ID" => $_REQUEST["SITE_ID"],
			"DATE_DOCUMENT" => $_REQUEST["DOC_DATE"],
			"CREATED_BY" => $userId,
			"MODIFIED_BY" => $userId,
			"COMMENTARY" => $_REQUEST["CAT_DOC_COMMENTARY"],
		);
		if($contractorId > 0)
			$arGeneral["CONTRACTOR_ID"] = $contractorId;
		if(strlen($currency) > 0)
			$arGeneral["CURRENCY"] = $currency;
		if(strlen($_REQUEST["CAT_DOCUMENT_SUM"]) > 0)
			$arGeneral["TOTAL"] = doubleval($_REQUEST["CAT_DOCUMENT_SUM"]);

		if($ID > 0)
		{
			unset($arGeneral['CREATED_BY']);
			if(CCatalogDocs::update($ID, $arGeneral))
				$docId = $ID;
		}
		else
			$ID = $docId = CCatalogDocs::add($arGeneral);
		if($ID > 0)
		{
			$dbElement = CCatalogStoreDocsElement::getList(array(), array("DOC_ID" => $ID), false, false, array("ID"));
			while($arElement = $dbElement->Fetch())
			{
				CCatalogStoreDocsElement::delete($arElement["ID"]);
				$dbDocsBarcode = CCatalogStoreDocsBarcode::getList(array(), array("DOC_ELEMENT_ID" => $arElement["ID"]), false, false, array("ID"));
				while($arDocsBarcode = $dbDocsBarcode->Fetch())
					CCatalogStoreDocsBarcode::delete($arDocsBarcode["ID"]);
			}
		}
		if(isset($_POST["PRODUCT"]) && is_array($_POST["PRODUCT"]) && $docId)
		{
			$arProducts = ($_POST["PRODUCT"]);
			foreach($arProducts as $key => $val)
			{
				$storeTo = $val["STORE_TO"];
				$storeFrom = $val["STORE_FROM"];

				$arAdditional = Array(
					"AMOUNT" => $val["AMOUNT"],
					"ELEMENT_ID" => $val["PRODUCT_ID"],
					"PURCHASING_PRICE" => $val["PURCHASING_PRICE"],
					"STORE_TO" => $storeTo,
					"STORE_FROM" => $storeFrom,
					"ENTRY_ID" => $key,
					"DOC_ID" => $docId,
				);

				$docElementId = CCatalogStoreDocsElement::add($arAdditional);
				if($docElementId && isset($val["BARCODE"]))
				{
					$arBarcode = array();
					if(!empty($val["BARCODE"]))
					{
						$arBarcode = explode(', ', $val["BARCODE"]);
					}
					if(!empty($arBarcode))
					{
						foreach($arBarcode as $barCode)
						{
							CCatalogStoreDocsBarcode::add(array("BARCODE" => $barCode, "DOC_ELEMENT_ID" => $docElementId));
						}
					}
				}
			}
		}

		if($_REQUEST["save_document"] && $docId)
		{
			LocalRedirect("/bitrix/admin/cat_store_document_edit.php?ID=".$docId."&lang=".LANGUAGE_ID."&".GetFilterParams("filter_", false));
		}
	}

	if ($_REQUEST["save_and_conduct"] || $_REQUEST["cancellation"])
	{
		$result = false;
		$DB->StartTransaction();

		if($_REQUEST["save_and_conduct"])
		{
			$result = CCatalogDocs::conductDocument($ID, $userId);
		}
		elseif($_REQUEST["cancellation"])
		{
			$result = CCatalogDocs::cancellationDocument($ID, $userId);
		}

		if($result == true)
			$DB->Commit();
		else
			$DB->Rollback();

		if($ex = $APPLICATION->GetException())
		{
			$TAB_TITLE = GetMessage("CAT_DOC_".$docType);
			if($bReadOnly)
				$APPLICATION->SetTitle(str_replace("#ID#", $ID, GetMessage("CAT_DOC_TITLE_VIEW")).". ".$TAB_TITLE.".");
			else
				$APPLICATION->SetTitle(str_replace("#ID#", $ID, GetMessage("CAT_DOC_TITLE_EDIT")).". ".$TAB_TITLE.".");
			require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
			$strError = $ex->GetString();
			if(!empty($result) && is_array($result))
			{
				$strError .= CCatalogStoreControlUtil::showErrorProduct($result);
			}
			CAdminMessage::ShowMessage($strError);
			$bVarsFromForm = true;
		}
		else
			LocalRedirect("/bitrix/admin/cat_store_document_list.php?lang=".LANGUAGE_ID."&".GetFilterParams("filter_", false));
	}
}
ClearVars();
if($ID > 0)
{
	$arSelect = array(
		"ID",
		"SITE_ID",
		"DOC_TYPE",
		"CONTRACTOR_ID",
		"DATE_DOCUMENT",
		"CURRENCY",
		"STATUS",
		"COMMENTARY",
	);

	$dbResult = CCatalogDocs::getList(array(),array('ID' => $ID), false, false, $arSelect);
	if (!$dbResult->ExtractFields("str_"))
		$ID = 0;
	else
	{
		$docType = $str_DOC_TYPE;
		$bReadOnly = ($str_STATUS == 'Y') ? true : $bReadOnly;
	}
}

$requiredFields = CCatalogStoreControlUtil::getFields($docType);
if(!$requiredFields || $_REQUEST["dontsave"])
{
	LocalRedirect("/bitrix/admin/cat_store_document_list.php?lang=".LANGUAGE_ID."&".GetFilterParams("filter_", false));
}

$sTableID = "b_catalog_store_docs_".$docType;
$oSort = new CAdminSorting($sTableID, "ID", "asc");
$lAdmin = new CAdminList($sTableID, $oSort);

$isDocumentConduct = false;

if($ID > 0 || isset($_REQUEST["AJAX_MODE"]))
{
	if($ID > 0)
	{
		$dbDocument = CCatalogDocs::getList(array(), array("ID" => $ID), false, false, array("DOC_TYPE", "SITE_ID", "CONTRACTOR_ID", "CURRENCY", "TOTAL", "STATUS"));
		if($arDocument = $dbDocument->Fetch())
		{
			$isDocumentConduct = ($arDocument["STATUS"] == 'Y') ? true : false;
			$arAllDocumentElement = array();
			foreach($arDocument as $key => $value)
			{
				$arResult[$key] = $value;
			}
			$arResult["DATE_DOCUMENT"] = 'now';
			$arResult["CREATED_BY"] = $arResult["MODIFIED_BY"] = $USER->GetID();
			$bReadOnly = ($arDocument["STATUS"] == 'Y') ? true : $bReadOnly;
		}
	}
	if(!isset($_REQUEST["AJAX_MODE"]))
	{
		$dbDocumentElement = CCatalogStoreDocsElement::getList(array(), array("DOC_ID" => $ID), false, false, array("ID", "STORE_FROM", "STORE_TO", "ELEMENT_ID", "AMOUNT", "PURCHASING_PRICE", "IS_MULTIPLY_BARCODE", "RESERVED"));
		while($arDocumentElements = $dbDocumentElement->Fetch())
		{
			$arAllDocumentElement[] = $arDocumentElements;
		}
	}
	elseif(isset($_REQUEST["PRODUCT"]) && is_array($_REQUEST["PRODUCT"]) || isset($_REQUEST["ELEMENT_ID"]))
	{
		$arElements = array();
		if(isset($_REQUEST["PRODUCT"]) && is_array($_REQUEST["PRODUCT"]))
			$arElements = $_REQUEST["PRODUCT"];
		if(isset($_REQUEST["ELEMENT_ID"]) && is_array($_REQUEST["ELEMENT_ID"]))
		{
			$arElements[] = array("PRODUCT_ID" => $_REQUEST["ELEMENT_ID"][0], "SELECTED_BARCODE" => $_REQUEST["HIDDEN_BARCODE"][0], "AMOUNT" => $_REQUEST["HIDDEN_QUANTITY"][0]);
		}
		$arAllAddedProductsId = $arAjaxElementInfo = array();
		foreach($arElements as $eachAddElement)
		{
			if(isset($eachAddElement["PRODUCT_ID"]))
			{
				$arAllAddedProductsId[] = intval($eachAddElement["PRODUCT_ID"]);
			}
		}
		$dbElement = CCatalogProduct::GetList(
			array(),
			array("ID" => $arAllAddedProductsId),
			false,
			false,
			array("ID", "BARCODE_MULTI", "QUANTITY_RESERVED", 'PURCHASING_PRICE', 'PURCHASING_CURRENCY')
		);
		while($arElement = $dbElement->Fetch())
		{
			$arAjaxElementInfo[$arElement["ID"]]["IS_MULTIPLY_BARCODE"] = $arElement["BARCODE_MULTI"];
			$arAjaxElementInfo[$arElement["ID"]]["RESERVED"] = $arElement["QUANTITY_RESERVED"];
			$arAjaxElementInfo[$arElement["ID"]]["PURCHASING_PRICE"] = $arElement["PURCHASING_PRICE"];
			$arAjaxElementInfo[$arElement["ID"]]["PURCHASING_CURRENCY"] = $arElement["PURCHASING_CURRENCY"];
		}
		foreach($arElements as &$arAjaxElement)
		{
			$arAjaxElement["ELEMENT_ID"] = $arAjaxElement["PRODUCT_ID"];
			if($arAjaxElement["SELECTED_BARCODE"] == '')
				$arAjaxElement["SELECTED_BARCODE"] = $arAjaxElement["BARCODE"];
			$arAjaxElement["BARCODE"] = array($arAjaxElement["BARCODE"]);
			$arAjaxElement["IS_MULTIPLY_BARCODE"] = $arAjaxElementInfo[$arAjaxElement["PRODUCT_ID"]]["IS_MULTIPLY_BARCODE"];
			$arAjaxElement["RESERVED"] = $arAjaxElementInfo[$arAjaxElement["PRODUCT_ID"]]["RESERVED"];
			if (0 < doubleval($arAjaxElementInfo[$arAjaxElement["PRODUCT_ID"]]["PURCHASING_PRICE"]))
			{
				$arAjaxElement["PURCHASING_PRICE"] = $arAjaxElementInfo[$arAjaxElement["PRODUCT_ID"]]["PURCHASING_PRICE"];
				$arAjaxElement["PURCHASING_CURRENCY"] = $arAjaxElementInfo[$arAjaxElement["PRODUCT_ID"]]["PURCHASING_CURRENCY"];
			}
		}
		if (isset($arAjaxElement))
			unset($arAjaxElement);

		$arAllDocumentElement = $arElements;
	}

	foreach($arAllDocumentElement as $arDocumentElement)
	{
		$arElement = $arElementBarcode = array();
		$isMultiSingleBarcode = $selectedBarcode = false;
		foreach($arDocumentElement as $key => $value)
		{
			$arElement[$key] = $value;
		}

		if($arDocumentElement["IS_MULTIPLY_BARCODE"] == 'N')
		{
			if(isset($arElement["BARCODE"]))
				unset($arElement["BARCODE"]);
			$dbDocumentStoreBarcode = CCatalogStoreBarCode::getList(array(), array("PRODUCT_ID" => $arDocumentElement["ELEMENT_ID"]));
			while($arDocumentStoreBarcode = $dbDocumentStoreBarcode->Fetch())
			{
				$arElementBarcode[] = $arDocumentStoreBarcode["BARCODE"];
			}
			if(count($arElementBarcode) > 1)
			{
				$isMultiSingleBarcode = true;

				if($bReadOnly)
					$arElementBarcode = array();
			}
		}

		if($arDocumentElement["IS_MULTIPLY_BARCODE"] == 'Y' || $isMultiSingleBarcode)
		{
			$dbDocumentElementBarcode = CCatalogStoreDocsBarcode::getList(array(), array("DOC_ELEMENT_ID" => $arDocumentElement["ID"]), false, false, array("BARCODE"));
			while($arDocumentElementBarcode = $dbDocumentElementBarcode->Fetch())
			{
				if($isMultiSingleBarcode)
				{
					$selectedBarcode = $arDocumentElementBarcode["BARCODE"];
					if(empty($arElementBarcode))
						$arElementBarcode[] = $arDocumentElementBarcode["BARCODE"];
				}
				else
				{
					$arElementBarcode[] = $arDocumentElementBarcode["BARCODE"];
				}
			}
		}

		if(!isset($arElement["BARCODE"]))
			$arElement["BARCODE"] = $arElementBarcode;
		if(!isset($arElement["SELECTED_BARCODE"]))
			$arElement["SELECTED_BARCODE"] = $selectedBarcode;
		$arResult["ELEMENT"][] = $arElement;
	}
}
$aContext = array();
if(!$bReadOnly)
{
	$aContext = array(
		/*array(
			"TEXT" => GetMessage("CAT_DOC_ADD_ITEMS"),
			"ICON" => "btn_new",
			"LINK" => "cat_store_edit.php?lang=".LANGUAGE_ID,
			"TITLE" => GetMessage("CAT_DOC_ADD_ITEMS")
		),*/
		array(
			"TEXT" => GetMessage("CAT_DOC_FIND_ITEMS"),
			"ICON" => "btn_new",
			"TITLE" => GetMessage("CAT_DOC_FIND_ITEMS"),
			"ONCLICK" => "addProductSearch(1);",
		),
		array(
			"HTML" => GetMessage("CAT_DOC_LINK_FIND", array("#LINK#" => "<a href=\"javascript:void(0);\" onClick=\"findBarcodeDivHider()\">".GetMessage('CAT_DOC_BARCODE_FIND_LINK')."</a>")),
		),
		array(
			"HTML" => '<div id="cat_barcode_find_div" style="display: none;">'.
						'<input type="text" id="CAT_DOC_BARCODE_FIND" style="margin: 0 10px;">'.
						'<a href="javascript:void(0);" class="adm-btn" onclick="productSearch(BX(\'CAT_DOC_BARCODE_FIND\').value);">'.GetMessage('CAT_DOC_BARCODE_FIND').'</a>'.
						'</div>',
		),
	);
}

$arHeaders = array(
	array(
		"id" => "IMAGE",
		"content" => GetMessage("CAT_DOC_PRODUCT_PICTURE"),
		"default" => true
	),
	array(
		"id" => "TITLE",
		"content" => GetMessage("CAT_DOC_PRODUCT_NAME"),
		"default" => true
	),
);
if(isset($requiredFields["RESERVED"]))
{
	$arHeaders[] = array(
		"id" => "RESERVED",
		"content" => GetMessage("CAT_DOC_PRODUCT_RESERVED"),
		"default" => ($requiredFields["RESERVED"]["required"] == 'Y') ? true : false
	);
}
if(isset($requiredFields["AMOUNT"]))
{
	$arHeaders[] = array(
		"id" => "AMOUNT",
		"content" => GetMessage("CAT_DOC_PRODUCT_AMOUNT"),
		"default" => $requiredFields["AMOUNT"]["required"],
	);
}
if(isset($requiredFields["NET_PRICE"]))
{
	$arHeaders[] = array(
		"id" => "PURCHASING_PRICE",
		"content" => GetMessage("CAT_DOC_PRODUCT_PRICE"),
		"default" => ($requiredFields["NET_PRICE"]["required"] == 'Y') ? true : false
	);
}
if(isset($requiredFields["TOTAL"]))
{
	$arHeaders[] = array(
		"id" => "SUMM",
		"content" => GetMessage("CAT_DOC_PRODUCT_SUMM"),
		"default" => ($requiredFields["TOTAL"]["required"] == 'Y') ? true : false
	);
}
if(isset($requiredFields["STORE_FROM"]))
{
	$arHeaders[] = array(
		"id" => "STORE_FROM",
		"content" => GetMessage("CAT_DOC_STORE_FROM"),
		"default" => ($requiredFields["STORE_FROM"]["required"] == 'Y') ? true : false
	);
}
if(isset($requiredFields["STORE_TO"]))
{
	$arHeaders[] = array(
		"id" => "STORE_TO",
		"content" => GetMessage("CAT_DOC_STORE_TO"),
		"default" => ($requiredFields["STORE_TO"]["required"] == 'Y') ? true : false
	);
}
if(isset($requiredFields["BAR_CODE"]))
{
	$arHeaders[] = array(
		"id" => "BARCODE",
		"content" => GetMessage("CAT_DOC_BARCODE"),
		"default" => ($requiredFields["BAR_CODE"]["required"] == 'Y') ? true : false
	);
}

$lAdmin->AddHeaders($arHeaders);

$isDisable = $bReadOnly ? " disabled" : "";
$maxId = 0;
if(is_array($arResult["ELEMENT"]))
{
	foreach($arResult["ELEMENT"] as $code => $value)
	{
		$storesTo = $storesFrom = '';
		$isMultiply = 'Y' == $value["IS_MULTIPLY_BARCODE"];
		$arProductInfo = CCatalogStoreControlUtil::getProductInfo($value["ELEMENT_ID"]);
		if(is_array($arProductInfo))
			$value = array_merge($value, $arProductInfo);

		$arRes['ID'] = intval($code);
		$maxId = ($arRes['ID'] > $maxId) ? $arRes['ID'] : $maxId;
		foreach($arStores as $key => $val)
		{
			$selectedTo = ($value['STORE_TO'] == $val['ID']) ? " selected " : " ";
			$selectedFrom = ($value['STORE_FROM'] == $val['ID']) ? " selected " : " ";
			$store = ($val["TITLE"] != '') ? $val["TITLE"]." (".$val["ADDRESS"].")" : $val["ADDRESS"];
			$storesTo .= '<option'.$selectedTo.'value="'.$val['ID'].'">'.$store.'</option>';
			$storesFrom .= '<option'.$selectedFrom.'value="'.$val['ID'].'">'.$store.'</option>';
		}
		$arRows[$arRes['ID']] = $row =& $lAdmin->AddRow($arRes['ID']);
		$row->AddViewField("IMAGE", CFile::ShowImage($value['DETAIL_PICTURE'], 80, 80, "border=0", "", true));
		$row->AddViewField("TITLE", '<a href ="'.$value['EDIT_PAGE_URL'].'"> '.$value['NAME'].'</a><input value="'.$value['ELEMENT_ID'].'" type="hidden" name="PRODUCT['.$arRes['ID'].'][PRODUCT_ID]" id="PRODUCT_ID_'.$arRes['ID'].'">');
		$readOnly = ($isMultiply && !$bReadOnly) ? ' readonly' : '';
		if(isset($value['BARCODE']) && $isMultiply)
		{
			$barcodeCount = 0;
			$tmpBarcodeCount = count($value['BARCODE']);
			if (1 < $tmpBarcodeCount)
			{
				$barcodeCount = $tmpBarcodeCount;
			}
			elseif (1 == $tmpBarcodeCount)
			{
				if (isset($value['BARCODE'][0]) && $value['BARCODE'][0] != '')
					$barcodeCount = count(explode(', ', $value['BARCODE'][0]));
			}
			unset($tmpBarcodeCount);
		}
		elseif(!$isMultiply)
		{
			$barcodeCount = count($value['BARCODE']);
		}
		else
		{
			$barcodeCount = $value['AMOUNT'];
		}
		if(isset($requiredFields["AMOUNT"]))
			$row->AddViewField("AMOUNT", '<div><input type="hidden" id="CAT_DOC_AMOUNT_HIDDEN_'.$arRes['ID'].'" value="'.$barcodeCount.'" onchange="recalculateSum('.$arRes['ID'].');"> <input name="PRODUCT['.$arRes['ID'].'][AMOUNT]" onchange="recalculateSum('.$arRes['ID'].');" id="CAT_DOC_AMOUNT_'.$arRes['ID'].'" value="'.$value['AMOUNT'].'" type="text" size="10"'.$isDisable.'></div>', array("size" => 15));
		if(isset($requiredFields["NET_PRICE"]))
			$row->AddViewField("PURCHASING_PRICE", '<div> <input name="PRODUCT['.$arRes['ID'].'][PURCHASING_PRICE]" onchange="recalculateSum('.$arRes['ID'].');" id="CAT_DOC_PURCHASING_PRICE_'.$arRes['ID'].'" value="'.$value['PURCHASING_PRICE'].'" type="text" size="10"'.$isDisable.'></div>');
		if(isset($requiredFields["TOTAL"]))
			$row->AddViewField("SUMM", '<div id="CAT_DOC_SUMM_'.$arRes['ID'].'">'.doubleval($value['AMOUNT']) * doubleval($value['PURCHASING_PRICE']).'</div><input value="'.doubleval($value['AMOUNT']) * doubleval($value['PURCHASING_PRICE']).'" type="hidden" name="PRODUCT['.$arRes['ID'].'][SUMM]" id="PRODUCT['.$arRes['ID'].'][SUMM]">');
		if(isset($requiredFields["STORE_FROM"]))
			$row->AddViewField("STORE_FROM", '<select style="max-width:300px; width:300px;" name="PRODUCT['.$arRes['ID'].'][STORE_FROM]" id="CAT_DOC_STORE_FROM_'.$arRes['ID'].'"'.$isDisable.'>'.$storesFrom.'</select>');
		if(isset($requiredFields["STORE_TO"]))
			$row->AddViewField("STORE_TO", '<select style="max-width:300px; width:300px;" name="PRODUCT['.$arRes['ID'].'][STORE_TO]" id="CAT_DOC_STORE_TO_'.$arRes['ID'].'"'.$isDisable.'>'.$storesTo.'</select>');
		if(isset($requiredFields["RESERVED"]))
			$row->AddViewField("RESERVED", '<div > <input readonly name="PRODUCT['.$arRes['ID'].'][RESERVED]" id="CAT_DOC_RESERVED_'.$arRes['ID'].'" value="'.$value['RESERVED'].'" type="text" size="10"'.$isDisable.'></div>');
		if(isset($requiredFields["BAR_CODE"]) && isset($value['BARCODE']) && is_array($value['BARCODE']))
		{
			$barcode = implode(", ", $value['BARCODE']);
			if($isMultiply)
			{
				$readOnly = ($bReadOnly) ? ' readonly' : '';
				$buttonValue = ($bReadOnly) ? GetMessage('CAT_DOC_BARCODES_VIEW') : GetMessage('CAT_DOC_BARCODES_ENTER');
				if(empty($barcode))
					$barcode = '';//GetMessage('CAT_DOC_POPUP_TITLE');
				$inputBarcode = '<input type="button" value="'.$buttonValue.'" onclick="enterBarcodes('.$arRes['ID'].');"><input '.$readOnly.' type="hidden" value="'.$barcode.'" type="text" name="PRODUCT['.$arRes['ID'].'][BARCODE]" id="PRODUCT['.$arRes['ID'].'][BARCODE]" onchange="recalculateSum('.$arRes['ID'].');" size="20">';
			}
			elseif(count($value['BARCODE']) < 2)
				$inputBarcode = $barcode;
			else
			{
				$inputBarcode = '<select style="max-width:150px; width:150px;" id="PRODUCT['.$arRes['ID'].'][BARCODE]" name="PRODUCT['.$arRes['ID'].'][BARCODE]"> ';
				foreach($value['BARCODE'] as $singleCode)
				{
					$selected = ($value["SELECTED_BARCODE"] == $singleCode) ? ' selected' : '';
					$inputBarcode .= '<option value="'.$singleCode.'"'.$selected.'>'.$singleCode.'</option>';
				}
				$inputBarcode .= '</select>';
			}
			$row->AddViewField("BARCODE", '<div id="CAT_BARCODE_DIV_BIND_'.$arRes['ID'].'" align="center">'.$inputBarcode.'</div>');
		}
		$arActions = array();
		$arActions[] = array("ICON"=>"delete", "TEXT"=>GetMessage("CAT_DOC_DEL"), "ACTION"=>"if(confirm('".GetMessageJS('CAT_DOC_CONFIRM_DELETE')."')) deleteRow(".$arRes['ID'].")");
		$arActions[] = array("ICON"=>"copy", "TEXT"=>GetMessage("CAT_DOC_COPY"), "ACTION"=>"addRow(null, ".CUtil::PhpToJSObject(array('id' => $value["ELEMENT_ID"], 'parent' => $arRes['ID'])).", null)");
		$row->AddActions($arActions);
		$row->bReadOnly = true;
	}
}

if(isset($row))
	unset($row);

$lAdmin->AddGroupActionTable(
	array(
		'summ' => array(
			'type' => 'html',
			'value' => ''
		)
	),
	array("disable_action_target" => true)
);


$lAdmin->AddAdminContextMenu($aContext, false, true);
$lAdmin->CheckListMode();
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/catalog/prolog.php");

$errorMessage = "";
$bVarsFromForm = false;

$TAB_TITLE = GetMessage("CAT_DOC_".$docType);
if($ID > 0)
{
	if($bReadOnly)
	{
		$APPLICATION->SetTitle(str_replace("#ID#", $ID, GetMessage("CAT_DOC_TITLE_VIEW")).". ".$TAB_TITLE.".");
	}
	else
	{
		$APPLICATION->SetTitle(str_replace("#ID#", $ID, GetMessage("CAT_DOC_TITLE_EDIT")).". ".$TAB_TITLE.".");
	}
}
else
	$APPLICATION->SetTitle(GetMessage("CAT_DOC_NEW").". ".$TAB_TITLE);

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$APPLICATION->SetAdditionalCSS('/bitrix/panel/catalog/catalog_store_docs.css');

if($bVarsFromForm)
	$DB->InitTableVarsForEdit("b_catalog_measure", "", "str_");

$aMenu = array(
	array(
		"TEXT" => GetMessage("CAT_DOC_LIST"),
		"ICON" => "btn_list",
		"LINK" => "/bitrix/admin/cat_store_document_list.php?lang=".LANGUAGE_ID."&".GetFilterParams("filter_", false)
	)
);

$context = new CAdminContextMenu($aMenu);
$context->Show();

CAdminMessage::ShowMessage($errorMessage);
?>
<script type="text/javascript">
function showTotalSum()
{
	<?if(isset($requiredFields["TOTAL"])):?>
	if(BX('<?=$sTableID?>'))
	{
		if(BX('<?=$sTableID?>'+'_footer'))
		{
			BX('<?=$sTableID?>'+'_footer').appendChild((BX.create('DIV', {
				props : {
					id : "CAT_DOCUMENT_SUMM"
				},
				style : {
					paddingLeft: '30%',
					marginTop: '5px',
					verticalAlign: 'middle',
					display: 'inline-block'
				},
				children : [
					BX.create('span', {
						props : {
							id : "CAT_DOCUMENT_SUMM_SPAN"
						},
						text : '<?=GetMessageJS('CAT_DOC_TOTAL')?>',
						style : {
							fontSize: '14px',
							fontWeight: 'bold'
						}
					}),
					BX.create('input', {
						props : {
							type : "hidden",
							name : "CAT_DOCUMENT_SUM",
							id : "CAT_DOCUMENT_SUM",
							value : 0
						}
					})
				]
			})));
			var maxId = BX('ROW_MAX_ID').value;
			for(var i = 0; i <= maxId; i++)
			{
				recalculateSum(i);
			}
		}
	}
	<?endif;?>
}

function deleteRow(id)
{
	if(BX('PRODUCT_ID_'+id))
	{
		var trDelete = (BX('PRODUCT_ID_'+id).parentNode.parentNode);
		if(trDelete)
		{
			trDelete.parentNode.removeChild(trDelete);
			recalculateSum(0);
		}
	}
}

function findBarcodeDivHider()
{
	var findBarcodeDiv = BX('cat_barcode_find_div');
	if(findBarcodeDiv)
	{
		if(findBarcodeDiv.style.display == 'none')
		{
			findBarcodeDiv.style.display = 'block';
			BX('CAT_DOC_BARCODE_FIND').focus();
		}
		else
			findBarcodeDiv.style.display = 'none'
	}
}

function addProductSearch(index)
{
	var quantity = 1;
	var store = 0;
	var lid = '';
	if(BX("CAT_DOC_STORE_FROM"))
		store = BX("CAT_DOC_STORE_FROM").value;
	if(BX("SITE_ID"))
		lid = BX("SITE_ID").value;
	window.open('/bitrix/admin/cat_store_product_search.php?lang=<?=LANGUAGE_ID?>&LID='+lid+'&addDefault=N&func_name=addRow&index=' + index + '&QUANTITY=' + quantity + '&STORE_FROM_ID=' + store + '&caller=storeDocs', '', 'scrollbars=yes,resizable=yes,width=1080,height=550,top='+parseInt((screen.height - 500)/2-14)+',left='+parseInt((screen.width - 900)/2-5));
}

function addRow(index, arElement, iblockId)
{
	var hiddenDiv = BX('ELEMENT_ID_DIV');
	if(hiddenDiv == null)
	{
		hiddenDiv = BX('form_b_catalog_store_docs').appendChild(BX.create(
			'DIV',
			{
				props: {
					id: 'ELEMENT_ID_DIV',
					name: 'ELEMENT_ID_DIV'
				}
			}
		));
	}

	if(!arElement.quantity && arElement.parent)
	{
		arElement.quantity = BX('CAT_DOC_AMOUNT_'+arElement.parent).value;
	}
	var hidden = hiddenDiv.appendChild(BX.create(
		'INPUT',
		{
			props: {
				type: 'hidden',
				name: 'ELEMENT_ID[]',
				value: arElement.id
			},
			html: '<input type="hidden" name="HIDDEN_BARCODE[]" value="' + arElement.barcode + '">' +
				'<input type="hidden" name="HIDDEN_QUANTITY[]" value="' + arElement.quantity + '">' +
				'<input type="hidden" name="AJAX_MODE" value="Y">'
		}
	));

	BX('form_b_catalog_store_docs').submit();
}

function productSearch(barcode)
{
	var dateURL = '<?=bitrix_sessid_get()?>&BARCODE_AJAX=Y&BARCODE='+barcode+'&lang=<? echo LANGUAGE_ID; ?>';

	BX.showWait();
	BX.ajax.post('/bitrix/admin/cat_store_product_search.php', dateURL, fSearchProductResult);
}

function fSearchProductResult(result)
{
	BX.closeWait();
	BX("CAT_DOC_BARCODE_FIND").value = '';
	BX("CAT_DOC_BARCODE_FIND").focus();

	var arBarCodes = [];
	if (result.length > 0)
	{
		var res = eval( '('+result+')' );
		if(res['id'] > 0)
		{
			res['quantity'] = 1;
			addRow(null, res, null, arBarCodes);
		}
	}
}

function enterBarcodes(id)
{
	var amount;
	if(BX('CAT_DOC_AMOUNT_HIDDEN_'+id))
		amount = parseInt(BX('CAT_DOC_AMOUNT_HIDDEN_'+id).value, 10);
	else
		amount = 0;
	if(isNaN(amount))
		amount = 0;
	maxId = amount;

	var
		content = BX.create('DIV', {
			props: {id : 'BARCODE_DIV_'+id },
			children: [
				BX.create('input', {
					props : {
						className: "BARCODE_INPUT_GREY", id : "BARCODE_INPUT_" + id, value : ""
					}
				}),
				BX.create('input', {
					props : {
						type : 'button', className: "BARCODE_INPUT_button", id : "BARCODE_INPUT_BUTTON_" + id, value : '<?=GetMessageJS('CAT_DOC_ADD')?>' /*disabled: (maxId >= BX('CAT_DOC_AMOUNT_'+id).value)*/
					},
					style : {
						marginLeft: '5px'
					},
					events : {
						click : function()
						{
							if(BX("BARCODE_INPUT_" + id).value.replace(/^\s+|\s+$/g, '') !== '' && !<?=intval($bReadOnly)?>)
							{
								amount = parseInt(BX('CAT_DOC_AMOUNT_HIDDEN_'+id).value, 10);
								if(isNaN(amount))
									amount = 0;
								for(var j = 0; j <= 100500; j++)
								{
									if(!BX("BARCODE["+id+"]["+j+"]"))
									{
										counter = j;
										break;
									}
								}
								BX('BARCODE_DIV_'+id).appendChild(BX.create('DIV', {
									props : {
										id : "BARCODE_DIV_INPUT_" + id
									},
									style : {
										padding: '6px'
									},
									children : [
										BX.create('span', {
											props : {
												id : "BARCODE_SPAN_INPUT_" + id
											},
											text : BX('BARCODE_INPUT_'+id).value.replace(/^\s+|\s+$/g, ''),
											style : {
												fontSize: '12'
											}
										}),
										BX.create('input', {
											props : {
												type : 'hidden',
												id : "BARCODE["+id+"]["+counter+"]",
												name : "BARCODE["+id+"]["+counter+"]",
												value : BX('BARCODE_INPUT_'+id).value
											}
										}),
										BX.create('a', {
											props : {
												className : 'split-delete-item',  tabIndex : '-1', href : 'javascript:void(0);', id : "BARCODE_DELETE["+id+"]["+counter+"]"
											},
											events : {
												click : function()
												{
													if(!<?=intval($bReadOnly)?>)
													{
														var deleteNode = this.parentNode;
														if(deleteNode)
															deleteNode.parentNode.removeChild(deleteNode);
														amount = parseInt(BX('CAT_DOC_AMOUNT_HIDDEN_'+id).value, 10);
														if(isNaN(amount))
															amount = 0;
														BX('CAT_DOC_AMOUNT_HIDDEN_'+id).value = amount - 1;
														if(BX("BARCODE_INPUT_BUTTON_" + id) && BX("CAT_DOC_AMOUNT_HIDDEN_" + id) && BX('CAT_DOC_AMOUNT_'+id).value > BX("CAT_DOC_AMOUNT_HIDDEN_" + id).value)
															BX("BARCODE_INPUT_BUTTON_" + id).disabled = false;
													}
												}
											},
											style : {
												marginLeft: '8px',
												verticalAlign: '-3'
											}
										})
									]
								}));
								BX('CAT_DOC_AMOUNT_HIDDEN_'+id).value = amount + 1;
								maxId = amount + 1;
								if(maxId >= BX('CAT_DOC_AMOUNT_'+id).value)
									BX("BARCODE_INPUT_BUTTON_" + id).disabled = true;
							}
							BX('BARCODE_INPUT_'+id).value = '';
							BX('BARCODE_INPUT_'+id).focus();
						}
					}
				})
			]
		}),
		formBarcodes = BX.PopupWindowManager.create("catalog-popup-barcodes-"+id, BX("CAT_BARCODE_DIV_BIND_"+id), {
			offsetTop : -50,
			offsetLeft : -50,
			autoHide : false,
			closeByEsc : true,
			closeIcon : false,
			draggable: {
				restrict: true
			},
			content : content
		});
	if(!BX("BARCODE_DIV_INPUT_"+id))
	{
		var savedBarcodes = '';
		if(BX("PRODUCT["+id+"][BARCODE]").value !== '')
			savedBarcodes = BX("PRODUCT["+id+"][BARCODE]").value.split(', ');
		if(savedBarcodes !== '')
		{
			var barCodeAmount = parseInt(BX('CAT_DOC_AMOUNT_HIDDEN_'+id).value);
			BX("BARCODE_INPUT_BUTTON_" + id).disabled = (savedBarcodes.length >= BX('CAT_DOC_AMOUNT_'+id).value);
			for(i in savedBarcodes)
			{
				if(savedBarcodes.hasOwnProperty(i) && savedBarcodes[i] != undefined && savedBarcodes[i] != '<?=GetMessage('CAT_DOC_POPUP_TITLE')?>')
				{
					BX('BARCODE_DIV_'+id).appendChild(BX.create('DIV', {
						props : {
							id : "BARCODE_DIV_INPUT_" + id
						},
						style : {
							padding: '6px'
						},
						children : [
							BX.create('span', {
								props : {
									id : "BARCODE_SPAN_INPUT_" + id
								},
								text : savedBarcodes[i],
								style : {
									fontSize: '12'
								}
							}),
							BX.create('input', {
								props : {
									type : 'hidden',
									id : "BARCODE["+id+"]["+i+"]",
									name : "BARCODE["+id+"]["+i+"]",
									value : savedBarcodes[i]
								}
							}),
							BX.create('a', {
								props : {
									className : 'split-delete-item',  tabIndex : '-1', href : 'javascript:void(0);'
								},
								events : {
									click : function()
									{
										if(!<?=intval($bReadOnly)?>)
										{
											var deleteNode = this.parentNode;
											if(deleteNode)
												deleteNode.parentNode.removeChild(deleteNode);
											amount = parseFloat(BX('CAT_DOC_AMOUNT_HIDDEN_'+id).value);
											if(isNaN(amount))
												amount = 0;
											BX('CAT_DOC_AMOUNT_HIDDEN_'+id).value = amount - 1;
											if(BX("BARCODE_INPUT_BUTTON_" + id) && BX("CAT_DOC_AMOUNT_HIDDEN_" + id) && BX('CAT_DOC_AMOUNT_'+id).value > BX("CAT_DOC_AMOUNT_HIDDEN_" + id).value)
												BX("BARCODE_INPUT_BUTTON_" + id).disabled = false;
										}
									}
								},
								style : {
									marginLeft: '8px',
									verticalAlign: '-3'
								}
							})
						]
					}));
				}
			}
		}
	}

	formBarcodes.setButtons([
		<?if(!$bReadOnly):?>
		new BX.PopupWindowButton({
			text : "<?=GetMessage('CAT_DOC_SAVE')?>",
			className : "",
			events : {
				click : function()
				{
					var barcodes = '';
					if(maxId > 0)
					{
						for(var i = 0; i <= maxId; i++)
						{
							if(BX("BARCODE["+id+"]["+i+"]"))
							{
								if(barcodes !== '')
									barcodes = barcodes + ', ';
								if(BX("BARCODE["+id+"]["+i+"]").value !== '')
									barcodes = barcodes + BX("BARCODE["+id+"]["+i+"]").value;
							}
						}
					}

					BX("PRODUCT["+id+"][BARCODE]").value = barcodes;
					recalculateSum(id);
					formBarcodes.close();
				}
			}
		}),
		<?else:?>
		new BX.PopupWindowButton({
			text : "<?=GetMessage('CAT_DOC_CANCEL')?>",
			className : "",
			events : {
				click : function()
				{
					formBarcodes.close();
				}
			}
		})
		<?endif;?>
	]);

	formBarcodes.show();
	if(BX('BARCODE_INPUT_'+id))
		BX('BARCODE_INPUT_'+id).focus();
	<?if($bReadOnly):?>
	var addBarcodeButtons = document.querySelectorAll('.BARCODE_INPUT_button, .BARCODE_INPUT_GREY');
	[].forEach.call(addBarcodeButtons, function disableButtons(item) {
		item.disabled = true;
	});
	var addBarcodeDelBut = document.querySelectorAll('a.split-delete-item');
	[].forEach.call(addBarcodeDelBut, function hideElements(item) {
		item.style.display = 'none';
	});
	<?endif;?>
}

function recalculateSum(id)
{
	<?if(isset($requiredFields["TOTAL"])):?>
	var amount = 0;
	var price = 0;
	if(BX('CAT_DOC_AMOUNT_'+id) && !isNaN(parseFloat(BX('CAT_DOC_AMOUNT_'+id).value)))
		amount = parseFloat(BX('CAT_DOC_AMOUNT_'+id).value);
	if(BX('CAT_DOC_PURCHASING_PRICE_'+id) && !isNaN(parseFloat(BX('CAT_DOC_PURCHASING_PRICE_'+id).value)))
		price = parseFloat(BX('CAT_DOC_PURCHASING_PRICE_'+id).value);
	if(BX('CAT_DOC_SUMM_'+id))
		BX('CAT_DOC_SUMM_'+id).innerHTML = number_format(amount * price);
	if(BX('PRODUCT['+id+'][SUMM]'))
		BX('PRODUCT['+id+'][SUMM]').value = (amount * price);
	var maxId = BX('ROW_MAX_ID').value;
	var totalSum = 0;
	for(var i = 0; i <= maxId; i++)
	{
		if(BX('PRODUCT['+i+'][SUMM]'))
		{
			totalSum = totalSum + Number(BX('PRODUCT['+i+'][SUMM]').value);
		}
	}
	if(isNaN(totalSum))
		totalSum = 0;
	if(BX("CAT_DOCUMENT_SUMM_SPAN"))
		BX("CAT_DOCUMENT_SUMM_SPAN").innerHTML = '<?=GetMessage('CAT_DOC_TOTAL')?>' + ': ' + number_format(totalSum) + ' ' + BX('CAT_CURRENCY_STORE').value;
	else
		showTotalSum();
	if(BX("CAT_DOCUMENT_SUM"))
		BX("CAT_DOCUMENT_SUM").value = totalSum;
	<?endif;?>
	if(BX("BARCODE_INPUT_BUTTON_" + id) && BX("CAT_DOC_AMOUNT_HIDDEN_" + id) && BX('CAT_DOC_AMOUNT_'+id).value > BX("CAT_DOC_AMOUNT_HIDDEN_" + id).value)
		BX("BARCODE_INPUT_BUTTON_" + id).disabled = false;
	else if(BX("BARCODE_INPUT_BUTTON_" + id))
		BX("BARCODE_INPUT_BUTTON_" + id).disabled = true;

}

function number_format( number, decimals, dec_point, thousands_sep ) {	// Format a number with grouped thousands

	var i, j, kw, kd, km;

	// input sanitation & defaults
	if( isNaN(decimals = Math.abs(decimals)) ){
		decimals = 2;
	}
	if( dec_point == undefined ){
		dec_point = ".";
	}
	if( thousands_sep == undefined ){
		thousands_sep = " ";
	}

	i = parseInt(number = (+number || 0).toFixed(decimals)) + "";

	if( (j = i.length) > 3 ){
		j = j % 3;
	} else{
		j = 0;
	}

	km = (j ? i.substr(0, j) + thousands_sep : "");
	kw = i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep);

	kd = (decimals ? dec_point + Math.abs(number - i).toFixed(decimals).replace(/-/, 0).slice(2) : "");


	return km + kw + kd;
}

</script>
<form enctype="multipart/form-data" method="POST" action="<?echo $APPLICATION->GetCurPage()?>?lang=<?=LANGUAGE_ID?>&DOCUMENT_TYPE=<?=htmlspecialcharsbx($docType)?>" id="form_b_catalog_store_docs" name="form_b_catalog_store_docs">
	<?echo GetFilterHiddens("filter_");?>
	<input type="hidden" name="Update" value="Y">
	<input type="hidden" name="lang" value="<?echo LANG ?>">
	<input type="hidden" name="ID" value="<?echo $ID ?>">
	<input type="hidden" name="DOCUMENT_TYPE" id="DOCUMENT_TYPE" value="<? echo htmlspecialcharsbx($docType);?>">
	<input value="<?=$maxId?>" type="hidden" id="ROW_MAX_ID">
	<?=bitrix_sessid_post()?>

	<div class="adm-detail-block" id="tabControl_layout">
		<div class="adm-detail-content-wrap">
			<div class="adm-detail-content-item-block">
				<table class="adm-detail-content-table edit-table" id="cat-doc-table">
					<tbody>
					<?if($ID > 0):?>
						<tr>
							<td width="40%" class="adm-detail-content-cell-l"><span class="cat-doc-status-left-<?=$str_STATUS?>"><?=GetMessage('CAT_DOC_STATUS')?>:</span></td>
							<td width="60%" class="adm-detail-content-cell-r">
								<span class="cat-doc-status-right-<?=$str_STATUS?>">
									<?=GetMessage('CAT_DOC_EXECUTION_'.$str_STATUS)?>
								</span>
							</td>
						</tr>
					<?endif;?>
					<tr class="adm-detail-required-field">
						<td width="40%" class="adm-detail-content-cell-l"><?=GetMessage('CAT_DOC_DATE')?>:</td>
						<td width="60%" class="adm-detail-content-cell-r">
							<?if($bReadOnly):?>
								<?=$str_DATE_DOCUMENT?>
							<?else:?>
								<?= CalendarDate("DOC_DATE", (isset($str_DATE_DOCUMENT)) ? $str_DATE_DOCUMENT : date($DB->DateFormatToPHP(CSite::GetDateFormat("FULL")), time()), "form_catalog_document_form", "15", "class=\"typeinput\""); ?>
							<?endif;?>
						</td>
					</tr>
					<tr class="adm-detail-required-field">
						<td width="40%" class="adm-detail-content-cell-l"><?= GetMessage("CAT_DOC_SITE_ID") ?>:</td>
						<td width="60%" class="adm-detail-content-cell-r">
							<select id="SITE_ID" name="SITE_ID" <?=$isDisable?>/>
							<?foreach($arSitesShop as $key => $val)
							{
								$selected = ($val['ID'] == $str_SITE_ID) ? 'selected' : '';
								echo"<option ".$selected." value=".$val['ID'].">".$val["NAME"]." (".$val["ID"].")"."</option>";
							}
							?>
							</select>
						</td>
					</tr>
					<?if(isset($requiredFields["CONTRACTOR"])):?>
						<tr class="adm-detail-required-field">
							<td width="40%" class="adm-detail-content-cell-l"><?= GetMessage("CAT_DOC_CONTRACTOR") ?>:</td>
							<td width="60%" class="adm-detail-content-cell-r">
								<?if(count($arContractors) > 0 && is_array($arContractors)):?>
									<select style="max-width:300px"  name="CONTRACTOR_ID" <?=$isDisable?>/>
									<?foreach($arContractors as $key => $val)
									{
										$selected = ($val['ID'] == $str_CONTRACTOR_ID) ? 'selected' : '';
										$companyName = ($val["PERSON_TYPE"] == CONTRACTOR_INDIVIDUAL) ? htmlspecialcharsbx($val["PERSON_NAME"]) : htmlspecialcharsbx($val["COMPANY"]." (".$val["PERSON_NAME"].")");
										echo"<option ".$selected." value=".$val['ID'].">".$companyName."</option>";
									}
									?>
									</select>
								<?else:?>
									<a href="/bitrix/admin/cat_contractor_edit.php?lang=<? echo urlencode(LANGUAGE_ID); ?>"><?echo GetMessage("CAT_DOC_CONTRACTOR_ADD")?></a>
								<?endif;?>
							</td>
						</tr>
					<?endif;?>
					<?if(isset($requiredFields["CURRENCY"])):?>
						<tr class="adm-detail-required-field">
							<td width="40%" class="adm-detail-content-cell-l"><?= GetMessage("CAT_DOC_CURRENCY") ?>:</td>
							<td width="60%" class="adm-detail-content-cell-r"><? echo CCurrency::SelectBox("CAT_CURRENCY_STORE", $str_CURRENCY, "", true, "", "onChange=\"recalculateSum(0);\" id='CAT_CURRENCY_STORE'".$isDisable);?></td>
						</tr>
					<?endif;?>
					</tbody>
				</table>
			</div>
		</div>
	</div>
<?

$aTabs = array();

$tabControl = new CAdminTabControl("storeDocument_".$docType, $aTabs);
$tabControl->Begin();

$lAdmin->DisplayList();
?>
<div class="adm-detail-content-item-block">
	<span style="vertical-align: top">	<?echo GetMessage("CAT_DOC_COMMENT") ?>: </span>
	<textarea cols="120" rows="4" class="typearea" name="CAT_DOC_COMMENTARY" <?=$isDisable?> wrap="virtual"><?= $str_COMMENTARY ?></textarea>
</div>
<?
if(isset($requiredFields["TOTAL"]))
{
	?>
	<script type="text/javascript">
		showTotalSum();
	</script>
	<?
}
$tabControl->Buttons(
	array(
		"disabled" => $bReadOnly,
		"btnSave" => false,
		"btnApply" => false,
		"btnCancel" => false,
		"back_url" => "/bitrix/admin/cat_store_document_list.php?lang=".LANGUAGE_ID."&".GetFilterParams("filter_", false),
	)
);
if(!$bReadOnly && !$isDocumentConduct)
{
	?>
	<span style="display:inline-block; width:20px; height: 22px;"></span>
	<input type="submit" class="adm-btn-save" name="save_and_conduct" value="<?echo GetMessage("CAT_DOC_ADD_CONDUCT") ?>">
	<input type="submit" class="adm-btn" name="save_document" value="<?echo GetMessage("CAT_DOC_SAVE") ?>">
<?
}
elseif($isDocumentConduct)
{
	?>
	<span class="hor-spacer"></span>
	<input type="hidden" name="cancellation" id="cancellation" value = "0">
	<input type="button" class="adm-btn" onClick="if(confirm('<?=GetMessage("CAT_DOC_CANCELLATION_CONFIRM")?>')) {BX('cancellation').value = 1; BX('form_b_catalog_store_docs').submit();}" value="<?echo GetMessage("CAT_DOC_CANCELLATION") ?>">
<?
}
?>
<input type="submit" class="adm-btn" name="dontsave" id="dontsave" value="<?echo GetMessage("CAT_DOC_CANCEL") ?>">
	<?
$tabControl->End();
?><?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");?>