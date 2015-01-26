<?php
namespace Bitrix\Main\System;

interface IApplicationStrategy
{
	public function preInitialize();
	public function createDatabaseConnection();
	public function initializeContext();
	public function initializeBasicKernel();
	public function initializeExtendedKernel();
	public function authenticateUser();
	public function authorizeUser();
	public function postInitialize();
	public function initializeDispatcher();
	public function runInitScripts();
}
