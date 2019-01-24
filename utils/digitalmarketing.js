const config = require('../config/config.js');
const util = require('./util.js');

//互动营销公共js
var viewRule = function(){
    this.setData({
        'detail.showRule':true,
        'detail.showMask':true,
    })
}
var closeRule = function(){
	this.setData({
	    'detail.showRule':false,
        'detail.showMask':false,
	})
}

var closeProduct = function(){
    this.setData({
        'detail.showProduct':false,
        'detail.showMask':false,
    })
}

var closeError = function(){
	this.setData({
	    'detail.showError':false,
        'detail.showMask':false,
	})
}

var closeLose = function(){
	this.setData({
	    'detail.showLose':false,
        'detail.showMask':false,
	})
}

var closeScore = function(){
	this.setData({
	    'detail.showScore':false,
        'detail.showMask':false,
	})
}

var closeCoupon = function(){
	this.setData({
	    'detail.showCoupon':false,
        'detail.showMask':false
	})
}

// 错误信息
var errorEvent = function (code, msg) {
	var _this = this;
    if (code == '01') {
        msg = '请先登录';
    }
    if (code == '02') {
        msg = '缺少参数';
    }
    if (code == '03') {
        msg = !msg ? '操作失败' : msg;
    }
    if (code == '04') {
        msg = '系统错误';
    }

    _this.setData({
        'detail.showMask':true,
        'detail.showError':true,
        'detail.errMsg':msg,
    })
};

// 获取抽奖次数
var getNum = function () {
	var _this = this;
	util.wxRequest({
		url: config.BASE_URL+'/m/marketingactivity-ajax.html',
		method:'POST',
		data:{
			activity_id:_this.data.data.activity_id,
			type: 'num',
			t: Math.random(),
		},
		success:function(res){
			if (!res.data)
			    return;
			_this.setData({
			    'detail.limit':true,
                'detail.num':res.data
			})
		},
		complete: function() {
		    
		},
		fail: function(re) {
		    console.info(re);
		},
	})
};

// 抽奖结果
var onLottery = function (partin, prize, addr_id) {
	var _this = this;
    if (!prize || !partin || prize.prize_id == 0 ||partin.prize_id == '0') {
        _this.setData({
            'detail.showMask':true,
            'detail.showLose':true,
        })
    } else {
        if (prize.prize_type == 'score') {
            _this.setData({
                'detail.showMask':true,
                'detail.showScore':true,
                'detail.scoreText':prize.addon.score,
            })
            award(partin.partin_id, prize.prize_type);
        }
        if (prize.prize_type == 'coupon') {
            _this.setData({
                'detail.showMask':true,
                'detail.showCoupon':true,
                'detail.couponText':prize.item.cpns_name,
            })
            award(partin.partin_id, prize.prize_type);
        }
        if (prize.prize_type == 'product') {
        	_this.setData({
        	    'detail.showMask':true,
                'detail.showProduct':true,
                'detail.productText':prize.item.name,
                'detail.partin_addr_url':config.BASE_URL + '/m/marketingactivity-addrs.html?partin_id=' + partin.partin_id,
        	})
        }
    }
};

// 下发抽奖结果
var award = function (partin_id, type, addr_id, callBack) {
    var data = {partin_id: partin_id};
    if (type == 'product') {
        if (!addr_id)
            return false;
        data['addr_id'] = addr_id;
    }
    util.wxRequest({
    	url:config.BASE_URL+'/openapi/prize/award',
    	method:'POST',
    	data:data,
    	success:function(res){
    		if (!res.data || res.data.result != 'success')
    		    return errorEvent('03', '奖品发放失败：' + res.data.msg);
    		if (callBack)
    		    callBack(res.data);
    	}
    })
};
module.exports = {
	viewRule:viewRule,
	closeRule:closeRule,
	closeError:closeError,
	closeLose:closeLose,
	closeScore:closeScore,
	closeCoupon:closeCoupon,
    closeProduct:closeProduct,
	getNum:getNum,
	onLottery:onLottery,
	errorEvent:errorEvent,
	award:award,
}