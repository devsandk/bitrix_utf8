if (!BXRL)
{
	var BXRL = {};
	var BXRLW = null;
}

RatingLike = function(likeId, entityTypeId, entityId, available)
{	
	this.enabled = true;
	this.likeId = likeId;
	this.entityTypeId = entityTypeId;
	this.entityId = entityId;
	this.available = available == 'Y'? true: false;

	this.box = BX('bx-ilike-button-'+likeId);
	if (this.box === null)
	{
		this.enabled = false;
		return false;
	}

	this.button = BX.findChild(this.box, { className: 'post-item-inform-left' }, true, false);
	this.count = BX.findChild(this.box, { tagName: 'div', className: 'post-item-inform-right' }, true, false);
	this.countText	= BX.findChild(this.count, {tagName:'span', className:'post-item-inform-right-text'}, true, false);
	this.likeTimeout = false;	
	this.lastVote = BX.hasClass(this.box, 'post-item-inform-likes-active') ? 'plus' : 'cancel';
}

RatingLike.Set = function(likeId, entityTypeId, entityId, available)
{
	BXRL[likeId] = new RatingLike(likeId, entityTypeId, entityId, available);
	if (BXRL[likeId].enabled)
	{
		RatingLike.Init(likeId);
	}
};

RatingLike.Init = function(likeId)
{
	// like/unlike button
	if (BXRL[likeId].available)
	{
		BX.bind(BXRL[likeId].box, 'click', function(e) {
			clearTimeout(BXRL[likeId].likeTimeout);
			if (BX.hasClass(BXRL[likeId].box, 'post-item-inform-likes-active'))
			{
				var newValue = parseInt(BXRL[likeId].countText.innerHTML) - 1;
				BXRL[likeId].countText.innerHTML = newValue;
				BX.removeClass(BXRL[likeId].box, 'post-item-inform-likes-active');
				BX.addClass(BXRL[likeId].box, 'post-item-inform-likes');

				if (parseInt(newValue) <= 0)
				{
					if (
						BX('post_item_inform_wrap') 
						&& !BX('lenta_notifier') // not in lenta
					)
					{
						BX.removeClass(BX('post_item_inform_wrap'), 'post-item-inform-action');
					}
					else if(BX('post_inform_wrap'))
					{
						BX.removeClass(BX('post_inform_wrap'), 'post-item-inform-action');
					}
				}
				else
				{
					if (BX('bx-ilike-list-others'))
						BX('bx-ilike-list-others').style.display = "block";
					if (BX('bx-ilike-list-youothers'))
						BX('bx-ilike-list-youothers').style.display = "none";
				}

				BXRL[likeId].likeTimeout = setTimeout(function(){
					if (BXRL[likeId].lastVote != 'cancel')
						RatingLike.Vote(likeId, 'cancel');
				}, 1000);
			}
			else
			{
				var newValue = parseInt(BXRL[likeId].countText.innerHTML) + 1;
				BXRL[likeId].countText.innerHTML = newValue;
				BX.removeClass(BXRL[likeId].box, 'post-item-inform-likes');
				BX.addClass(BXRL[likeId].box, 'post-item-inform-likes-active');

				var blockCounter = false;

				if (parseInt(newValue) == 1)
				{
					if (
						BX('post_item_inform_wrap')
						&& !BX('lenta_notifier') // not in lenta
					)
					{
						BX.addClass(BX('post_item_inform_wrap'), 'post-item-inform-action');
					}
					else if(BX('post_inform_wrap'))
					{
						BX.addClass(BX('post_inform_wrap'), 'post-item-inform-action');
					}
				}
				else
				{
					if (BX('bx-ilike-list-others'))
						BX('bx-ilike-list-others').style.display = "none";
					if (BX('bx-ilike-list-youothers'))
						BX('bx-ilike-list-youothers').style.display = "block";
				}

				BXRL[likeId].likeTimeout = setTimeout(function(){
					if (BXRL[likeId].lastVote != 'plus')
						RatingLike.Vote(likeId, 'plus');
				}, 1000);
			}
			BX.PreventDefault(e);
		});
		
	}
}

RatingLike.Vote = function(likeId, voteAction)
{
	BMAjaxWrapper.Wrap({
		'type': 'json',
		'method': 'POST',
		'url': '/mobile/ajax.php?mobile_action=like',
		'data': {
			'RATING_VOTE': 'Y', 
			'RATING_VOTE_TYPE_ID': BXRL[likeId].entityTypeId, 
			'RATING_VOTE_ENTITY_ID': BXRL[likeId].entityId, 
			'RATING_VOTE_ACTION': voteAction,
			'sessid': BX.message('RVSessID')
		},
		'callback': function(data) {
			if (
				typeof data != 'undefined'
				&& typeof data.action != 'undefined'
				&& typeof data.items_all != 'undefined'
			)
			{
				BXRL[likeId].lastVote = data.action;
				BXRL[likeId].countText.innerHTML = data.items_all;
				if (parseInt(BX.message('MSLLogId')) > 0)
				{
					app.onCustomEvent('onLogEntryRatingLike', { rating_id: likeId, voteAction: voteAction });
				}
			}
			else
			{
				var newValue = 0;
				if (voteAction == 'plus')
				{
					newValue = parseInt(BXRL[likeId].countText.innerHTML) - 1;
					BX.removeClass(BXRL[likeId].box, 'post-item-inform-likes-active');
					BX.addClass(BXRL[likeId].box, 'post-item-inform-likes');
				}
				else
				{
					newValue = parseInt(BXRL[likeId].countText.innerHTML) + 1;
					BX.addClass(BXRL[likeId].box, 'post-item-inform-likes-active');
					BX.removeClass(BXRL[likeId].box, 'post-item-inform-likes');
				}
				BXRL[likeId].countText.innerHTML = newValue;
			}
		},
		'callback_failure': function(data)
		{
			var newValue = 0;
			if (voteAction == 'plus')
			{
				newValue = parseInt(BXRL[likeId].countText.innerHTML) - 1;
				BX.removeClass(BXRL[likeId].box, 'post-item-inform-likes-active');
				BX.addClass(BXRL[likeId].box, 'post-item-inform-likes');				
			}
			else
			{
				newValue = parseInt(BXRL[likeId].countText.innerHTML) + 1;
				BX.addClass(BXRL[likeId].box, 'post-item-inform-likes-active');
				BX.removeClass(BXRL[likeId].box, 'post-item-inform-likes');
			}
			BXRL[likeId].countText.innerHTML = newValue;
		}
	});
	return false;
}

RatingLike.List = function(likeId)
{
	if (app.enableInVersion(2))
	{
		app.openTable({
			callback: function() {},
			url: (BX.message('MobileSiteDir') ? BX.message('MobileSiteDir') : '/') + 'mobile/index.php?mobile_action=get_likes&RATING_VOTE_TYPE_ID=' + BXRL[likeId].entityTypeId + '&RATING_VOTE_ENTITY_ID=' + BXRL[likeId].entityId + '&URL=' + BX.message('RVPathToUserProfile'),
			markmode: false,
			showtitle: false,
			modal: false,
			cache: false,
			outsection: false,
			cancelname: BX.message('RVListBack')
		});
	}

	return false;
}