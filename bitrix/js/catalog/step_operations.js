BX.namespace("BX.Catalog");
BX.Catalog.StepOperations = (function()
{
var classDescription = function(params)
{
	this.errorCode = 0;
	this.url = '';
	this.stepOptions = {
		ajaxSessionID: '',
		maxExecutionTime: 0,
		maxOperationCounter: 0
	};
	this.finish = false;
	this.currentState = {
		allCounter: 0,
		allOperationCounter: 0,
		errorCounter: 0,
		lastID: 0
	};
	this.ajaxParams = {};
	this.visual = {
		startBtnID: '',
		stopBtnID: '',
		resultContID: '',
		errorContID: '',
		errorDivID: '',
		timeFieldID: ''
	};
	this.buttons = {
		start: null,
		stop: null
	};
	this.content = {
		result: null,
		errors: null,
		errorsFrame: null,
		timeField: null
	};

	if (typeof params === 'object')
	{
		if (params.url === undefined || !BX.type.isNotEmptyString(params.url))
		{
			this.errorCode = this.errorCode || -0x2;
		}
		else
		{
			this.url = params.url;
		}
		if (params.options === 'undefined' || typeof(params.options) !== 'object')
		{
			this.errorCode = this.errorCode || -0x4;
		}
		else
		{
			this.stepOptions.ajaxSessionID = params.options.ajaxSessionID;
			this.stepOptions.maxExecutionTime = params.options.maxExecutionTime;
			this.stepOptions.maxOperationCounter = params.options.maxOperationCounter;
			this.currentState.allCounter = params.options.counter;
		}
		if (!!params.ajaxParams && typeof(params.ajaxParams) === 'object')
		{
			this.ajaxParams = params.ajaxParams;
		}
		this.visual = params.visual;
	}
	else
	{
		this.errorCode = -0x1;
	}

	if (this.errorCode === 0)
	{
		BX.ready(BX.proxy(this.init, this));
	}
};

classDescription.prototype.init = function()
{
	if (this.errorCode < 0)
	{
		return;
	}

	if (this.errorCode === 0)
	{
		if (!!this.visual.startBtnID)
		{
			this.buttons.start = BX(this.visual.startBtnID);
			if (!this.buttons.start)
			{
				this.errorCode = this.errorCode || -0x20000;
			}
		}
		else
		{
			this.errorCode = this.errorCode || -0x10000;
		}
		if (!!this.visual.stopBtnID)
		{
			this.buttons.stop = BX(this.visual.stopBtnID);
			if (!this.buttons.stop)
			{
				this.errorCode = this.errorCode || -0x80000;
			}
		}
		else
		{
			this.errorCode = this.errorCode || -0x40000;
		}
		this.content.result = BX(this.visual.resultContID);
		this.content.errorsFrame = BX(this.visual.errorDivID);
		this.content.errors = BX(this.visual.errorContID);
		this.content.timeField = BX(this.visual.timeFieldID);
	}

	if (this.errorCode === 0)
	{
		BX.bind(this.buttons.start, 'click', BX.proxy(this.startOperation, this));
		BX.bind(this.buttons.stop, 'click', BX.proxy(this.stopOperation, this));
		if (!!this.content.timeField)
		{
			BX.bind(this.content.timeField, 'change', BX.proxy(this.changeMaxTime, this));
		}
	}
};

classDescription.prototype.nextStep = function()
{
	this.ajaxParams.ajaxSessionID = this.stepOptions.ajaxSessionID;
	this.ajaxParams.maxExecutionTime = this.stepOptions.maxExecutionTime;
	this.ajaxParams.maxOperationCounter = this.stepOptions.maxOperationCounter;
	this.ajaxParams.lastID = this.currentState.lastID;
	this.ajaxParams.counter = this.currentState.allCounter;
	this.ajaxParams.operationCounter = this.currentState.allOperationCounter;
	this.ajaxParams.sessid = BX.bitrix_sessid();
	this.ajaxParams.lang = BX.message('LANGUAGE_ID');
	BX.showWait();
	BX.ajax.loadJSON(
		this.url,
		this.ajaxParams,
		BX.proxy(this.nextStepResult, this)
	);
};

classDescription.prototype.nextStepResult = function(result)
{
	BX.closeWait();
	if (typeof result === 'object')
	{
		this.currentState.lastID = result.lastID;
		this.stepOptions.maxOperationCounter = result.maxOperationCounter;

		this.currentState.allOperationCounter = parseInt(result.allOperationCounter, 10);
		if (isNaN(this.currentState.allOperationCounter))
		{
			this.currentState.allOperationCounter = 0;
		}
		this.currentState.errorCounter = parseInt(result.errorCounter, 10);
		if (isNaN(this.currentState.errorCounter))
		{
			this.currentState.errorCounter = 0;
		}
		if (this.currentState.errorCounter > 0)
		{
			this.showErrors(result.errors);
		}
		BX.adjust(this.content.result, { html: result.message, style: { display: 'block' } });

		if (this.finish || !!result.finishOperation)
		{
			this.finishOperation();
		}
		else
		{
			this.nextStep();
		}
	}
};

classDescription.prototype.showErrors = function(errorList)
{
	if (!!this.content.errors)
	{
		if (BX.type.isNotEmptyString(errorList))
		{
			this.content.errors.innerHTML = this.content.errors.innerHTML + errorList;
		}
		BX.style(this.content.errorsFrame, 'display', 'block');
	}
};

classDescription.prototype.finishOperation = function()
{
	this.currentState.allOperationCounter = 0;
	this.currentState.errorCounter = 0;
	this.currentState.lastID = 0;

	this.buttons.start.disabled = false;
	this.buttons.stop.disabled = true;
};

classDescription.prototype.startOperation = function()
{
	if (!this.buttons.start.disabled)
	{
		this.changeMaxTime();
		this.buttons.start.disabled = true;
		this.buttons.stop.disabled = false;
		this.nextStep();
	}
};

classDescription.prototype.stopOperation = function()
{
	if (!this.buttons.stop.disabled)
	{
		this.buttons.start.disabled = false;
		this.buttons.stop.disabled = true;
	}
};

classDescription.prototype.changeMaxTime = function()
{
	if (!!this.content.timeField)
	{
		var maxTime = parseInt(this.content.timeField.value, 10);
		if (!isNaN(maxTime))
		{
			this.stepOptions.maxExecutionTime = maxTime;
		}
	}
};

return classDescription;
})();