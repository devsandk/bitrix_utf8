function JCCatalogStoreSKU(arParams)
{
    if(!arParams) return;

    this.AR_ALL_RESULT = arParams.AR_ALL_RESULT;
    this.PHONE_MESSAGE = arParams.PHONE_MESSAGE;
    this.SCHEDULE_MESSAGE = arParams.SCHEDULE_MESSAGE;
    this.AMOUNT_MESSAGE = arParams.AMOUNT_MESSAGE;
    BX.addCustomEvent(window, "onCatalogStoreProductChange", BX.proxy(this.offerOnChange, this));
}

JCCatalogStoreSKU.prototype.offerOnChange = function(id)
{
    var storeAmountDiv = BX('catalog_store_amount_div');
    if(storeAmountDiv)
    {
        storeAmountDiv.innerHTML = '';
        storeAmountDiv.appendChild(
            BX.create('hr', {})
        );
        var storeAmountUL = storeAmountDiv.appendChild(
            BX.create('ul', {})
        );
        for(var i = 0; i < this.AR_ALL_RESULT.length; i++)
        {
            if(this.AR_ALL_RESULT[i].hasOwnProperty('ELEMENT_ID') && (typeof this.AR_ALL_RESULT[i] == "object") && this.AR_ALL_RESULT[i]['ELEMENT_ID'] == id)
            {
                var storeMainLI =  BX.create('li', {});

                if(this.AR_ALL_RESULT[i].hasOwnProperty('URL') && this.AR_ALL_RESULT[i].hasOwnProperty('TITLE'))
                {
                    storeMainLI.appendChild(BX.create('a', {
                        props: {href: this.AR_ALL_RESULT[i]["URL"]},
                        html: this.AR_ALL_RESULT[i]["TITLE"]
                    }));
                }
                if(this.AR_ALL_RESULT[i].hasOwnProperty('PHONE') && this.AR_ALL_RESULT[i]['PHONE'] != '')
                {
                    storeMainLI.appendChild(BX.create('br', {
                    }));
                    storeMainLI.appendChild(BX.create('span', {
                        props: {className: "tel"},
                        text: this.PHONE_MESSAGE + ' ' + this.AR_ALL_RESULT[i]['PHONE']
                    }));
                }
                if(this.AR_ALL_RESULT[i].hasOwnProperty('SCHEDULE') && this.AR_ALL_RESULT[i]['SCHEDULE'] != '')
                {
                    storeMainLI.appendChild(BX.create('br', {
                    }));
                    storeMainLI.appendChild(BX.create('span', {
                        props: {className: "schedule"},
                        text: this.SCHEDULE_MESSAGE + ' ' + this.AR_ALL_RESULT[i]['SCHEDULE']
                    }));
                }
                if(this.AR_ALL_RESULT[i].hasOwnProperty('AMOUNT'))
                {
                    storeMainLI.appendChild(BX.create('br', {
                    }));
                    storeMainLI.appendChild(BX.create('span', {
                        props: {className: "balance"},
                        text: this.AMOUNT_MESSAGE + ': ' + this.AR_ALL_RESULT[i]['AMOUNT']
                    }));
                }
                storeAmountUL.appendChild(storeMainLI);
            }
        }
    }
}