<?php
use \Bitrix\Main;
use \Bitrix\Catalog\CatalogViewedProductTable as CatalogViewedProductTable;
use \Bitrix\Main\Text\String as String;
use \Bitrix\Main\Localization\Loc as Loc;
use \Bitrix\Main\SystemException as SystemException;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();


class CCatalogViewedProductsComponent extends CBitrixComponent
{
	/**
	 * Maximum products count.
	 * @const integer
	 */
	const MAX_VIEWED_COUNT = 100;
	/**
	 * Primary data - viewed product.
	 * @var array[]
	 */
	protected $items = array();

	/**
	 * Viewed products ids.
	 * @var integer[]
	 */
	private $productIds = array();

	/**
	 * Helper array map: array("SKU_ID" => "PRODUCT_ID", ...)
	 * @var array
	 */
	private $productIdsMap = array();


	/**
	 * Helper array map: array("PRODUCT_ID1" => ARRAY("SKU_ID1_1", "SKU_ID1_2", ...),
	 *                         "PRODUCT_ID2" => ARRAY("SKU_ID2_1", "SKU_ID2_2", ...),
	 *                          ... )
	 */
	private $skuTree = array();

	/**
	 * Filter to fetch items.
	 * Used in CIBlockElement::getList()
	 * @var string[]
	 */
	private $filter = array();

	/**
	 * Select fields for items.
	 * Used in CIBlockElement::getList()
	 * @var string[]
	 */
	private $selectFields = array();

	/**
	 * Wether module Sale included?
	 * @var bool
	 */
	protected $isSale = true;

	/**
	 * Wether module Currency included?
	 * @var bool
	 */
	protected $isCurrency = true;

	/**
	 * Errors list.
	 * @var string[]
	 */
	protected $errors = array();

	/**
	 * Warnings list.
	 * @var string[]
	 */
	protected $warnings = array();

	/**
	 * Util data for template.
	 * @var array
	 */
	protected $data = array();

	/**
	 * Load language file.
	 */
	public function onIncludeComponentLang()
	{
		$this->includeComponentLang(basename(__FILE__));
		Loc::loadMessages(__FILE__);
	}

	/**
	 * Is AJAX Request?
	 * @return bool
	 */
	protected function isAjax()
	{
		return isset($_REQUEST['ajax_basket']) && 'Y' == $_REQUEST['ajax_basket'];
	}

	/**
	 * Return product quantity from request string
	 * @return integer
	 */
	protected function getProductQuantityFromRequest()
	{
		$quantity = 0;
		if ($this->arParams["USE_PRODUCT_QUANTITY"])
		{
			if (isset($_REQUEST[$this->arParams["PRODUCT_QUANTITY_VARIABLE"]]))
			{
				$quantity = doubleval($_REQUEST[$this->arParams["PRODUCT_QUANTITY_VARIABLE"]]);
			}
		}
		return $quantity;
	}

	/**
	 * Return product product properties to add in basket
	 * @return string[]
	 */
	protected function getProductPropertiesFromRequest()
	{
		$values = array();
		if (isset($_REQUEST[$this->arParams["PRODUCT_PROPS_VARIABLE"]]) && is_array($_REQUEST[$this->arParams["PRODUCT_PROPS_VARIABLE"]]))
		{
			$values = $_REQUEST[$this->arParams["PRODUCT_PROPS_VARIABLE"]];
		}
		return $values;
	}

	/**
	 * Process buy action.
	 * @return void
	 */
	protected function processBuyAction()
	{
		global $APPLICATION;
		if (!(isset($_REQUEST[$this->arParams["ACTION_VARIABLE"]]) && $_REQUEST[$this->arParams["ACTION_VARIABLE"]] == "BUY"))
			return;
		$productID = intval($_REQUEST[$this->arParams["PRODUCT_ID_VARIABLE"]]);
		if (!$productID)
			throw new SystemException(Loc::getMessage("CVP_ACTION_PRODUCT_ID_REQUIRED"));

		$this->addProductToBasket($productID, $this->getProductQuantityFromRequest(), $this->getProductPropertiesFromRequest());


		if (!$this->isAjax())
		{
			LocalRedirect($this->arParams["BASKET_URL"]);
		}
		else
		{
			$APPLICATION->restartBuffer();
			echo CUtil::PhpToJSObject(array('STATUS' => 'OK', 'MESSAGE' => ''));
			die();
		}
	}

	/**
	 * Process buy action.
	 * @return void
	 */
	protected function processAddToBasketAction()
	{
		global $APPLICATION;
		if (!(isset($_REQUEST[$this->arParams["ACTION_VARIABLE"]]) && $_REQUEST[$this->arParams["ACTION_VARIABLE"]] == "ADD2BASKET"))
			return;
		$productID = intval($_REQUEST[$this->arParams["PRODUCT_ID_VARIABLE"]]);

		if (!$productID)
			throw new SystemException(Loc::getMessage("CVP_ACTION_PRODUCT_ID_REQUIRED"));

		$this->addProductToBasket($productID, $this->getProductQuantityFromRequest(), $this->getProductPropertiesFromRequest());

		if (!$this->isAjax())
		{
			LocalRedirect($APPLICATION->GetCurPageParam("", array($this->arParams["PRODUCT_ID_VARIABLE"], $this->arParams["ACTION_VARIABLE"])));
		}
		else
		{
			$APPLICATION->restartBuffer();
			echo CUtil::PhpToJSObject(array('STATUS' => 'OK', 'MESSAGE' => Loc::getMessage("CVP_PRODUCT_ADDED")));
			die();
		}
	}

	/**
	 * Process buy action.
	 * @return void
	 */
	protected function processSubscribeAction()
	{
		global $APPLICATION;
		if (!(isset($_REQUEST[$this->arParams["ACTION_VARIABLE"]]) && $_REQUEST[$this->arParams["ACTION_VARIABLE"]] == "SUBSCRIBE_PRODUCT"))
			return;
		$productID = intval($_REQUEST[$this->arParams["PRODUCT_ID_VARIABLE"]]);
		if (!$productID)
			throw new SystemException(Loc::getMessage("CVP_ACTION_PRODUCT_ID_REQUIRED"));

		$rewriteFields = array("SUBSCRIBE" => "Y", "CAN_BUY" => "N");

		$this->addProductToBasket($productID, $this->getProductQuantityFromRequest(), $this->getProductPropertiesFromRequest(), $rewriteFields);

		if (!$this->isAjax())
		{
			LocalRedirect($APPLICATION->GetCurPageParam("", array($this->arParams["PRODUCT_ID_VARIABLE"], $this->arParams["ACTION_VARIABLE"])));
		}
		else
		{
			$APPLICATION->restartBuffer();
			echo CUtil::PhpToJSObject(array('STATUS' => 'OK', 'MESSAGE' => Loc::getMessage("CVP_PRODUCT_SUBSCIBED")));
			die();
		}
	}

	/**
	 * Process request actions list
	 * @return void
	 */
	protected function doActionsList()
	{
		$this->processBuyAction();
		$this->processAddToBasketAction();
		$this->processSubscribeAction();
	}

	/**
	 * Process incoming request.
	 * @return void
	 */
	protected function processRequest()
	{
		global $APPLICATION;
		try
		{
			$this->doActionsList();
		}
		catch (SystemException $e)
		{
			if ($this->isAjax())
			{
				$APPLICATION->restartBuffer();
				echo CUtil::PhpToJSObject(array('STATUS' => 'ERROR', 'MESSAGE' => $e->getMessage()));
				die();
			}
			else
			{
				$this->warnings[] = String::htmlEncode($e->getMessage());
			}
		}
	}

	/**
	 * Process Puy Product
	 *
	 * @param $productID
	 * @param $quantity
	 */
	protected function addProductToBasket($productID, $quantity, $values = array(), $arRewriteFields = array())
	{
		$productProperties = array();
		$intProductIBlockID = intval(CIBlockElement::GetIBlockByID($productID));

		if (0 < $intProductIBlockID)
		{
			$productCatalogInfo = CCatalogSKU::getInfoByIblock($intProductIBlockID);
			$isOffer = CCatalogSKU::TYPE_OFFERS == $productCatalogInfo['CATALOG_TYPE'];

			if ($this->arParams['ADD_PROPERTIES_TO_BASKET'] == 'Y')
			{
				// Is not offer
				if (!$isOffer)
				{
					// Props not empty
					if (!empty($this->arParams['CART_PROPERTIES'][$intProductIBlockID]))
					{
						$productProperties = CIBlockPriceTools::CheckProductProperties(
							$intProductIBlockID,
							$productID,
							$this->arParams['CART_PROPERTIES'][$intProductIBlockID],
							$values,
							$this->arParams['PARTIAL_PRODUCT_PROPERTIES'] == 'Y'
						);

						if (!is_array($productProperties))
						{
							throw new SystemException(Loc::getMessage("CVP_PARTIAL_BASKET_PROPERTIES_ERROR"));
						}
					}
				}
				else
				{
					if (!empty($this->arParams['CART_PROPERTIES'][$intProductIBlockID]))
					{
						$productProperties = CIBlockPriceTools::GetOfferProperties(
							$productID,
							$productCatalogInfo['PRODUCT_IBLOCK_ID'],
							$this->arParams['CART_PROPERTIES'][$intProductIBlockID]
						);
					}
				}
			}

			if (0 >= $quantity)
			{
				$rsRatios = CCatalogMeasureRatio::getList(
					array(),
					array('PRODUCT_ID' => $productID),
					false,
					false,
					array('PRODUCT_ID', 'RATIO')
				);
				if ($arRatio = $rsRatios->Fetch())
				{
					$intRatio = intval($arRatio['RATIO']);
					$dblRatio = doubleval($arRatio['RATIO']);
					$quantity = ($dblRatio > $intRatio ? $dblRatio : $intRatio);
				}
			}
			if (0 >= $quantity)
				$quantity = 1;
		}
		else // Cannot  define product catalog
		{
			throw new SystemException(Loc::getMessage('CVP_CATALOG_PRODUCT_NOT_FOUND') . ".");
		}

		if (!Add2BasketByProductID($productID, $quantity, $arRewriteFields, $productProperties))
			throw new SystemException(Loc::getMessage("CVP_CATALOG_ERROR2BASKET") . ".");
	}

	/**
	 * Check Required Modules
	 * @throws Exception
	 */
	protected function checkModules()
	{
		if (!Main\Loader::includeModule("catalog"))
			throw new SystemException(Loc::getMessage("CVP_CATALOG_MODULE_NOT_INSTALLED"));
		$this->isCurrency = true;
		if (!Main\Loader::includeModule("sale"))
		{
			$this->isSale = false;
		}
	}

	/**
	 * Prepare Component Params
	 */
	public function onPrepareComponentParams($params)
	{
		$params["DETAIL_URL"] = trim($params["DETAIL_URL"]);
		$params["BASKET_URL"] = trim($params["BASKET_URL"]);

		$params["CACHE_TIME"] = intval($params["CACHE_TIME"]);
		if ($params["CACHE_TIME"] <= 0)
			$params["CACHE_TIME"] = 3600;

		if ($params["BASKET_URL"] === '')
			$params["BASKET_URL"] = "/personal/basket.php";

		$params["ACTION_VARIABLE"] = trim($params["ACTION_VARIABLE"]);
		if ($params["ACTION_VARIABLE"] === '' || !preg_match("/^[A-Za-z_][A-Za-z01-9_]*$/", $params["ACTION_VARIABLE"]))
			$params["ACTION_VARIABLE"] = "action";

		$params["PRODUCT_ID_VARIABLE"] = trim($params["PRODUCT_ID_VARIABLE"]);
		if ($params["PRODUCT_ID_VARIABLE"] === '' || !preg_match("/^[A-Za-z_][A-Za-z01-9_]*$/", $params["PRODUCT_ID_VARIABLE"]))
			$params["PRODUCT_ID_VARIABLE"] = "id";

		$params["USE_PRODUCT_QUANTITY"] = $params["USE_PRODUCT_QUANTITY"] === "Y";
		$params["PRODUCT_QUANTITY_VARIABLE"] = trim($params["PRODUCT_QUANTITY_VARIABLE"]);
		if ($params["PRODUCT_QUANTITY_VARIABLE"] === '' || !preg_match("/^[A-Za-z_][A-Za-z01-9_]*$/", $params["PRODUCT_QUANTITY_VARIABLE"]))
			$params["PRODUCT_QUANTITY_VARIABLE"] = "quantity";

		$params["PRODUCT_PROPS_VARIABLE"] = trim($params["PRODUCT_PROPS_VARIABLE"]);
		if ($params["PRODUCT_PROPS_VARIABLE"] === '' || !preg_match("/^[A-Za-z_][A-Za-z01-9_]*$/", $params["PRODUCT_PROPS_VARIABLE"]))
			$params["PRODUCT_PROPS_VARIABLE"] = "prop";

		$params['ADD_PROPERTIES_TO_BASKET'] = (isset($params['ADD_PROPERTIES_TO_BASKET']) && $params['ADD_PROPERTIES_TO_BASKET'] == 'N' ? 'N' : 'Y');
		$arParams['PARTIAL_PRODUCT_PROPERTIES'] = (isset($arParams['PARTIAL_PRODUCT_PROPERTIES']) && $arParams['PARTIAL_PRODUCT_PROPERTIES'] === 'Y' ? 'Y' : 'N');
		$params["SET_TITLE"] = $params["SET_TITLE"] != "N";
		$params["DISPLAY_COMPARE"] = $params["DISPLAY_COMPARE"] == "Y";

		$params["PAGE_ELEMENT_COUNT"] = intval($params["PAGE_ELEMENT_COUNT"]);
		if ($params["PAGE_ELEMENT_COUNT"] <= 0)
			$params["PAGE_ELEMENT_COUNT"] = 20;
		$params["LINE_ELEMENT_COUNT"] = intval($params["LINE_ELEMENT_COUNT"]);
		if ($params["LINE_ELEMENT_COUNT"] <= 0)
			$params["LINE_ELEMENT_COUNT"] = 3;

		$params["OFFERS_LIMIT"] = intval($params["OFFERS_LIMIT"]);
		if ($params["OFFERS_LIMIT"] < 0)
			$params["OFFERS_LIMIT"] = 5;
		elseif ($params['OFFERS_LIMIT'] == 0)
			$params["OFFERS_LIMIT"] = PHP_INT_MAX;

		$params['MESS_BTN_BUY'] = trim($params['MESS_BTN_BUY']);
		$params['MESS_BTN_ADD_TO_BASKET'] = trim($params['MESS_BTN_ADD_TO_BASKET']);
		$params['MESS_BTN_SUBSCRIBE'] = trim($params['MESS_BTN_SUBSCRIBE']);
		$params['MESS_BTN_DETAIL'] = trim($params['MESS_BTN_DETAIL']);
		$params['MESS_NOT_AVAILABLE'] = trim($params['MESS_NOT_AVAILABLE']);

		if ('Y' != $params['SHOW_DISCOUNT_PERCENT'])
			$params['SHOW_DISCOUNT_PERCENT'] = 'N';
		if ('Y' != $params['SHOW_OLD_PRICE'])
			$params['SHOW_OLD_PRICE'] = 'N';
		if ('Y' != $params['PRODUCT_SUBSCRIPTION'])
			$params['PRODUCT_SUBSCRIPTION'] = 'N';

		$params['PROPERTY_CODE'] = array();
		$params['ADDITIONAL_PICT_PROP'] = array();
		$params['LABEL_PROP'] = array();
		$params['OFFER_TREE_PROPS'] = array();
		$params['CART_PROPERTIES'] = array();
		$params['SHOW_PRODUCTS'] = array();

		foreach ($params as $name => $prop)
		{
			// Property code
			if (preg_match("/^PROPERTY_CODE_(\d+)$/", $name, $arMatches))
			{
				$iBlockID = (int)$arMatches[1];
				if($iBlockID <= 0)
					continue;

				foreach ($params[$name] as $k => $v)
					if ($v === "")
						unset($params[$name][$k]);
				$params['PROPERTY_CODE'][$iBlockID] = $params[$name];
				unset($params[$arMatches[0]]);
			} // Additional Picture property
			elseif (preg_match("/^ADDITIONAL_PICT_PROP_(\d+)$/", $name, $arMatches))
			{
				$iBlockID = (int)$arMatches[1];
				if($iBlockID <= 0)
					continue;

				if ($params[$name] != "" && $params[$name] != "-")
				{
					$params['ADDITIONAL_PICT_PROP'][$iBlockID] = $params[$name];
				}
				unset($params[$arMatches[0]]);
			} //
			elseif (preg_match("/^LABEL_PROP_(\d+)$/", $name, $arMatches))
			{
				$iBlockID = (int)$arMatches[1];
				if($iBlockID <= 0)
					continue;

				if ($params[$name] != "" && $params[$name] != "-")
				{
					$params['LABEL_PROP'][$iBlockID] = $params[$name];
				}
				unset($params[$arMatches[0]]);
			} // Offer Group property
			elseif (preg_match("/^OFFER_TREE_PROPS_(\d+)$/", $name, $arMatches))
			{
				$iBlockID = (int)$arMatches[1];
				if($iBlockID <= 0)
					continue;

				foreach ($params[$name] as $k => $v)
					if ($v == "" || $v == "-")
						unset($params[$name][$k]);
				$params['OFFER_TREE_PROPS'][$iBlockID] = $params[$name];
				unset($params[$arMatches[0]]);
			} // Add to Basket Props
			elseif (preg_match("/^CART_PROPERTIES_(\d+)$/", $name, $arMatches))
			{
				$iBlockID = (int)$arMatches[1];
				if($iBlockID <= 0)
					continue;

				foreach ($params[$name] as $k => $v)
					if ($v == "" || $v == "-")
						unset($params[$name][$k]);

				$params['CART_PROPERTIES'][$iBlockID] = $params[$name];
				unset($params[$arMatches[0]]);
			}
			// Show products
			elseif (preg_match("/^SHOW_PRODUCTS_(\d+)$/", $name, $arMatches))
			{
				$iBlockID = (int)$arMatches[1];
				if($iBlockID <= 0)
					continue;

				if ($params[$name] == "Y")
					$params['SHOW_PRODUCTS'][$iBlockID] = true;

				unset($params[$arMatches[0]]);
			}
		}

		if (!is_array($params["PRICE_CODE"]))
			$params["PRICE_CODE"] = array();

		$params["SHOW_PRICE_COUNT"] = intval($params["SHOW_PRICE_COUNT"]);
		if ($params["SHOW_PRICE_COUNT"] <= 0)
			$params["SHOW_PRICE_COUNT"] = 1;


		if (empty($params['HIDE_NOT_AVAILABLE']))
			$params['HIDE_NOT_AVAILABLE'] = 'N';
		elseif ('Y' != $params['HIDE_NOT_AVAILABLE'])
			$params['HIDE_NOT_AVAILABLE'] = 'N';

		if (empty($params['SHOW_IMAGE']))
			$params['SHOW_IMAGE'] = 'Y';

		if (empty($params['SHOW_NAME']))
			$params['SHOW_NAME'] = 'Y';

		$params["PRICE_VAT_INCLUDE"] = $params["PRICE_VAT_INCLUDE"] !== "N";
		$params['CONVERT_CURRENCY'] = (isset($params['CONVERT_CURRENCY']) && 'Y' == $params['CONVERT_CURRENCY'] ? 'Y' : 'N');
		$params['CURRENCY_ID'] = trim(strval($params['CURRENCY_ID']));
		if ('' == $params['CURRENCY_ID'])
		{
			$params['CONVERT_CURRENCY'] = 'N';
		}
		elseif ('N' == $params['CONVERT_CURRENCY'])
		{
			$params['CURRENCY_ID'] = '';
		}

		$params['SECTION_CODE'] = (isset($params['SECTION_CODE']) ? trim($params['SECTION_CODE']) : '');
		$params['SECTION_ID'] = (isset($params['SECTION_ID']) ? (int)$params['SECTION_ID'] : 0);
		$params['IBLOCK_ID'] = (isset($params['IBLOCK_ID']) ? (int)$params['IBLOCK_ID'] : 0);
		$params['SECTION_ELEMENT_ID'] = (isset($params['SECTION_ELEMENT_ID']) ? (int)$params['SECTION_ELEMENT_ID'] : 0);
		$params['SECTION_ELEMENT_CODE'] = (isset($params['SECTION_ELEMENT_CODE']) ? trim($params['SECTION_ELEMENT_CODE']) : '');

		return $params;
	}

	protected function checkSection($sectionId = -1, $sectionCode = "")
	{
		if ($this->arParams['IBLOCK_ID'] <= 0)
			return 0;
		$bSectionFound = false;
		$sectionFilter = array(
			"IBLOCK_ID" => $this->arParams['IBLOCK_ID'],
			"IBLOCK_ACTIVE" => "Y",
		);

		$id = 0;
		if ($sectionId > 0)
		{
			$sectionFilter["ID"] = $sectionId;
			$sectionIt = CIBlockSection::GetList(array(), $sectionFilter, false, array("ID"));
			if($section = $sectionIt->Fetch())
			{
				$id = $section['ID'];
				$bSectionFound = true;
			}
		}
		if (!$bSectionFound && $sectionCode !== '')
		{
			$sectionFilter["=CODE"] = $sectionCode;
			$sectionIt = CIBlockSection::getList(array(), $sectionFilter, false, array("ID"));
			if($section = $sectionIt->Fetch())
			{
				$id = $section['ID'];
			}
		}
		return $id;
	}

	protected function checkSectionByElement($elementID, $elementCode = '')
	{
		if ($this->arParams['IBLOCK_ID'] <= 0)
			return 0;
		$sectionID = 0;
		$elementID = (int)$elementID;
		$elementCode = (string)$elementCode;
		if ($elementID > 0)
		{
			$itemIterator = CIBlockElement::GetList(
				array(),
				array('ID' => $elementID, 'IBLOCK_ID' => $this->arParams['IBLOCK_ID']),
				false,
				false,
				array('ID', 'IBLOCK_SECTION_ID')
			);
			if ($item = $itemIterator->Fetch())
			{
				$sectionID = (int)$item['IBLOCK_SECTION_ID'];
			}
		}
		if ($sectionID == 0 && $elementCode !== '')
		{
			$itemIterator = CIBlockElement::GetList(
				array(),
				array('IBLOCK_ID' => $this->arParams['IBLOCK_ID'], '=CODE' => $elementCode),
				false,
				false,
				array('ID', 'IBLOCK_SECTION_ID')
			);
			if ($item = $itemIterator->Fetch())
			{
				$sectionID = (int)$item['IBLOCK_SECTION_ID'];
			}
		}

		return $sectionID;
	}

	/**
	 * Returns viewed product ids.
	 * @return integer[]
	 */
	protected function getProductIds()
	{
		$basketUserID = (int)CSaleBasket::GetBasketUserID(false);
		if ($basketUserID <= 0)
			return array();
		$sectionSearch = $this->arParams["SECTION_ID"] > 0 || $this->arParams["SECTION_CODE"] !== '';
		$sectionByItemSearch = $this->arParams["SECTION_ELEMENT_ID"] > 0 || $this->arParams["SECTION_ELEMENT_CODE"] !== '';
		$ids = array();
		if (!$sectionSearch && !$sectionByItemSearch)	// no section specified
		{
			$viewedIterator = CatalogViewedProductTable::GetList(array(
				'select' => array('PRODUCT_ID'),
				'filter' => array('FUSER_ID' => $basketUserID, 'SITE_ID' => SITE_ID),
				'order' => array('DATE_VISIT' => 'DESC'),
				'limit' => $this->arParams['PAGE_ELEMENT_COUNT']
			));

			while ($viewedProduct = $viewedIterator->fetch())
			{
				$ids[] = $viewedProduct['PRODUCT_ID'];
			}
		}
		else
		{
			if ($sectionSearch)
			{
				$section = $this->checkSection($this->arParams["SECTION_ID"], $this->arParams["SECTION_CODE"]);
			}
			else
			{
				$section = $this->checkSectionByElement($this->arParams["SECTION_ELEMENT_ID"], $this->arParams["SECTION_ELEMENT_CODE"]);
			}
			if(!$section)
				return array();

			$viewedIterator = CatalogViewedProductTable::GetList(array(
				'select' => array('PRODUCT_ID'),
				'filter' => array('FUSER_ID' => $basketUserID, 'SITE_ID' => SITE_ID),
				'order' => array('DATE_VISIT' => 'DESC'),
				'limit' => self::MAX_VIEWED_COUNT
			));

			while ($viewedProduct = $viewedIterator->fetch())
			{
				$ids[] = $viewedProduct['PRODUCT_ID'];
			}

			if (empty($ids))
				return array();

			$mappedIds = CatalogViewedProductTable::getProductsMap($ids);
			if (empty($mappedIds))
				return array();
			$elementIterator = CIBlockElement::getList(
				array(),
				array(
					'ID' => array_values($mappedIds),
					'IBLOCK_ID' => $this->arParams['IBLOCK_ID'],
					'SECTION_ID' => $section,
					'INCLUDE_SUBSECTIONS' => 'Y'
				),
				false,
				array('nTopCount' => $this->arParams['PAGE_ELEMENT_COUNT']),
				array('ID', 'IBLOCK_ID')
			);

			$ids = array();
			while ($element = $elementIterator->fetch())
			{
				$ids[] = $element['ID'];
			}

			// resort by original
			$newIds = array();
			foreach($mappedIds as $original => $mapped)
			{
				if(in_array($mapped, $ids))
					$newIds[] = $mapped;
			}
			$ids = $newIds;
		}

		return $ids;
	}

	/**
	 * Return converted product ids map. Additionally creates sku tree from input products.
	 * (see description form above).
	 *
	 * @param array $ids source product ids
	 *
	 * @return mixed[]      array("MAP" => array(...), "TREE" => array(...))
	 */
	private function getProductIdsMap(array $ids = array())
	{
		if (empty($ids))
			return array(array(), array());

		$newIds = array();
		$skuTree = array();
		$catalogs = $this->data['CATALOG'];

		foreach ($catalogs as $catalog)
		{
			if ($catalog['CATALOG_TYPE'] == CCatalogSKU::TYPE_OFFERS)
			{
				$elementIterator = CIBlockElement::getList(
					array(),
					array("ID" => $ids, "IBLOCK_ID" => $catalog['IBLOCK_ID']),
					false,
					false,
					array("ID", "IBLOCK_ID", "PROPERTY_" . $catalog['SKU_PROPERTY_ID'])
				);

				while ($item = $elementIterator->fetch())
				{
					$propertyName = "PROPERTY_" . $catalog['SKU_PROPERTY_ID'] . "_VALUE";
					$parentId = $item[$propertyName];
					if (!empty($parentId))
					{
						$newIds[$item['ID']] = $parentId;
						if (!isset($skuTree[$parentId]))
							$skuTree[$parentId] = array();
						$skuTree[$parentId][] = $item['ID'];
					}
					else
					{
						$newIds[$item['ID']] = $item['ID'];
					}
				}
			}
		}

		// Push missing
		foreach ($ids as $id)
		{
			if (!isset($newIds[$id]))
			{
				$newIds[$id] = $id;
			}
		}

		// Resort map
		$tmpMap = array();
		foreach ($ids as $id)
		{
			$tmpMap[$id . ""] = $newIds[$id];
		}

		return array($tmpMap, $skuTree);
	}


	/**
	 * Resort $items field according to input ids parameter
	 *
	 * @param $productIds
	 */
	protected function resortItemsByIds($productIds)
	{
		$tmpItems = array();

		foreach ($productIds as $prodId)
		{
			$parentId = $this->productIdsMap[$prodId];
			if (isset($this->items[$parentId])) // always
			{
				$tmpItems[$prodId] = $this->items[$parentId];
				if (isset($this->skuTree[$parentId]))
					$tmpItems[$prodId]['IS_CONVERTED'] = true;
			}
		}

		$this->items = $tmpItems;
	}

	/**
	 * Get common data from cache.
	 * @return mixed[]
	 */
	protected function getReferences()
	{
		global $USER;
		$this->arParams['CACHE_GROUPS'] = (isset($this->arParams['CACHE_GROUPS']) && $this->arParams['CACHE_GROUPS'] == 'N' ? 'N' : 'Y');
		$obCache = new CPHPCache;
		if ($this->arParams['CACHE_GROUPS'] == 'Y')
		{
			$cacheId = implode("-", array(__CLASS__, LANGUAGE_ID, SITE_ID, $USER->GetGroups()));
		}
		else
		{
			$cacheId = implode("-", array(__CLASS__, LANGUAGE_ID, SITE_ID));
		}

		$cached = array();
		if ($obCache->StartDataCache($this->arParams["CACHE_TIME"], $cacheId, SITE_ID.'/'.$this->getRelativePath().'/reference'))
		{
			// Catalog Groups
			$cached['CATALOG_GROUP'] = array();
			$catalogGroupIterator = CCatalogGroup::GetList(
				array("SORT" => "ASC")
			);
			while ($catalogGroup = $catalogGroupIterator->fetch())
			{
				$cached['CATALOG_GROUP'][$catalogGroup['NAME']] = $catalogGroup;
			}

			// Catalog Prices
			$cached['CATALOG_PRICE'] = CIBlockPriceTools::GetCatalogPrices(false, array_keys($cached['CATALOG_GROUP']));

			// Catalog Currency
			$cached['CURRENCY'] = array();
			if ($this->isCurrency)
			{
				$by = "currency";
				$order = "asc";
				$currencyIterator = CCurrency::getList($by, $order);
				while ($currency = $currencyIterator->fetch())
				{
					$cached['CURRENCY'][$currency['CURRENCY']] = $currency;
				}
			}

			// Catalogs list
			$cached['CATALOG'] = array();
			$catalogIterator = CCatalog::getList(array("IBLOCK_ID" => "ASC"));
			while ($catalog = $catalogIterator->fetch())
			{
				$info = CCatalogSku::getInfoByIblock($catalog['IBLOCK_ID']);
				$catalog['CATALOG_TYPE'] = $info['CATALOG_TYPE'];
				$cached['CATALOG'][$catalog['IBLOCK_ID']] = $catalog;
			}

			// Measure list
			$cached['MEASURE'] = array();
			$measureIterator = CCatalogMeasure::getList(array("CODE" => "ASC"));
			while ($measure = $measureIterator->fetch())
			{
				$cached['MEASURE'][$measure['ID']] = $measure;
			}

			// Default Measure
			$cached['DEFAULT_MEASURE'] = CCatalogMeasure::getDefaultMeasure(true, true);

			$obCache->EndDataCache($cached);
		}
		else
		{
			$cached = $obCache->GetVars();
		}

		return $cached;
	}

	/**
	 * Get items for view.
	 * @return mixed[]  array('ID' => array(), 'ID' => array(), ...)
	 */
	protected function getItems()
	{
		if (empty($this->productIdsMap) || empty($this->arParams['SHOW_PRODUCTS']))
			return array();

		$elementIterator = CIBlockElement::GetList(array(), $this->filter, false, false, $this->selectFields);
		$elementIterator->SetUrlTemplates($this->arParams["DETAIL_URL"]);
		$defaultMeasure = $this->data['DEFAULT_MEASURE'];
		$items = array();
		while ($elementObj = $elementIterator->GetNextElement())
		{
			$item = $elementObj->GetFields();
			$item['ID'] = intval($item['ID']);

			$item['ACTIVE_FROM'] = $item['DATE_ACTIVE_FROM'];
			$item['ACTIVE_TO'] = $item['DATE_ACTIVE_TO'];

			// Inherited Properties
			$ipropValues = new \Bitrix\Iblock\InheritedProperty\ElementValues($item["IBLOCK_ID"], $item["ID"]);
			$item["IPROPERTY_VALUES"] = $ipropValues->getValues();

			$item["PREVIEW_PICTURE"] = (0 < $item["PREVIEW_PICTURE"] ? CFile::GetFileArray($item["PREVIEW_PICTURE"]) : false);
			if ($item["PREVIEW_PICTURE"])
			{
				$item["PREVIEW_PICTURE"]["ALT"] = $item["IPROPERTY_VALUES"]["ELEMENT_PREVIEW_PICTURE_FILE_ALT"];
				if ($item["PREVIEW_PICTURE"]["ALT"] == "")
					$item["PREVIEW_PICTURE"]["ALT"] = $item["NAME"];
				$item["PREVIEW_PICTURE"]["TITLE"] = $item["IPROPERTY_VALUES"]["ELEMENT_PREVIEW_PICTURE_FILE_TITLE"];
				if ($item["PREVIEW_PICTURE"]["TITLE"] == "")
					$item["PREVIEW_PICTURE"]["TITLE"] = $item["NAME"];
			}
			$item["DETAIL_PICTURE"] = (0 < $item["DETAIL_PICTURE"] ? CFile::GetFileArray($item["DETAIL_PICTURE"]) : false);
			if ($item["DETAIL_PICTURE"])
			{
				$item["DETAIL_PICTURE"]["ALT"] = $item["IPROPERTY_VALUES"]["ELEMENT_DETAIL_PICTURE_FILE_ALT"];
				if ($item["DETAIL_PICTURE"]["ALT"] == "")
					$item["DETAIL_PICTURE"]["ALT"] = $item["NAME"];
				$item["DETAIL_PICTURE"]["TITLE"] = $item["IPROPERTY_VALUES"]["ELEMENT_DETAIL_PICTURE_FILE_TITLE"];
				if ($item["DETAIL_PICTURE"]["TITLE"] == "")
					$item["DETAIL_PICTURE"]["TITLE"] = $item["NAME"];
			}

			$itemIblockId = (int)$item['IBLOCK_ID'];
			$needItemProperties = (isset($this->arParams['PROPERTY_CODE'][$itemIblockId]) && !empty($this->arParams['PROPERTY_CODE'][$itemIblockId])) ||
				isset($this->arParams['ADDITIONAL_PICT_PROP'][$itemIblockId]) ||
				isset($this->arParams['LABEL_PROP'][$itemIblockId]);

			$item["PROPERTIES"] = array();
			$item["DISPLAY_PROPERTIES"] = array();

			if ($needItemProperties)
			{
				$item["PROPERTIES"] = $elementObj->getProperties();
				CCatalogDiscount::SetProductPropertiesCache($item['ID'], $item["PROPERTIES"]);
			}
			if (isset($this->arParams['PROPERTY_CODE'][$item['IBLOCK_ID']]))
			{
				$properties = $this->arParams['PROPERTY_CODE'][$item['IBLOCK_ID']];
				foreach ($properties as $propertyName)
				{
					if (!isset($item["PROPERTIES"][$propertyName]))
						continue;

					$prop = & $item["PROPERTIES"][$propertyName];
					$boolArr = is_array($prop["VALUE"]);
					if (
						($boolArr && !empty($prop["VALUE"]))
						|| (!$boolArr && strlen($prop["VALUE"]) > 0)
					)
					{
						$item["DISPLAY_PROPERTIES"][$propertyName] = CIBlockFormatProperties::GetDisplayValue($item, $prop, "catalog_out");
					}
				}
			}

			$item["PRODUCT_PROPERTIES"] = array();
			$item['PRODUCT_PROPERTIES_FILL'] = array();

			if ($this->arParams['ADD_PROPERTIES_TO_BASKET'] == 'Y' && !empty($this->arParams['CART_PROPERTIES'][$item['IBLOCK_ID']]))
			{
				$item["PRODUCT_PROPERTIES"] = CIBlockPriceTools::GetProductProperties(
					$item['IBLOCK_ID'],
					$item["ID"],
					$this->arParams['CART_PROPERTIES'][$item['IBLOCK_ID']],
					$item["PROPERTIES"]
				);

				if (!empty($item["PRODUCT_PROPERTIES"]))
				{
					$item['PRODUCT_PROPERTIES_FILL'] = CIBlockPriceTools::getFillProductProperties($item['PRODUCT_PROPERTIES']);
				}
			}


			if (!isset($item["CATALOG_MEASURE_RATIO"]))
				$item["CATALOG_MEASURE_RATIO"] = 1;
			if (!isset($item['CATALOG_MEASURE']))
				$item['CATALOG_MEASURE'] = 0;
			$item['CATALOG_MEASURE'] = intval($item['CATALOG_MEASURE']);
			if (0 > $item['CATALOG_MEASURE'])
				$item['CATALOG_MEASURE'] = 0;
			if (!isset($item['CATALOG_MEASURE_NAME']))
				$item['CATALOG_MEASURE_NAME'] = '';

			$item['CATALOG_MEASURE_NAME'] = $defaultMeasure['SYMBOL_RUS'];
			$item['~CATALOG_MEASURE_NAME'] = $defaultMeasure['~SYMBOL_RUS'];

			$items[$item['ID']] = $item;
		}

		return $items;
	}

	/**
	 * Gets catalog prices needed for component.
	 *
	 * @param array $priceCodes
	 */
	protected function getCatalogPrices(array $priceCodes = array())
	{
		$catalogPrices = array();
		foreach ($priceCodes as $code)
		{
			if (isset($this->data['CATALOG_PRICE'][$code]))
				$catalogPrices[$code] = $this->data['CATALOG_PRICE'][$code];
		}
		return $catalogPrices;
	}


	/**
	 * Get main data - viewed products.
	 * @return void
	 */
	protected function prepareData()
	{
		$this->data = $this->getReferences();
		$this->productIds = $this->getProductIds();
		list($this->productIdsMap, $this->skuTree) = $this->getProductIdsMap($this->productIds);
		$this->data['CATALOG_PRICES'] = $this->getCatalogPrices($this->arParams["PRICE_CODE"]);
		$this->prepareFilter();
		$this->prepareSelectFields();
		$this->items = $this->getItems();
		$this->resortItemsByIds($this->productIds);

		$this->setItemsPrices();
		$this->setItemsMeasure();
		$this->setItemsOffers();
	}

	/**
	 * Prepare data to render.
	 * @return void
	 */
	protected function formatResult()
	{
		$this->arResult['ITEMS'] = $this->items;
		$this->arResult['CONVERT_CURRENCY'] = $this->data['CONVERT_CURRENCY'];
		$this->arResult['CATALOGS'] = $this->data['CATALOG'];
		$this->arResult['SKU_TREE'] = $this->skuTree;
		$this->arResult['ERRORS'] = $this->errors;
		$this->arResult['WARNINGS'] = $this->warnings;
	}

	/**
	 * set prices for all items
	 * @return array currency list
	 */
	protected function setItemsPrices()
	{
		global $APPLICATION;
		// Get Available prices

		$prices = $this->data['CATALOG_PRICES'];

		// Convert params
		$convertParams = array();
		if ('Y' == $this->arParams['CONVERT_CURRENCY'])
		{
			if (!$this->isCurrency)
			{
				$this->arParams['CONVERT_CURRENCY'] = 'N';
				$this->arParams['CURRENCY_ID'] = '';
			}
			else
			{
				$currencyInfo = $this->data['CURRENCY'][$this->arParams['CURRENCY_ID']];
				if (!empty($currencyInfo) && is_array($currencyInfo))
				{
					$this->arParams['CURRENCY_ID'] = $currencyInfo['CURRENCY'];
					$convertParams['CURRENCY_ID'] = $currencyInfo['CURRENCY'];
				}
				else
				{
					$this->arParams['CONVERT_CURRENCY'] = 'N';
					$this->arParams['CURRENCY_ID'] = '';
				}
			}
		}

		$this->data['CONVERT_CURRENCY'] = $convertParams;

		//  Set items Prices
		foreach ($this->items as &$item)
		{
			$item["PRICES"] = array();
			$item['MIN_PRICE'] = false;

			$item["PRICES"] = CIBlockPriceTools::GetItemPrices($item['IBLOCK_ID'], $prices, $item, $this->arParams['PRICE_VAT_INCLUDE'], $convertParams);
			if (!empty($item["PRICES"]))
			{
				foreach ($item['PRICES'] as &$onePrice)
				{
					if ('Y' == $onePrice['MIN_PRICE'])
					{
						$item['MIN_PRICE'] = $onePrice;
						break;
					}
				}
				unset($onePrice);
			}


			$item["CAN_BUY"] = CIBlockPriceTools::CanBuy($item['IBLOCK_ID'], $prices, $item);
			// Action links
			$item["~BUY_URL"] = $APPLICATION->GetCurPageParam($this->arParams["ACTION_VARIABLE"] . "=BUY&" . $this->arParams["PRODUCT_ID_VARIABLE"] . "=" . $item["ID"], array($this->arParams["PRODUCT_ID_VARIABLE"], $this->arParams["ACTION_VARIABLE"]));
			$item["BUY_URL"] = htmlspecialcharsbx($item["~BUY_URL"]);
			$item["~ADD_URL"] = $APPLICATION->GetCurPageParam($this->arParams["ACTION_VARIABLE"] . "=ADD2BASKET&" . $this->arParams["PRODUCT_ID_VARIABLE"] . "=" . $item["ID"], array($this->arParams["PRODUCT_ID_VARIABLE"], $this->arParams["ACTION_VARIABLE"]));
			$item["ADD_URL"] = htmlspecialcharsbx($item["~ADD_URL"]);
			$item["~COMPARE_URL"] = $APPLICATION->GetCurPageParam("action=ADD_TO_COMPARE_LIST&id=" . $item["ID"], array("action", "id"));
			$item["COMPARE_URL"] = htmlspecialcharsbx($item["~COMPARE_URL"]);
			$item["~SUBSCRIBE_URL"] = $APPLICATION->GetCurPageParam($this->arParams["ACTION_VARIABLE"] . "=SUBSCRIBE_PRODUCT&" . $this->arParams["PRODUCT_ID_VARIABLE"] . "=" . $item["ID"], array($this->arParams["PRODUCT_ID_VARIABLE"], $this->arParams["ACTION_VARIABLE"]));
			$item["SUBSCRIBE_URL"] = htmlspecialcharsbx($item["~SUBSCRIBE_URL"]);
		}
	}

	/**
	 * Sets measure for all viewed products.
	 * @return void
	 */
	protected function setItemsMeasure()
	{
		if (!count($this->productIdsMap))
			return;

		$measures = $this->data['MEASURE'];
		foreach ($this->items as &$item)
		{
			if (array_key_exists($item['CATALOG_MEASURE'], $measures))
			{
				$measure = $measures[$item['CATALOG_MEASURE']];
				$item['~CATALOG_MEASURE_NAME'] = (LANGUAGE_ID == "ru") ? $measure["SYMBOL_RUS"] : $measure["SYMBOL_INTL"];
				$item['CATALOG_MEASURE_NAME'] = String::htmlEncode($item['~CATALOG_MEASURE_NAME']);
			}
		}

		// Ratios
		$ratioIterator = CCatalogMeasureRatio::getList(
			array(),
			array('@PRODUCT_ID' => array_values($this->productIdsMap)),
			false,
			false,
			array('PRODUCT_ID', 'RATIO')
		);

		while ($ratio = $ratioIterator->fetch())
		{
			if (isset($this->items[$ratio['PRODUCT_ID']]))
			{
				$intRatio = intval($ratio['RATIO']);
				$dblRatio = doubleval($ratio['RATIO']);
				$mxRatio = ($dblRatio > $intRatio ? $dblRatio : $intRatio);
				if (CATALOG_VALUE_EPSILON > abs($mxRatio))
					$mxRatio = 1;
				elseif (0 > $mxRatio)
					$mxRatio = 1;
				$this->items[$ratio['PRODUCT_ID']]['CATALOG_MEASURE_RATIO'] = $mxRatio;
			}
		}
	}

	/**
	 * Add offers for each catalog product.
	 * @return void
	 */
	protected function setItemsOffers()
	{
		global $APPLICATION;

		// filter items to get only product type (not offers)
		$fullProductIds = array(); //
		$productIblocks = array();
		foreach ($this->data['CATALOG'] as $catalog)
		{
			if ($catalog['CATALOG_TYPE'] == CCatalogSKU::TYPE_FULL)
			{
				$productIblocks[] = $catalog;
				foreach ($this->items as $item)
				{
					if ($item['IBLOCK_ID'] == $catalog['IBLOCK_ID'])
						$fullProductIds[] = $item['ID'];
				}
			}
		}

		if (empty($fullProductIds))
			return;

		$fullProductIds = array_unique($fullProductIds);

		// Get total offers for all catalog products
		$totalOffers = array();
		foreach ($productIblocks as $iblock)
		{
			//if(empty($this->arParams['OFFER_TREE_PROPS'][$iblock['OFFERS_IBLOCK_ID']]) || empty($this->arParams['PROPERTY_CODE'][$iblock['OFFERS_IBLOCK_ID']]))
			//	continue;

			if(!isset($this->arParams['PROPERTY_CODE'][$iblock['OFFERS_IBLOCK_ID']]) && !is_array($this->arParams['PROPERTY_CODE'][$iblock['OFFERS_IBLOCK_ID']]))
				$this->arParams['PROPERTY_CODE'][$iblock['OFFERS_IBLOCK_ID']] = array();

			if(!isset($this->arParams['OFFER_TREE_PROPS'][$iblock['OFFERS_IBLOCK_ID']]) && !is_array($this->arParams['OFFER_TREE_PROPS'][$iblock['OFFERS_IBLOCK_ID']]))
				$this->arParams['OFFER_TREE_PROPS'][$iblock['OFFERS_IBLOCK_ID']] = array();

			$selectProperties = array_merge($this->arParams['PROPERTY_CODE'][$iblock['OFFERS_IBLOCK_ID']], $this->arParams['OFFER_TREE_PROPS'][$iblock['OFFERS_IBLOCK_ID']]);
			$offers = CIBlockPriceTools::GetOffersArray(
				array(
					'IBLOCK_ID' => $iblock['IBLOCK_ID'],
					'HIDE_NOT_AVAILABLE' => $this->arParams['HIDE_NOT_AVAILABLE'],
				)
				, $fullProductIds
				, array()
				, array("ID", "CODE", "NAME", "SORT", "PREVIEW_PICTURE", "DETAIL_PICTURE")
				, $selectProperties
				, $this->arParams["OFFERS_LIMIT"]
				, $this->data['CATALOG_PRICES']
				, $this->arParams['PRICE_VAT_INCLUDE']
				, $this->data['CONVERT_CURRENCY']
			);
			$totalOffers = array_merge($totalOffers, $offers);
		}

		if (empty($totalOffers))
			return;

		foreach ($totalOffers as $offer)
		{

			$offer["~BUY_URL"] = $APPLICATION->GetCurPageParam($this->arParams["ACTION_VARIABLE"] . "=BUY&" . $this->arParams["PRODUCT_ID_VARIABLE"] . "=" . $offer["ID"], array($this->arParams["PRODUCT_ID_VARIABLE"], $this->arParams["ACTION_VARIABLE"]));
			$offer["BUY_URL"] = htmlspecialcharsbx($offer["~BUY_URL"]);
			$offer["~ADD_URL"] = $APPLICATION->GetCurPageParam($this->arParams["ACTION_VARIABLE"] . "=ADD2BASKET&" . $this->arParams["PRODUCT_ID_VARIABLE"] . "=" . $offer["ID"], array($this->arParams["PRODUCT_ID_VARIABLE"], $this->arParams["ACTION_VARIABLE"]));
			$offer["ADD_URL"] = htmlspecialcharsbx($offer["~ADD_URL"]);
			$offer["~COMPARE_URL"] = $APPLICATION->GetCurPageParam("action=ADD_TO_COMPARE_LIST&id=" . $offer["ID"], array($this->arParams["PRODUCT_ID_VARIABLE"], $this->arParams["ACTION_VARIABLE"]));
			$offer["COMPARE_URL"] = htmlspecialcharsbx($offer["~COMPARE_URL"]);
			$offer["~SUBSCRIBE_URL"] = $APPLICATION->GetCurPageParam($this->arParams["ACTION_VARIABLE"] . "=SUBSCRIBE_PRODUCT&id=" . $offer["ID"], array($this->arParams["PRODUCT_ID_VARIABLE"], $this->arParams["ACTION_VARIABLE"]));
			$offer["SUBSCRIBE_URL"] = htmlspecialcharsbx($offer["~SUBSCRIBE_URL"]);

			$linkId = (int)$offer['LINK_ELEMENT_ID'];
			foreach ($this->items as &$item)
			{
				if (!isset($item['OFFERS']))
					$item['OFFERS'] = array();
				if ($linkId == $item['ID'])
				{
					$item['OFFERS'][] = $offer;
				}
			}
			unset($item);
		}

		// set selected flag
		foreach ($this->items as $key => &$item)
		{
			$index = 0;
			foreach ($item['OFFERS'] as $offerKey => &$offer)
			{
				$offer['SELECTED'] = ($offer['ID'] == $key);
				if ($offer['SELECTED'])
				{
					$index = $offerKey;
				}
			}
			$item['OFFERS_SELECTED'] = $index;
		}

		unset($item);
		unset($offer);
	}

	/**
	 * Prepares $this->filter for CIBlockElement::getList() method.
	 * @return void
	 */
	protected function prepareFilter()
	{
		$prices = $this->data['CATALOG_PRICES'];

		$this->filter = array(
			"ID" => empty($this->productIdsMap) ? -1 : array_values($this->productIdsMap),
			"IBLOCK_LID" => SITE_ID,
			"IBLOCK_ACTIVE" => "Y",
			"ACTIVE_DATE" => "Y",
			"ACTIVE" => "Y",
			"CHECK_PERMISSIONS" => "Y",
			"MIN_PERMISSION" => "R",
			"IBLOCK_ID" => array_keys($this->arParams['SHOW_PRODUCTS'])
		);

		// find section
	/*	$bSectionFound = false;
		$sectionFilter = array(
			"IBLOCK_ID" => $this->arParams['IBLOCK_ID'] > 0 ? $this->arParams['IBLOCK_ID'] : -1,
			"IBLOCK_ACTIVE"=>"Y",
		);

		$sectionId = 0;
		if($this->arParams["SECTION_ID"] > 0)
		{
			$sectionFilter["ID"] = $this->arParams["SECTION_ID"];
			$sectionIt = CIBlockSection::GetList(array(), $sectionFilter, false, array("ID"));
			if($section = $sectionIt->getNext())
			{
				$sectionId = $section['ID'];
				$bSectionFound = true;
			}
		}
		if(!$bSectionFound && strlen($this->arParams["SECTION_CODE"]) > 0)
		{
			$sectionFilter["=CODE"] = $this->arParams["SECTION_CODE"];
			$sectionIt = CIBlockSection::getList(array(), $sectionFilter, false, array("ID"));
			if($section = $sectionIt->getNext())
			{
				$sectionId = $section['ID'];
				$bSectionFound = true;
			}
		}

		if($bSectionFound)
		{
			$this->filter["IBLOCK_ID"] = $this->arParams['IBLOCK_ID'];
			$this->filter['SECTION_ID'] = $sectionId;
			$this->filter['INCLUDE_SUBSECTIONS'] = "Y";
		}
		*/
		if ('Y' == $this->arParams['HIDE_NOT_AVAILABLE'])
			$filter['CATALOG_AVAILABLE'] = 'Y';


		foreach ($prices as $value)
		{
			if (!$value['CAN_VIEW'] && !$value['CAN_BUY'])
				continue;
			$this->filter["CATALOG_SHOP_QUANTITY_" . $value["ID"]] = $this->arParams["SHOW_PRICE_COUNT"];
		}
	}

	/**
	 * Prepares $this->selectFields for CIBlockElement::getList() method.
	 * @return void
	 */
	protected function prepareSelectFields()
	{
		$this->selectFields = array(
			"ID",
			"IBLOCK_ID",
			"CODE",
			"NAME",
			"ACTIVE",
			"DATE_ACTIVE_FROM",
			"DATE_ACTIVE_TO",
			"DETAIL_PAGE_URL",
			"DETAIL_PICTURE",
			"PREVIEW_PICTURE"
		);

		$prices = $this->data['CATALOG_PRICES'];

		foreach ($prices as $value)
		{
			if (!$value['CAN_VIEW'] && !$value['CAN_BUY'])
				continue;
			$this->selectFields[] = $value["SELECT"];
		}

	}

	/**
	 * Extract data from cache. No action by default.
	 * @return bool
	 */
	protected function extractDataFromCache()
	{
		return false;
	}

	protected function putDataToCache()
	{
	}

	protected function abortDataCache()
	{
	}

	/**
	 * Start Component
	 */
	public function executeComponent()
	{
		global $APPLICATION;
		try
		{
			$this->checkModules();
			$this->processRequest();
			if (!$this->extractDataFromCache())
			{
				$this->prepareData();
				$this->formatResult();
				$this->setResultCacheKeys(array());
				$this->includeComponentTemplate();
				$this->putDataToCache();
			}
		}
		catch (SystemException $e)
		{
			$this->abortDataCache();

			if ($this->isAjax())
			{
				$APPLICATION->restartBuffer();
				echo CUtil::PhpToJSObject(array('STATUS' => 'ERROR', 'MESSAGE' => $e->getMessage()));
				die();
			}

			ShowError($e->getMessage());
		}
	}
}

?>