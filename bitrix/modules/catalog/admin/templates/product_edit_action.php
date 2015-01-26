<?
if ($USER->CanDoOperation('catalog_price'))
{
	$IBLOCK_ID = intval($IBLOCK_ID);
	$ID = intval($ID);
	$userId = intval($USER->GetID());

	if (0 < $IBLOCK_ID && 0 < $ID)
	{
		$PRODUCT_ID = CIBlockElement::GetRealElement($ID);
		$bUseStoreControl = (COption::GetOptionString('catalog','default_use_store_control','N') == "Y");
		$bEnableReservation = ('N' != COption::GetOptionString('catalog', 'enable_reservation'));

		if (CIBlockElementRights::UserHasRightTo($IBLOCK_ID, $PRODUCT_ID, "element_edit_price"))
		{
			IncludeModuleLangFile($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/catalog/templates/product_edit_action.php');
			if ('' == $strWarning)
			{
				$bUseExtForm = (isset($_POST['price_useextform']) && 'Y' == $_POST['price_useextform']);

				$arCatalog = CCatalog::GetByID($IBLOCK_ID);

				$arCatalogPrice_tmp = array();
				$intBasePriceCount = count($arCatalogBasePrices);
				$dbCatGroups = CCatalogGroup::GetList(array(), array("!BASE" => "Y"));
				while ($arCatGroups = $dbCatGroups->Fetch())
				{
					unset($arCatalogPrice_tmp);
					$arCatalogPrice_tmp = array();

					for ($i = 0; $i < $intBasePriceCount; $i++)
					{
						${"CAT_PRICE_".$arCatGroups["ID"]."_".$arCatalogBasePrices[$i]["IND"]} = str_replace(",", ".", ${"CAT_PRICE_".$arCatGroups["ID"]."_".$arCatalogBasePrices[$i]["IND"]});
						$arCatalogPrice_tmp[$i] = array(
							"ID" => IntVal(${"CAT_ID_".$arCatGroups["ID"]}[$arCatalogBasePrices[$i]["IND"]]),
							"EXTRA_ID" => ${"CAT_EXTRA_".$arCatGroups["ID"]."_".$arCatalogBasePrices[$i]["IND"]}
								? IntVal(${"CAT_EXTRA_".$arCatGroups["ID"]."_".$arCatalogBasePrices[$i]["IND"]})
								: 0,
							"PRICE" => ${"CAT_PRICE_".$arCatGroups["ID"]."_".$arCatalogBasePrices[$i]["IND"]},
							"CURRENCY" => Trim(${"CAT_CURRENCY_".$arCatGroups["ID"]."_".$arCatalogBasePrices[$i]["IND"]}),
							"QUANTITY_FROM" => $arCatalogBasePrices[$i]["QUANTITY_FROM"],
							"QUANTITY_TO" => $arCatalogBasePrices[$i]["QUANTITY_TO"]
						);

						if (strlen($arCatalogPrice_tmp[$i]["CURRENCY"]) <= 0)
						{
							$arCatalogPrice_tmp[$i]["CURRENCY"] = $arCatalogBasePrices[$i]["CURRENCY"];
						}

						if ($arCatalogPrice_tmp[$i]["EXTRA_ID"] > 0)
						{
							if (0 < doubleval($arCatalogBasePrices[$i]["PRICE"]))
							{
								$arCatalogPrice_tmp[$i]["CURRENCY"] = $arCatalogBasePrices[$i]["CURRENCY"];
								$arCatalogExtra = CExtra::GetByID($arCatalogPrice_tmp[$i]["EXTRA_ID"]);
								$arCatalogPrice_tmp[$i]["PRICE"] = RoundEx($arCatalogBasePrices[$i]["PRICE"] * (1 + DoubleVal($arCatalogExtra["PERCENTAGE"]) / 100), CATALOG_VALUE_PRECISION);
							}
							else
							{
								$arCatalogPrice_tmp[$i]["EXTRA_ID"] = 0;
							}
						}
					}

					$arCatalogPrices[$arCatGroups["ID"]] = $arCatalogPrice_tmp;
				}

				$arUpdatedIDs = array();
				$availCanBuyZero = COption::GetOptionString("catalog", "default_can_buy_zero");
				$quantityTrace = $_POST['CAT_BASE_QUANTITY_TRACE'];
				if(!$quantityTrace || $quantityTrace == '')
					$quantityTrace = 'D';
				$useStore = $_POST['USE_STORE'];
				if(!$useStore || $useStore == '')
					$useStore = 'D';
				if ('Y' == $useStore || ('D' == $useStore && 'Y' == $availCanBuyZero))
				{
					$negativeAmount = $useStore;
				}
				else
				{
					$negativeAmount = $_POST['NEGATIVE_AMOUNT'];
					if(!$negativeAmount || $negativeAmount == '')
						$negativeAmount = 'D';
				}
				$barcodeMultiply = $_POST["CAT_BARCODE_MULTIPLY"];
				if(!$barcodeMultiply || $barcodeMultiply == '')
					$barcodeMultiply = 'N';
				if(isset($_REQUEST["AR_BARCODE_ID"]) && ($barcodeMultiply == 'Y'))
				{
					$countBarCode = 0;
					$arBarCodeResult = array();
					$dbAmount = CCatalogStoreControlUtil::getQuantityInformation($PRODUCT_ID);
					if(is_object($dbAmount) && ($arAmount = $dbAmount->Fetch()))
					{
						$dbBarCode = CCatalogStoreBarCode::GetList(array(), array("PRODUCT_ID" => $PRODUCT_ID), false, false, array("ID", "BARCODE", "PRODUCT_ID", "STORE_ID"));
						while($arBarCode = $dbBarCode->Fetch())
						{
							$arBarCodeResult[] = $arBarCode;
							if($arBarCode["STORE_ID"] != 0)
								$countBarCode++;
						}
						if(($arAmount["SUM"] + $arAmount["RESERVED"] != 0) || ($countBarCode > 0))
						{
							$strWarning .= GetMessage("C2IT_ERROR_USE_MULTIBARCODE", array("#COUNT#" => ($arAmount["SUM"] - $countBarCode)));
							$barcodeMultiply = 'N';
							unset($_REQUEST["AR_BARCODE_ID"]);
						}
						else
						{
							foreach($arBarCodeResult as $barCode)
							{
								CCatalogStoreBarCode::Delete($barCode["ID"]);
							}
						}
					}
				}
				elseif(isset($_REQUEST["AR_BARCODE_ID"]) && is_array($_REQUEST["AR_BARCODE_ID"]) && $barcodeMultiply != 'Y')
				{
					$arBarCodeFieldsAdd = $arBarCodeFields = array();
					$isErrorSaveBarcode = false;
					foreach($_REQUEST["AR_BARCODE_ID"] as $barcodeId)
					{
						$barcodeId = intval($barcodeId);
						if(!isset($_REQUEST["CAT_BARCODE_$barcodeId"]) || trim($_REQUEST["CAT_BARCODE_$barcodeId"]) == '')
						{
							if(trim($_REQUEST["CAT_BARCODE_$barcodeId"]) == '')
							{
								CCatalogStoreBarCode::Delete($barcodeId);
							}
							continue;
						}

						$arBarCodeFields = array(
							"BARCODE" => trim($_REQUEST["CAT_BARCODE_$barcodeId"]),
							"PRODUCT_ID" => $PRODUCT_ID,
							"CREATED_BY" => $userId,
							"MODIFIED_BY" => $userId,
							"STORE_ID" => 0,
						);

						if($barcodeId > 0)
						{
							if(!CCatalogStoreBarCode::Update($barcodeId, $arBarCodeFields))
							{
								$isErrorSaveBarcode = true;
							}
						}
						else
						{
							if(!CCatalogStoreBarCode::Add($arBarCodeFields))
							{
								$isErrorSaveBarcode = true;
							}
						}

						if($isErrorSaveBarcode)
						{
							$strWarning .= GetMessage("C2IT_ERROR_SAVE_BARCODE");
							break;
						}
					}

					if(isset($_REQUEST["CAT_BARCODE_ADD"]) && is_array($_REQUEST["CAT_BARCODE_ADD"]))
						foreach($_REQUEST["CAT_BARCODE_ADD"] as $barcodeToAdd)
							if(trim($barcodeToAdd) != '')
								$arBarCodeFieldsAdd[] = array(
									"BARCODE" => trim($barcodeToAdd),
									"PRODUCT_ID" => $PRODUCT_ID,
									"CREATED_BY" => $userId,
									"MODIFIED_BY" => $userId,
									"STORE_ID" => 0,
								);

					if(count($arBarCodeFieldsAdd) > 0 && is_array($arBarCodeFieldsAdd))
						foreach($arBarCodeFieldsAdd as $arCodeToAdd)
							if(!CCatalogStoreBarCode::Add($arCodeToAdd))
							{
								$strWarning .= GetMessage("C2IT_ERROR_SAVE_BARCODE");
								break;
							}
				}
				$arFields = array(
					"ID" => $PRODUCT_ID,
					"QUANTITY_TRACE" => $quantityTrace,
					"WEIGHT" => $CAT_BASE_WEIGHT,
					"WIDTH" => $CAT_BASE_WIDTH,
					"LENGTH" => $CAT_BASE_LENGTH,
					"HEIGHT" => $CAT_BASE_HEIGHT,
					"VAT_ID" => $CAT_VAT_ID,
					"VAT_INCLUDED" => $CAT_VAT_INCLUDED,
					"CAN_BUY_ZERO" => $useStore,
					"NEGATIVE_AMOUNT_TRACE" => $negativeAmount,
					"PRICE_TYPE" => false,
					"RECUR_SCHEME_TYPE" => false,
					"RECUR_SCHEME_LENGTH" => false,
					"TRIAL_PRICE_ID" => false,
					"WITHOUT_ORDER" => false,
					"BARCODE_MULTI" => $barcodeMultiply,
					"PURCHASING_PRICE" => doubleval($CAT_PURCHASING_PRICE),
					"MEASURE" => $CAT_MEASURE,
				);

				if (isset($_POST['SUBSCRIBE']))
				{
					$arFields['SUBSCRIBE'] = strval($_POST['SUBSCRIBE']);
				}

				if(!$bUseStoreControl)
				{
					$arFields["QUANTITY"] = $CAT_BASE_QUANTITY;
					if ($bEnableReservation && isset($CAT_BASE_QUANTITY_RESERVED))
						$arFields["QUANTITY_RESERVED"] = $CAT_BASE_QUANTITY_RESERVED;
				}

				$purchasingCurrency = ($CAT_PURCHASING_CURRENCY != '') ? $CAT_PURCHASING_CURRENCY : '';
				if($purchasingCurrency != '')
					$arFields["PURCHASING_CURRENCY"] = $purchasingCurrency;

				if ($arCatalog["SUBSCRIPTION"] == "Y")
				{
					$arFields["PRICE_TYPE"] = $CAT_PRICE_TYPE;
					$arFields["RECUR_SCHEME_TYPE"] = $CAT_RECUR_SCHEME_TYPE;
					$arFields["RECUR_SCHEME_LENGTH"] = $CAT_RECUR_SCHEME_LENGTH;
					$arFields["TRIAL_PRICE_ID"] = $CAT_TRIAL_PRICE_ID;
					$arFields["WITHOUT_ORDER"] = $CAT_WITHOUT_ORDER;
				}
				CCatalogProduct::Add($arFields);

				$arMeasureRatio = array("PRODUCT_ID" => $PRODUCT_ID, "RATIO" => $CAT_MEASURE_RATIO);
				if(isset($CAT_MEASURE_RATIO_ID) && intval($CAT_MEASURE_RATIO_ID) > 0)
					CCatalogMeasureRatio::update($CAT_MEASURE_RATIO_ID, $arMeasureRatio);
				else
					CCatalogMeasureRatio::add($arMeasureRatio);

				$intCountBasePrice = count($arCatalogBasePrices);
				for ($i = 0; $i < $intCountBasePrice; $i++)
				{
					if (strlen($arCatalogBasePrices[$i]["PRICE"]) > 0)
					{
						$arCatalogFields = array(
							"EXTRA_ID" => false,
							"PRODUCT_ID" => $PRODUCT_ID,
							"CATALOG_GROUP_ID" => $arCatalogBaseGroup["ID"],
							"PRICE" => DoubleVal($arCatalogBasePrices[$i]["PRICE"]),
							"CURRENCY" => $arCatalogBasePrices[$i]["CURRENCY"],
							"QUANTITY_FROM" => ($arCatalogBasePrices[$i]["QUANTITY_FROM"] > 0 ? $arCatalogBasePrices[$i]["QUANTITY_FROM"] : False),
							"QUANTITY_TO" => ($arCatalogBasePrices[$i]["QUANTITY_TO"] > 0 ? $arCatalogBasePrices[$i]["QUANTITY_TO"] : False)
						);

						if ($arCatalogBasePrices[$i]["ID"] > 0)
						{
							$arCatalogPrice = CPrice::GetByID($arCatalogBasePrices[$i]["ID"]);
							if ($arCatalogPrice && $arCatalogPrice["PRODUCT_ID"] == $PRODUCT_ID)
							{
								$arUpdatedIDs[] = $arCatalogBasePrices[$i]["ID"];
								if (!CPrice::Update($arCatalogBasePrices[$i]["ID"], $arCatalogFields))
									$strWarning .= str_replace("#ID#", $arCatalogBasePrices[$i]["ID"], GetMessage("C2IT_ERROR_PRPARAMS"))."<br>";
							}
							else
							{
								$ID_tmp = CPrice::Add($arCatalogFields);
								$arUpdatedIDs[] = $ID_tmp;
								if (!$ID_tmp)
									$strWarning .= str_replace("#PRICE#", $arCatalogFields["PRICE"], GetMessage("C2IT_ERROR_SAVEPRICE"))."<br>";
							}
						}
						else
						{
							$ID_tmp = CPrice::Add($arCatalogFields);
							$arUpdatedIDs[] = $ID_tmp;
							if (!$ID_tmp)
								$strWarning .= str_replace("#PRICE#", $arCatalogFields["PRICE"], GetMessage("C2IT_ERROR_SAVEPRICE"))."<br>";
						}
					}
				}

				foreach ($arCatalogPrices as $catalogGroupID => $arCatalogPrice_tmp)
				{
					$intCountPrice = count($arCatalogPrice_tmp);
					for ($i = 0; $i < $intCountPrice; $i++)
					{
						if (strlen($arCatalogPrice_tmp[$i]["PRICE"]) > 0)
						{
							$arCatalogFields = array(
								"EXTRA_ID" => ($arCatalogPrice_tmp[$i]["EXTRA_ID"] > 0 ? $arCatalogPrice_tmp[$i]["EXTRA_ID"] : false),
								"PRODUCT_ID" => $PRODUCT_ID,
								"CATALOG_GROUP_ID" => $catalogGroupID,
								"PRICE" => DoubleVal($arCatalogPrice_tmp[$i]["PRICE"]),
								"CURRENCY" => $arCatalogPrice_tmp[$i]["CURRENCY"],
								"QUANTITY_FROM" => ($arCatalogPrice_tmp[$i]["QUANTITY_FROM"] > 0 ? $arCatalogPrice_tmp[$i]["QUANTITY_FROM"] : False),
								"QUANTITY_TO" => ($arCatalogPrice_tmp[$i]["QUANTITY_TO"] > 0 ? $arCatalogPrice_tmp[$i]["QUANTITY_TO"] : False)
							);

							if ($arCatalogPrice_tmp[$i]["ID"] > 0)
							{
								$arCatalogPrice = CPrice::GetByID($arCatalogPrice_tmp[$i]["ID"]);
								if ($arCatalogPrice && $arCatalogPrice["PRODUCT_ID"] == $PRODUCT_ID)
								{
									$arUpdatedIDs[] = $arCatalogPrice_tmp[$i]["ID"];
									if (!CPrice::Update($arCatalogPrice_tmp[$i]["ID"], $arCatalogFields))
										$strWarning .= str_replace("#ID#", $arCatalogPrice_tmp[$i]["ID"], GetMessage("C2IT_ERROR_PRPARAMS"))."<br>";
								}
								else
								{
									$ID_tmp = CPrice::Add($arCatalogFields);
									$arUpdatedIDs[] = $ID_tmp;
									if (!$ID_tmp)
										$strWarning .= str_replace("#PRICE#", $arCatalogFields["PRICE"], GetMessage("C2IT_ERROR_SAVEPRICE"))."<br>";
								}
							}
							else
							{
								$ID_tmp = CPrice::Add($arCatalogFields);
								$arUpdatedIDs[] = $ID_tmp;
								if (!$ID_tmp)
									$strWarning .= str_replace("#PRICE#", $arCatalogFields["PRICE"], GetMessage("C2IT_ERROR_SAVEPRICE"))."<br>";
							}
						}
					}
				}

				CPrice::DeleteByProduct($PRODUCT_ID, $arUpdatedIDs);

				if ($arCatalog["SUBSCRIPTION"] == "Y")
				{
					$arCurProductGroups = array();

					$dbProductGroups = CCatalogProductGroups::GetList(
						array(),
						array("PRODUCT_ID" => $ID),
						false,
						false,
						array("ID", "GROUP_ID", "ACCESS_LENGTH", "ACCESS_LENGTH_TYPE")
					);
					while ($arProductGroup = $dbProductGroups->Fetch())
					{
						$arCurProductGroups[IntVal($arProductGroup["GROUP_ID"])] = $arProductGroup;
					}

					$arAvailContentGroups = array();
					$availContentGroups = COption::GetOptionString("catalog", "avail_content_groups");
					if (strlen($availContentGroups) > 0)
						$arAvailContentGroups = explode(",", $availContentGroups);

					$dbGroups = CGroup::GetList(
						($b = "c_sort"),
						($o = "asc"),
						array("ANONYMOUS" => "N")
					);
					while ($arGroup = $dbGroups->Fetch())
					{
						$arGroup["ID"] = intval($arGroup["ID"]);

						if ($arGroup["ID"] == 2
							|| !in_array($arGroup["ID"], $arAvailContentGroups))
						{
							if (isset($arCurProductGroups[$arGroup["ID"]]))
								CCatalogProductGroups::Delete($arCurProductGroups[$arGroup["ID"]]["ID"]);

							continue;
						}

						if (isset($arCurProductGroups[$arGroup["ID"]]))
						{
							if (isset(${"CAT_USER_GROUP_ID_".$arGroup["ID"]}) && ${"CAT_USER_GROUP_ID_".$arGroup["ID"]} == "Y")
							{
								if (IntVal(${"CAT_ACCESS_LENGTH_".$arGroup["ID"]}) != IntVal($arCurProductGroups[$arGroup["ID"]]["ACCESS_LENGTH"])
									|| ${"CAT_ACCESS_LENGTH_TYPE_".$arGroup["ID"]} != $arCurProductGroups[$arGroup["ID"]]["ACCESS_LENGTH_TYPE"])
								{
									$arCatalogFields = array(
										"ACCESS_LENGTH" => IntVal(${"CAT_ACCESS_LENGTH_".$arGroup["ID"]}),
										"ACCESS_LENGTH_TYPE" => ${"CAT_ACCESS_LENGTH_TYPE_".$arGroup["ID"]}
									);
									CCatalogProductGroups::Update($arCurProductGroups[$arGroup["ID"]]["ID"], $arCatalogFields);
								}
							}
							else
							{
								CCatalogProductGroups::Delete($arCurProductGroups[$arGroup["ID"]]["ID"]);
							}
						}
						else
						{
							if (isset(${"CAT_USER_GROUP_ID_".$arGroup["ID"]}) && ${"CAT_USER_GROUP_ID_".$arGroup["ID"]} == "Y")
							{
								$arCatalogFields = array(
									"PRODUCT_ID" => $ID,
									"GROUP_ID" => $arGroup["ID"],
									"ACCESS_LENGTH" => IntVal(${"CAT_ACCESS_LENGTH_".$arGroup["ID"]}),
									"ACCESS_LENGTH_TYPE" => ${"CAT_ACCESS_LENGTH_TYPE_".$arGroup["ID"]}
								);
								CCatalogProductGroups::Add($arCatalogFields);
							}
						}
					}
				}

				if ($USER->CanDoOperation('catalog_store'))
				{
					$rsStores = CCatalogStore::GetList(array(), array('ACTIVE' => 'Y'), false, false, array('ID'));
					while ($arStore = $rsStores->Fetch())
					{
						if (isset($_POST['AR_AMOUNT'][$arStore['ID']]))
						{
							$arStoreProductFields = array(
								"PRODUCT_ID" => $ID,
								"STORE_ID" => $arStore['ID'],
								"AMOUNT" => $_POST['AR_AMOUNT'][$arStore['ID']],
							);
							if(!CCatalogStoreProduct::UpdateFromForm($arStoreProductFields))
								$bVarsFromForm = true;
						}
					}
				}
			}
		}
	}
}
?>