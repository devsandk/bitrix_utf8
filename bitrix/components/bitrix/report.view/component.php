<?

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

$requiredModules = array('report');

foreach ($requiredModules as $requiredModule)
{
	if (!CModule::IncludeModule($requiredModule))
	{
		ShowError(GetMessage("F_NO_MODULE"));
		return 0;
	}
}

// Suppress the timezone, while report works in server time
CTimeZone::Disable();

use Bitrix\Main\Entity;

// <editor-fold defaultstate="collapsed" desc="period types">
$periodTypes =
$arResult['periodTypes'] = array(
	'month',
	'month_ago',
	'week',
	'week_ago',
	'days',
	'after',
	'before',
	'interval',
	'all'
);
// </editor-fold>

// <editor-fold defaultstate="collapsed" desc="chart types">
if ($arParams['USE_CHART'])
{
	$arResult['chartTypes'] = array(
		array('id' => 'line', 'name' => GetMessage('REPORT_CHART_TYPE_LINE'), 'value_types' => array(
			/*'boolean', 'date', 'datetime', */'float', 'integer'/*, 'string', 'enum'*/)),
		array('id' => 'bar', 'name' => GetMessage('REPORT_CHART_TYPE_BAR'), 'value_types' => array(
			/*'boolean', 'date', 'datetime', */'float', 'integer'/*, 'string', 'enum'*/)),
		array('id' => 'pie', 'name' => GetMessage('REPORT_CHART_TYPE_PIE'), 'value_types' => array(
			/*'boolean', 'date', 'datetime', */'float', 'integer'/*, 'string', 'enum'*/))
	);
}
// </editor-fold>

// get view params
$strReportViewParams = CReport::getViewParams($arParams['REPORT_ID'], $this->GetTemplateName());
if (isset($_GET['set_filter']))
{
	if (substr($_SERVER['QUERY_STRING'], 0, 6) !== 'EXCEL=')
	{
		if ($_SERVER['QUERY_STRING'] !== $strReportViewParams)
		{
			CReport::setViewParams($arParams['REPORT_ID'], $this->GetTemplateName(), $_SERVER['QUERY_STRING']);
		}
	}
}
else
{
	if (!empty($strReportViewParams))
	{
		if (!is_set($_GET['sort_id']))
		{
			$len = strpos($arParams['PATH_TO_REPORT_VIEW'], '?');

			if ($len === false) $redirectUrl = $arParams['PATH_TO_REPORT_VIEW'];
			else $redirectUrl = substr($arParams['PATH_TO_REPORT_VIEW'], 0, $len);
			$redirectUrl = CComponentEngine::makePathFromTemplate($redirectUrl, array('report_id' => $arParams['REPORT_ID']));
			$redirectUrl .= '?'.$strReportViewParams;
			LocalRedirect($redirectUrl);
		}
		else
		{
			CReport::clearViewParams($arParams['REPORT_ID']);
		}
	}
}

try
{
	// select report info/settings
	$report = array();
	$result = false;
	if (intval($arParams['REPORT_ID']) > 0)
	{
		$result = Bitrix\Report\ReportTable::getById($arParams['REPORT_ID']);
	}
	if (is_object($result))
	{
		$report = $result->fetch();
	}

	if (empty($report))
	{
		throw new BXUserException(sprintf(GetMessage('REPORT_NOT_FOUND'), $arParams['REPORT_ID']));
	}

	if ($report['CREATED_BY'] != $USER->GetID())
	{
		throw new BXUserException(GetMessage('REPORT_VIEW_PERMISSION_DENIED'));
	}

	$arResult['MARK_DEFAULT'] = 0;
	if (isset($report['MARK_DEFAULT']))
	{
		$arResult['MARK_DEFAULT'] = intval($report['MARK_DEFAULT']);
	}

	// action
	$settings = unserialize($report['SETTINGS']);

	// <editor-fold defaultstate="collapsed" desc="parse period">
	$date_from = $date_to = null;
	$form_date = array('from' => null, 'to' => null, 'days' => null);

	// <editor-fold defaultstate="collapsed" desc="get value from POST or DB">
	if (!empty($_GET['F_DATE_TYPE']) && in_array($_GET['F_DATE_TYPE'], $periodTypes, true))
	{
		$period = array('type' => $_GET['F_DATE_TYPE']);

		switch ($_GET['F_DATE_TYPE'])
		{
			case 'days':
				$days = !empty($_GET['F_DATE_DAYS']) ? (int) $_GET['F_DATE_DAYS'] : 1;
				$period['value'] = $days ? $days : 1;
				break;

			case 'after':
				$date = !empty($_GET['F_DATE_TO']) ? (string) $_GET['F_DATE_TO'] : ConvertTimeStamp(false, 'SHORT');
				$date = MakeTimeStamp($date);
				$period['value'] = $date ? $date : time();
				break;

			case 'before':
				$date = !empty($_GET['F_DATE_FROM']) ? (string) $_GET['F_DATE_FROM'] : ConvertTimeStamp(false, 'SHORT');
				$date = MakeTimeStamp($date);
				$period['value'] = $date ? $date + (3600*24-1) : time() + (3600*24-1);
				break;

			case 'interval':
				$date_f = !empty($_GET['F_DATE_FROM']) ? (string) $_GET['F_DATE_FROM'] : ConvertTimeStamp(false, 'SHORT');
				$date_f = MakeTimeStamp($date_f);
				$date_t = !empty($_GET['F_DATE_TO']) ? (string) $_GET['F_DATE_TO'] : ConvertTimeStamp(false, 'SHORT');
				$date_t = MakeTimeStamp($date_t);
				if ($date_f || $date_t)
				{
					$period['value'][0] = $date_f ? $date_f : time();
					$period['value'][1] = $date_t ? $date_t + (3600*24-1) : time() + (3600*24-1);
				}
				break;

			default:
				$period['value'] = null;
		}
	}
	else
	{
		$period = $settings['period'];
	}
	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="parse period">
	switch ($period['type'])
	{
		case 'month':
			$date_from = strtotime(date("Y-m-01"));
			break;

		case 'month_ago':
			$date_from = strtotime(date("Y-m-01", strtotime("-1 month")));
			$date_to = strtotime(date("Y-m-t", strtotime("-1 month"))) + (3600*24-1);
			break;

		case 'week':
			$date_from = strtotime("-".((date("w") == 0 ? 7 : date("w")) - 1)." day 00:00");
			break;

		case 'week_ago':
			$date_from = strtotime("-".((date("w") == 0 ? 7 : date("w")) + 6)." day 00:00");
			$date_to = strtotime("-".(date("w") == 0 ? 7 : date("w"))." day 23:59:59");
			break;

		case 'days':
			$date_from = strtotime(date("Y-m-d")." -".intval($period['value'])." day");
			$form_date['days'] = intval($period['value']);
			break;

		case 'after':
			$date_from = $period['value'];
			$form_date['to'] = ConvertTimeStamp($period['value'], 'SHORT');
			break;

		case 'before':
			$date_to = $period['value'];
			$form_date['from'] = ConvertTimeStamp($period['value'], 'SHORT');
			break;

		case 'interval':
			list($date_from, $date_to) = $period['value'];
			$form_date['from'] = ConvertTimeStamp($period['value'][0], 'SHORT');
			$form_date['to'] = ConvertTimeStamp($period['value'][1], 'SHORT');
			break;
	}

	$site_date_from = !is_null($date_from) ? ConvertTimeStamp($date_from, 'FULL') : null;
	$site_date_to = !is_null($date_to) ? ConvertTimeStamp($date_to, 'FULL') : null;

	// to_date for oracle
	// rewrite to CDatabase::CharToDateFunction
	global $DB;

	$db_date_from = !is_null($site_date_from) ? $DB->CharToDateFunction($site_date_from) : null;
	$db_date_to = !is_null($site_date_to) ? $DB->CharToDateFunction($site_date_to) : null;

	// period filter
	$filter = array('LOGIC' => 'AND');
	$period_filter = call_user_func(
		array($arParams['REPORT_HELPER_CLASS'], 'getPeriodFilter'),
		$site_date_from, $site_date_to
	);

	if (!empty($period_filter))
	{
		$filter[] = $period_filter;
	}

	// preiod option
	if (!is_null($date_from) && !is_null($date_to))
	{
		$sqlTimeInterval = "BETWEEN ".$db_date_from." AND ".$db_date_to;
	}
	else if (!is_null($date_from))
	{
		$sqlTimeInterval = "> ".$db_date_from;
	}
	else if (!is_null($date_to))
	{
		$sqlTimeInterval = "< ".$db_date_to;
	}
	else
	{
		$sqlTimeInterval = " IS NOT NULL";
	}
	// </editor-fold>

	// </editor-fold>

	$runtime = array();
	$select = array();
	$group = array();
	$order = array();
	$limit = array();

	$options = array(
		'SQL_TIME_INTERVAL' => $sqlTimeInterval
	);

	$excelView = isset($_GET["EXCEL"]) && $_GET["EXCEL"] == "Y";

	// <editor-fold defaultstate="collapsed" desc="parse entity">
	$entityName = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'getEntityName'));
	$entityFields = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'getColumnList'));
	$grcFields = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'getGrcColumns'));
	//$arUFInfo = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'getUFInfo'));
	$arUFEnumerations = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'getUFEnumerations'));

	// customize entity
	$entity = clone Entity\Base::getInstance($entityName);
	call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'setRuntimeFields'), $entity, $sqlTimeInterval);

	$chains = CReport::generateChains($entityFields, $entity, '');
	$fieldsTree = CReport::generateColumnTree($chains, $entity, $arParams['REPORT_HELPER_CLASS']);
	unset($chains);

	// custom columns types
	$customColumnTypes = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'getCustomColumnTypes'));
	if (!is_array($customColumnTypes))
		$customColumnTypes = array();
	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="parse select columns">

	// <editor-fold defaultstate="collapsed" desc="collect fields">
	$fList = array();
	$fChainList = array();
	$bGroupingMode = false;
	foreach ($settings['select'] as &$elem)
	{
		if (!$bGroupingMode) if ($elem['grouping'] === true) $bGroupingMode = true;
		$fName = $elem['name'];

		if (array_key_exists($fName, $fList))
		{
			continue;
		}

		try
		{
			$chain = Entity\QueryChain::getChainByDefinition($entity, $fName);
		}
		catch (Exception $e)
		{
			if ($e->getCode() == 100)
				throw new BXUserException('<p style="color: red;">'.GetMessage('REPORT_UNKNOWN_FIELD_DEFINITION').'</p>');
			else
				throw $e;
		}
		$fList[$fName] = $chain->getLastElement()->getValue();
		if (is_array($fList[$fName])) $fList[$fName] = end($fList[$fName]);
		$fChainList[$fName] = $chain;
	}
	unset($elem);
	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="collect hrefs' fields">
	//$settings['select'][0]['href'] = array(
	//	'pattern' => '/company/personal/user/#RESPONSIBLE_ID#/tasks/task/view/#ID#/', //'/tasks/#ID#/',
	//	/*'elements' => array(  // not required
	//		'ID' => array(
	//			'name' => 'ID',
	//			'aggr' => null
	//		)
	//	)*/
	//);

	foreach ($settings['select'] as &$elem)
	{
		//if (in_array($elem['name'], $grcFields, true) && empty($elem['aggr']))
		if ($elem['aggr'] == 'GROUP_CONCAT')
		{
			continue;
		}

		CReport::appendHrefSelectElements($elem, $fList, $entity, $arParams['REPORT_HELPER_CLASS'], $select, $runtime);
	}
	unset($elem);
	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="collect columns with aliases, build runtime fields">

	// if there is aggr of init entity or there is no init entity at all, then we think that 1:N need double aggregation
	$is_init_entity_aggregated = false;
	$is_init_entity_in_select = false;

	foreach ($settings['select'] as $num => $elem)
	{
		$chain = $fChainList[$elem['name']];
		if ($chain->getSize() == 2)
		{
			$is_init_entity_in_select = true;

			if (!empty($elem['aggr']))
			{
				$is_init_entity_aggregated = true;
				break;
			}
		}
	}

	if (!$is_init_entity_aggregated && !$is_init_entity_in_select)
	{
		$is_init_entity_aggregated = true;
	}


	// init variables
	$viewColumns = array();
	$viewColumnsByResultName = array();

	// blacklist of entity with aggr
	$aggr_bl = array();

	// grc stuff
	$grcSelectPrimaries = array();
	$grcInitPrimary = false;

	$need_concat_rows = false;
	$grcSettingsNum = array();

	foreach ($settings['select'] as $num => $elem)
	{
		/** @var Entity\Field $field */
		$chain = $fChainList[$elem['name']];
		$field = $fList[$elem['name']];
		$fType = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'getFieldDataType'), $field);

		$is_grc = false;

		//if (in_array($elem['name'], $grcFields, true) && empty($elem['aggr']) && !strlen($elem['prcnt']))
		if ($elem['aggr'] == 'GROUP_CONCAT')
		{
			$is_grc = true;

			// collect grc_fields pointers
			$need_concat_rows = true;
			$grcSettingsNum[] = $num;
		}

		list($alias, $selElem) = CReport::prepareSelectViewElement($elem, $settings['select'], $is_init_entity_aggregated, $fList, $fChainList, $arParams['REPORT_HELPER_CLASS'], $entity);

		if (is_array($selElem) && !empty($selElem['expression']))
		{
			// runtime expr
			$fType = $selElem['data_type'];
		}
		else
		{
			// normal field
			$alias = Entity\QueryChain::getAliasByDefinition($entity, $elem['name']);
		}

		if (!$is_grc)
		{
			// grc will be selected later
			if (is_array($selElem))
			{
				// runtime field
				$select[$alias] = $alias;
				$runtime[$alias] = $selElem;
			}
			else
			{
				$select[$alias] = $selElem;
			}
		}

		// default sort
		if ($num == $settings['sort'] && array_key_exists('sort_type', $settings))
		{
			$defaultSort = $settings['sort_type'];
		}
		elseif ($is_grc)
		{
			$defaultSort = '';
		}
		elseif (($fType === 'string' || $fType === 'enum') && empty($elem['aggr']))
		{
			$defaultSort = 'ASC';
		}
		else
		{
			$defaultSort = 'DESC';
		}

		$arUF = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'detectUserField'), $field);
		$viewColumns[$num] = array(
			'field' => $field,
			'fieldName' => $elem['name'],
			'resultName' => $alias,
			'humanTitle' => empty($elem['alias']) ? $alias : $elem['alias'],
			'defaultSort' => $defaultSort,
			'aggr' => empty($elem['aggr']) ? '' : $elem['aggr'],
			'prcnt' => strlen($elem['prcnt']) ? $elem['prcnt'] : '',
			'href' => empty($elem['href']) ? '' : $elem['href'],
			'grouping' => ($elem['grouping'] === true) ? true : false,
			'grouping_subtotal' => ($elem['grouping_subtotal'] === true) ? true : false,
			'isUF' => $arUF['isUF'],
			'ufInfo' => $arUF['ufInfo']
		);
		unset($arUF);

		$viewColumnsByResultName[$alias] = &$viewColumns[$num];

		// blacklist of entity with aggr
		//if (!in_array($elem['name'], $grcFields, true) && !empty($elem['aggr']))
		if ($elem['aggr'] != 'GROUP_CONCAT' && !empty($elem['aggr']))
		{
			$preDef = substr($elem['name'], 0, strrpos($elem['name'], '.'));
			$preDef = strlen($preDef) ? $preDef.'.' : '';

			$aggr_bl[$preDef] = true;
		}
	}

	// collect entity primaries of fields without aggregation
	foreach ($settings['select'] as $num => $elem)
	{
		//if (!in_array($elem['name'], $grcFields, true) && empty($elem['aggr']))
		if (empty($elem['aggr']))
		{
			$primary = $viewColumns[$num]['field']->getEntity()->getPrimaryArray();

			$preDef = substr($elem['name'], 0, strrpos($elem['name'], '.'));
			$preDef = strlen($preDef) ? $preDef.'.' : '';

			if (array_key_exists($preDef, $aggr_bl))
			{
				continue;
			}

			foreach ($primary as $pField)
			{
				$palias = Entity\QueryChain::getAliasByDefinition($entity, $preDef.$pField);
				$grcSelectPrimaries[$palias] = $preDef.$pField;
			}

			// remember if there is initEntity primary in data
			if ($viewColumns[$num]['field']->getEntity() === $entity)
			{
				$grcInitPrimary = true;
			}
		}
	}

	// normalize $grcSelectPrimaries
	if ($grcInitPrimary)
	{
		// it's enough only init primary
		$initPrimary = $entity->getPrimaryArray();

		foreach ($grcSelectPrimaries as $k => $v)
		{
			if (!in_array($v, $initPrimary, true))
			{
				unset($grcSelectPrimaries[$k]);
			}
		}
	}

	$select = array_merge($select, $grcSelectPrimaries);
	// </editor-fold>

	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="parse filter">

	// <editor-fold defaultstate="collapsed" desc="rewrite values by filter">
	foreach ($settings['filter'] as $fId => &$fInfo)
	{
		foreach ($fInfo as $k => &$fElem)
		{
			if (!empty($_GET['filter'][$fId]) && array_key_exists($k, $_GET['filter'][$fId]))
			{
				$fElem['value'] = $_GET['filter'][$fId][$k];
			}
		}
	}
	unset($fInfo);
	unset($fElem);
	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="add filter to fList and fChainList">
	foreach ($settings['filter'] as $fId => $fInfo)
	{
		foreach ($fInfo as $k => $fElem)
		{
			if (is_array($fElem) && $fElem['type'] == 'field')
			{
				if (preg_match('/__COLUMN__\d+/', $fElem['name']))
				{
					continue;
				}

				try
				{
					$chain = Entity\QueryChain::getChainByDefinition($entity, $fElem['name']);
				}
				catch (Exception $e)
				{
					if ($e->getCode() == 100)
						throw new BXUserException('<p style="color: red;">'.GetMessage('REPORT_UNKNOWN_FIELD_DEFINITION').'</p>');
					else
						throw $e;
				}
				$field = $chain->getLastElement()->getValue();
				if (is_array($field)) $field = end($field);
				$fList[$fElem['name']] = $field;
				$fChainList[$fElem['name']] = $chain;
			}
		}
	}
	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="collect changeables">
	$changeableFilters = array();
	$changeableFiltersEntities = array();
	foreach ($settings['filter'] as $fId => &$fInfo)
	{
		foreach ($fInfo as $k => &$fElem)
		{
			if (is_array($fElem) && $fElem['type'] == 'field' && (int) $fElem['changeable'] > 0)
			{
				$match = array();
				if (preg_match('/__COLUMN__(\d+)/', $fElem['name'], $match))
				{
					/** @var Entity\Field[] $view */
					$num = $match[1];
					$view = $viewColumns[$num];
					$data_type = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'getFieldDataType'), $view['field']);

					if ($view['prcnt'])
					{
						$data_type = 'float';
					}
					elseif ($view['aggr'] == 'COUNT_DISTINCT')
					{
						$data_type = 'integer';
					}

					$field = null;
				}
				else
				{
					$field = $fList[$fElem['name']];
					$data_type = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'getFieldDataType'), $field);
				}

				if ($field instanceof Entity\ReferenceField)
				{
					$tmpElem = $fElem;
					call_user_func_array(
						array($arParams['REPORT_HELPER_CLASS'], 'fillFilterReferenceColumn'),
						array(&$tmpElem, &$field)
					);
					$value = $tmpElem['value'];
					$changeableFiltersEntities[$field->getRefEntityName()] = true;
				}
				else
				{
					$value = $fElem['value'];
				}

				// detect UF
				$arUF = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'detectUserField'), $field);

				$changeableFilters[] = array(
					'name' => $fElem['name'],
					'title' => '', // will be added later
					'value' => $value,
					'compare' => $fElem['compare'],
					'filter' => $fId,
					'num' => $k,
					'formName' => 'filter['.$fId.']['.$k.']',
					'formId' => 'filter_'.$fId.'_'.$k,
					'field' => $field,
					'data_type' => $data_type,
					'isUF' => $arUF['isUF'],
					'ufId' => $arUF['isUF'] ? $arUF['ufInfo']['ENTITY_ID'] : '',
					'ufName' => $arUF['isUF'] ? $arUF['ufInfo']['FIELD_NAME'] : ''
				);

				unset($arUF);
			}
		}
	}
	unset($fInfo);
	unset($fElem);
	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="rewrite references to primary">
	foreach ($settings['filter'] as $fId => &$fInfo)
	{
		foreach ($fInfo as $k => &$fElem)
		{
			if (is_array($fElem) && $fElem['type'] == 'field')
			{
				// delete empty filters
				if (is_array($fElem['value']))
				{
					foreach ($fElem['value'] as $l => $value)
					{
						if ($value === '' || !is_numeric($l)) unset($fElem['value'][$l]);
					}
					$l = count($fElem['value']);
					if ($l === 0) $fElem['value'] = '';
					else if ($l === 1) $fElem['value'] = $fElem['value'][0];
				}
				if ($fElem['value'] === '')
				{
					unset($fInfo[$k]);
					continue;
				}

				if (preg_match('/__COLUMN__(\d+)/', $fElem['name'], $match))
				{
					$num = $match[1];
					$field = $viewColumns[$num]['field'];
				}
				else
				{
					$field = $fList[$fElem['name']];
				}

				// rewrite
				if ($field instanceof Entity\ReferenceField)
				{
					// get primary
					$field = $field->GetRefEntity()->getField('ID');

					// get primary filter field name
					$primaryFilterField = call_user_func_array(
						array($arParams['REPORT_HELPER_CLASS'], 'getEntityFilterPrimaryFieldName'),
						array($fElem)
					);
					$fElem['name'] .= '.'.$primaryFilterField;
					unset($primaryFilterField);

					$fList[$fElem['name']] = $field;
					$fChainList[$fElem['name']] = Entity\QueryChain::getChainByDefinition($entity, $fElem['name']);
				}

				$dataType = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'getFieldDataType'), $field);

				// rewrite date <=> {today, yesterday, tomorrow, etc}
				if ($dataType === 'datetime'
					&& !CheckDateTime($fElem['value'], CSite::GetDateFormat('SHORT'))
				)
				{
					$fElem['value'] = ConvertTimeStamp(strtotime($fElem['value']), 'SHORT');
				}

				// rewrite date=DAY to date BETWEEN DAY_START AND DAY_END
				if ($dataType === 'datetime')
				{
					if ($fElem['compare'] == 'EQUAL')
					{
						// clone filter
						$fElem_start = $fElem;
						$fElem_end = $fElem;

						$fElem_start['compare'] = 'GREATER_OR_EQUAL';
						$fElem_start['value'] .= ' 00:00:00';

						$fElem_end['compare'] = 'LESS_OR_EQUAL';
						$fElem_end['value'] .= ' 23:59:59';

						// replace filter by subfilter
						$settings['filter'][] = array('LOGIC' => 'AND', $fElem_start, $fElem_end);
						end($settings['filter']);
						$lastFilterNum = key($settings['filter']);

						$fElem = array('type' => 'filter', 'name' => $lastFilterNum);
					}
					else if ($fElem['compare'] == 'LESS_OR_EQUAL')
					{
						$fElem['value'] .= ' 23:59:59';
					}
				}
			}
		}
	}
	unset($fInfo);
	unset($fElem);
	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="rewrite 1:N relations to EXISTS expression">
	call_user_func_array(
		array($arParams['REPORT_HELPER_CLASS'], 'beforeFilterBackReferenceRewrite'),
		array(&$settings['filter'], $viewColumns)
	);

	$f_filter_alias_count = 0;

	foreach ($settings['filter'] as $fId => &$fInfo)
	{
		foreach ($fInfo as $k => &$fElem)
		{
			if (is_array($fElem) && $fElem['type'] == 'field')
			{
				if (preg_match('/__COLUMN__\d+/', $fElem['name']))
				{
					continue;
				}

				$fField = $fList[$fElem['name']];
				$arUF = call_user_func(array($arParams['REPORT_HELPER_CLASS'], 'detectUserField'), $fField);
				if ($arUF['isUF'])
				{
					$fFieldDataType = call_user_func(
						array($arParams['REPORT_HELPER_CLASS'], 'getUserFieldDataType'), $arUF
					);
					if ($fFieldDataType === 'boolean')
					{
						if ($fElem['value'] === 'true')
							$fElem['value'] = 1;
						else
							$fElem['value'] = 0;
					}
				}

				$chain = $fChainList[$fElem['name']];

				if ($chain->hasBackReference())
				{
					$confirm = call_user_func_array(
						array($arParams['REPORT_HELPER_CLASS'], 'confirmFilterBackReferenceRewrite'),
						array(&$fElem, $chain)
					);

					if (!$confirm)
					{
						continue;
					}

					$_sub_init_table_alias = ToLower($entity->getCode());

					$_sub_filter = array();

					// add primary linking with main query
					foreach ($entity->GetPrimaryArray() as $_primary)
					{
						$_sub_filter['='.$_primary] = new CSQLWhereExpression('?#', $_sub_init_table_alias.'.'.$_primary);
					}

					// add value filter
					$filterCompare = CReport::$iBlockCompareVariations[$fElem['compare']];
					$filterName = $fElem['name'];
					$filterValue = $fElem['value'];
					if ($filterCompare === '>%')
					{
						$filterCompare = '';
						$filterValue = $filterValue.'%';
					}
					$_sub_filter[$filterCompare.$filterName] = $filterValue;

					// build subquery
					$_sub_query = new Entity\Query($entity);
					$_sub_query->setFilter($_sub_filter);
					$_sub_query->setTableAliasPostfix('_sub');

					$_sub_sql = 'EXISTS('.$_sub_query->getQuery().')';
					$_sub_sql = '(CASE WHEN '.$_sub_sql.' THEN 1 ELSE 0 END)';

					// expression escaping as sprintf requires
					$_sub_sql = str_replace('%', '%%', $_sub_sql);

					$_runtime_field = array(
						'data_type' => 'integer',
						'expression' => array($_sub_sql)
					);

					$f_filter_alias = 'F_FILTER_ALIAS_'.(++$f_filter_alias_count);

					$runtime[$f_filter_alias] = $_runtime_field;
					$fElem['name'] = $f_filter_alias;
					$fElem['value'] = 1;
				}
			}
		}
	}
	unset($fInfo);
	unset($fElem);
	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="rewrite __COLUMN__\d filters">
	foreach ($settings['filter'] as $fId => &$fInfo)
	{
		foreach ($fInfo as $k => &$fElem)
		{
			if (is_array($fElem) && $fElem['type'] == 'field')
			{
				if (preg_match('/__COLUMN__(\d+)/', $fElem['name'], $match))
				{
					$num = $match[1];
					$view = $viewColumns[$num];

					if (!empty($view['prcnt']) || !empty($view['aggr']))
					{
						$fElem['name'] = $view['resultName'];
					}
					else
					{
						$fElem['name'] = $view['fieldName'];
					}
				}
			}
		}
	}
	// </editor-fold>

	$iFilter = CReport::makeSingleFilter($settings['filter']);
	$filter[] = $iFilter;
	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="parse sort">
	$sort_id = $settings['sort'];
	$sort_name = $viewColumns[$sort_id]['resultName'];
	$sort_type = $viewColumns[$sort_id]['defaultSort'];

	// rewrite sort by POST
	if (array_key_exists('sort_id', $_GET) && array_key_exists($_GET['sort_id'], $viewColumns))
	{
		$sort_id = $_GET['sort_id'];
		$sort_name = $viewColumns[$sort_id]['resultName'];

		if ($_GET['sort_type'] === 'ASC' || $_GET['sort_type'] === 'DESC')
		{
			$sort_type = $_GET['sort_type'];
		}
		else
		{
			$sort_type = $viewColumns[$sort_id]['defaultSort'];
		}
	}

	if ($sort_name != '' && ($sort_type === 'ASC' || $sort_type === 'DESC'))
		$order = array($sort_name => $sort_type);
	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="parse limit">
	if (!$bGroupingMode) // no limit in grouping mode
	{
		$limit['nPageSize'] = $arParams['ROWS_PER_PAGE'];

		if (!empty($settings['limit']))
		{
			$limit['nPageTop'] = $settings['limit'];
		}
		else if (!$excelView)
		{
			$limit['iNumPage'] = is_set($_GET['PAGEN_1']) ? $_GET['PAGEN_1'] : 1;
			$limit['bShowAll'] = true;
		}
	}
	// </editor-fold>


	// <editor-fold defaultstate="collapsed" desc="connect Lang">
	$fullHumanTitles = CReport::collectFullHumanTitles($fieldsTree);

	foreach ($viewColumns as $num => &$view)
	{
		if ($view['resultName'] == $view['humanTitle'])
		{
			$view['humanTitle'] = CReport::getFullColumnTitle($view, $viewColumns, $fullHumanTitles);
		}
	}
	unset($view);

	foreach ($changeableFilters as &$chFilter)
	{
		if (preg_match('/__COLUMN__(\d+)/', $chFilter['name'], $match))
		{
			$num = $match[1];
			$chFilter['title'] = $viewColumns[$num]['humanTitle'];
		}
		else
		{
			$chFilter['title'] = $fullHumanTitles[$chFilter['name']];
		}

	}
	unset($chFilter);
	// </editor-fold>

	// rewrite User SHORT_NAME
	CReport::rewriteUserShortName($select, $runtime, $arParams['USER_NAME_FORMAT'], $entity);

	// <editor-fold defaultstate="collapsed" desc="retrieve report rows">

	call_user_func_array(
		array($arParams['REPORT_HELPER_CLASS'], 'beforeViewDataQuery'),
		array(&$select, &$filter, &$group, &$order, &$limit, &$options, &$runtime)
	);

	$main_query = new Entity\Query($entity);
	$main_query->setSelect($select)
		->setFilter($filter)
		->setGroup($group)
		->setOrder($order)
	;

	foreach ($runtime as $k => $v)
	{
		$main_query->registerRuntimeField($k, $v);

		// add view column if needed
		if (isset($v['view_column']) && is_array($v['view_column']))
		{
			$runtimeColumnInfo = $v['view_column'];
			$newNum = max(array_keys($viewColumns)) + 1;
			$queryChains = $main_query->getChains();
			if (isset($queryChains[$k]))
			{
				$runtimeField = $queryChains[$k]->getLastElement()->getValue();
				if (is_array($runtimeField)) $runtimeField = end($runtimeField);
				/*$arUF = CReport::detectUserField($runtimeField, $arUFInfo);*/
				$viewColumns[$newNum] = array(
					'field' => $runtimeField,
					'fieldName' => $k,
					'resultName' => $k,
					'humanTitle' => empty($runtimeColumnInfo['humanTitle']) ? '' : $runtimeColumnInfo['humanTitle'],
					'defaultSort' => '',
					'aggr' => '',
					'prcnt' => '',
					'href' => empty($runtimeColumnInfo['href']) ? '' : $runtimeColumnInfo['href'],
					'grouping' => false,
					'grouping_subtotal' => ($runtimeColumnInfo['grouping_subtotal'] === true) ? true : false,
					'runtime' => true/*,
					'isUF' => $arUF['isUF'],
					'isUF' => $arUF['isUF'],
					'ufInfo' => $arUF['ufInfo']*/
				);
				/*unset($arUF);*/
				$viewColumnsByResultName[$k] = &$viewColumns[$newNum];
			}
		}
	}

	if (isset($limit['nPageTop']))
		$main_query->setLimit($limit['nPageTop']);

	$result = $main_query->exec();
	$result = new CDBResult($result);
	if (!$bGroupingMode)
	{
		if (isset($limit['nPageTop']))
			$result->NavStart($limit['nPageTop']);
		else
			$result->NavStart($limit['nPageSize']/*, true, $limit['iNumPage']*/);
	}

	$data = array();
	$grcDataPrimaryValues = array();
	$grcDataPrimaryPointers = array();

	while ($row = $result->Fetch())
	{
		// attach URLs
		foreach ($row as $k => $v)
		{
			if (!array_key_exists($k, $viewColumnsByResultName))
			{
				continue;
			}

			$elem = $viewColumnsByResultName[$k];

			if (!empty($elem['href']))
			{
				$url = CReport::generateValueUrl($elem, $row, $entity);
				$row['__HREF_'.$k] = $url;
			}
		}

		// collect
		$data[] = $row;

		// grc stuff
		$grc_primary_string = '';

		foreach ($grcSelectPrimaries as $alias => $def)
		{
			// for grc filter
			$grcDataPrimaryValues['='.$def][] = $row[$alias];

			// for concat
			$grc_primary_string .= (string) $row[$alias] . '/';
		}

		// save original data indexes for grc values
		if (!isset($grcDataPrimaryPointers[$grc_primary_string]))
		{
			$grcDataPrimaryPointers[$grc_primary_string] = array();
		}

		$grcDataPrimaryPointers[$grc_primary_string][] = count($data)-1;
	}

	$grcDataPrimaryValues = array_map('array_unique', $grcDataPrimaryValues);
	// </editor-fold>

	if (empty($settings['limit']))
	{
		$arResult["NAV_STRING"] = $result->GetPageNavString('', (is_set($arParams['NAV_TEMPLATE'])) ? $arParams['NAV_TEMPLATE'] : 'arrows');
		$arResult["NAV_PARAMS"] = $result->GetNavParams();
		$arResult["NAV_NUM"] = $result->NavNum;
	}

	// <editor-fold defaultstate="collapsed" desc="retrieve total counts">
	$totalSelect = $select;
	$totalColumns = array();

	foreach ($viewColumns as $num => $view)
	{
		// total's fields are the same as percentable fields
		// they are also all numerics
		if (CReport::isColumnTotalCountable($view, $arParams['REPORT_HELPER_CLASS']))
		{
			// exclude from select all except those
			$totalColumns[$view['resultName']] = true;
		}
	}

	// save only totalCountable visible fields
	foreach ($totalSelect as $k => $v)
	{
		if (!array_key_exists($k, $totalColumns))
		{
			unset($totalSelect[$k]);
		}
	}

	// add SUM aggr
	$_totalSelect = $totalSelect;
	$totalSelect = array();

	foreach ($_totalSelect as $k => $v)
	{
		$totalSelect[] = new Entity\ExpressionField('TOTAL_'.$k, 'SUM(%s)', $k);
	}

	if (!empty($totalSelect))
	{
		// source query
		$query_from = new Entity\Query($entity);
		$query_from->setSelect($select);
		$query_from->setFilter($filter);
		$query_from->setGroup($group);

		foreach ($runtime as $k => $v)
		{
			$query_from->registerRuntimeField($k, $v);
		}

		// total query
		$total_query = new Entity\Query($query_from);
		$total_query->setSelect($totalSelect);

		$result = $total_query->exec();
		$total = $result->fetch();
		$total = ($total === false) ? array() : $total;
	}
	else
	{
		$total = array();
	}

	// </editor-fold>

	// <editor-fold defaultstate="collapsed" desc="group_concat fields">
	$grcData = array();

	// check necessity of concat rows
	if ($need_concat_rows && $grcDataPrimaryValues)
	{
		// filter - add primaries from data
		if ($grcInitPrimary)
		{
			// init primary enough
			$grcFilter = $grcDataPrimaryValues;
		}
		else
		{
			// merge with primaries
			$grcFilter = array_merge($filter, $grcDataPrimaryValues);
		}

		// select data for each grc field
		foreach ($grcSettingsNum as $num)
		{
			$elem = $settings['select'][$num];

			// prepare
			$grcSelect = $grcSelectPrimaries;

			CReport::appendHrefSelectElements($elem, $fList, $entity, $arParams['REPORT_HELPER_CLASS'], $grcSelect, $runtime);

			if (!empty($elem['href']))
			{
				$viewColumns[$num]['href'] = $elem['href'];
			}

			list($alias, $selElem) = CReport::prepareSelectViewElement($elem, $settings['select'], $is_init_entity_aggregated, $fList, $fChainList, $arParams['REPORT_HELPER_CLASS'], $entity);

			if (is_array($selElem) && !empty($selElem['expression']))
			{
				$runtime[$alias] = $selElem;
				$grcSelect[] = $alias;
			}
			else
			{
				// normal field
				$alias = Entity\QueryChain::getAliasByDefinition($entity, $elem['name']);
				$grcSelect[$alias] = $selElem;
			}

			CReport::rewriteUserShortName($grcSelect, $runtime, $arParams['USER_NAME_FORMAT'], $entity, true);

			// add primary of grc entity field
			$grcChain = Entity\QueryChain::getChainByDefinition($entity, $elem['name']);
			$grc_field = $grcChain->getLastElement()->getValue();
			if (is_array($grc_field)) $grc_field = end($grc_field);
			$grc_primary = end($grc_field->getEntity()->getPrimaryArray());
			$grc_marker = substr($elem['name'], 0, strrpos($elem['name'], '.')) . '.' . $grc_primary;
			$grc_marker_alias = Entity\QueryChain::getAliasByDefinition($entity, $grc_marker);

			$grcSelect[$grc_marker_alias] = $grc_marker;

			// select
			$resultName = $viewColumns[$num]['resultName'];
			$grcData[$resultName] = array();

			$grc_query = new Entity\Query($entity);
			$grc_query->setSelect($grcSelect);
			$grc_query->setFilter($grcFilter);

			foreach ($runtime as $k => $v)
			{
				$grc_query->registerRuntimeField($k, $v);
			}

			$result = $grc_query->exec();

			while ($row = $result->fetch())
			{
				if (empty($row[$grc_marker_alias]))
				{
					continue;
				}

				$grcData[$resultName][] = $row;
			}

			// add empty values to data
			foreach ($data as $k => $v)
			{
				$data[$k][$alias] = null;
			}

			// add values to data
			foreach ($grcData[$resultName] as $grcIndex => &$row)
			{
				$grc_primary_string = '';

				foreach ($grcSelectPrimaries as $pResultName => $def)
				{
					$grc_primary_string .= (string) $row[$pResultName] . '/';
				}

				$dataIndexes = $grcDataPrimaryPointers[$grc_primary_string];

				foreach ($dataIndexes as $dataIndex)
				{
					if (!isset($data[$dataIndex][$alias]))
					{
						$data[$dataIndex][$alias] = array();
					}

					if (!empty($elem['href']) && strlen($row[$alias]))
					{
						$url = CReport::generateValueUrl($elem, $row, $entity);
						$row['__HREF_'.$alias] = $url;
					}

					$data[$dataIndex][$alias][$grcIndex] = $row[$alias];
				}
			}
			unset($row);
		}
	} // end concat grc
	// </editor-fold>

	$customChartTotal = $customChartData = array();
	// format results
	call_user_func_array(
		array($arParams['REPORT_HELPER_CLASS'], 'formatResults'),
		array(&$data, &$viewColumnsByResultName, $total, &$customChartData)
	);
	call_user_func_array(
		array($arParams['REPORT_HELPER_CLASS'], 'formatResultsTotal'),
		array(&$total, &$viewColumnsByResultName, &$customChartTotal)
	);
}
catch (Exception $e)
{
	if ($e instanceof BXUserException)
	{
		$arResult['ERROR'] = $e->getMessage();
	}
	else
	{
		CTimeZone::Enable();
		throw $e;
	}
}

CTimeZone::Enable();



// template vars
$arResult['entityName'] = $entityName;
$arResult['helperClassName'] = $arParams['REPORT_HELPER_CLASS'];
$arResult['fList'] = $fList;
$arResult['settings'] = $settings;
$arResult['sort_id'] = $sort_id;
$arResult['sort_type'] = $sort_type;
$arResult['report'] = $report;
$arResult['viewColumns'] = $viewColumns;
$arResult['data'] = $data;
$arResult['grcData'] = $grcData;
$arResult['changeableFilters'] = $changeableFilters;
$arResult['ufEnumerations'] = $arUFEnumerations;
$arResult['changeableFiltersEntities'] = $changeableFiltersEntities;
$arResult['chfilter_examples'] = array();
$arResult['total'] = $total;

$arResult['form_date'] = $form_date;
$arResult['period'] = $period;

$arResult['groupingMode'] = $bGroupingMode;

$arResult['customColumnTypes'] = $customColumnTypes;
$arResult['customChartData'] = $customChartData;
$arResult['customChartTotal'] = $customChartTotal;

if ($excelView)
{
	$APPLICATION->RestartBuffer();

	Header("Content-Type: application/force-download");
	Header("Content-Type: application/octet-stream");
	Header("Content-Type: application/download");
	Header("Content-Disposition: attachment;filename=report.xls");
	Header("Content-Transfer-Encoding: binary");

	$this->IncludeComponentTemplate('excel');

	exit;
}
else
{
	$this->IncludeComponentTemplate();
}

