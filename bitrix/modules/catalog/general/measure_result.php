<?
/**
 * Class CCatalogMeasureAdminResult
 */
class CCatalogMeasureAdminResult extends CAdminResult
{
	/**
	 * @return array
	 */
	function Fetch()
	{
		return CCatalogMeasureResult::fetch();
	}
}