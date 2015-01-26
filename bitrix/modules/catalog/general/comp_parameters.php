<?
use Bitrix\Main\Localization\Loc;
Loc::loadMessages(__FILE__);

class CCatalogIBlockParameters
{
	public static function GetCatalogSortFields()
	{
		return array(
			'CATALOG_AVAILABLE' => Loc::getMessage('IBLOCK_SORT_FIELDS_CATALOG_AVAILABLE')
		);
	}
}
?>