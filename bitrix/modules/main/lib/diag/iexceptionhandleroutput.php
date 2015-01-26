<?php
namespace Bitrix\Main\Diag;

interface IExceptionHandlerOutput
{
	function renderExceptionMessage(\Exception $exception, $debug = false);
}
