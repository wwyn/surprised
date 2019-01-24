const config = require('../../config/config.js');
const util = require('../../utils/util.js');

const wxpay = function(money) {
    if (money <= 0) return;
    var pagedata = this.data;
    wx.showToast({
        'icon': 'loading',
        'title': '准备支付',
        'mask': true,
        'duration': 10000
    });
    var _this = this;
    util.wxRequest({
        url: config.BASE_URL + '/m/balancepay-do_recharge.html?openid=' + pagedata.member.openid,
        method: 'POST',
        data: {
            money: money,
            payapp_id: 'wxpayinwxapp'
        },
        success: function(res) {
            wx.hideToast();
            if (res.data.error) {
                wx.showModal({
                    title: '支付请求异常',
                    content: res.data.error || ''
                });
            } else {
                let pay_params = res.data;
                pay_params.success = function(res) {
                    wx.showToast({
                        'icon': 'success',
                        'title': '支付成功',
                        'duration': 1500
                    });
                    wx.navigateBack();
                };
                pay_params.fail = function(res) {
                    if (res.errMsg == 'requestPayment:fail cancel') {
                        return;
                    }
                }
                wx.requestPayment(pay_params);
            }
        }
    });
};
Page({
    data: {
        hideLoading: false,
        activity_id: '',
        product_id: '',
        imgsrc:'',
    },
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '充值'
        });
    },
    onPullDownRefresh: function() {
        //this.onLoad.call(this);
    },
    onShow: function() {
        this.onLoad(this.data.options);
    },
    onLoad: function(options) {
        this.setData({
            options: options
        })
        this.setData(options)
        this.setData({
          activity_id: options.activity_id ? options.activity_id:'',
          product_id: options.product_id ? options.product_id:'',
          imgsrc: options.imgsrc ? options.imgsrc:'',
        });

        var _this = this;
        var order_id = options.order_id;
        //wx.showNavigationBarLoading();
        var _url = '';
        if (options.from && options.from == 'gb') {
            _url = '/m/gbcheckout-dopayment-' + order_id + '.html'
        }else{
            _url = '/m/checkout-dopayment-' + order_id + '.html'
        }
        util.checkMem.call(this, function() {
            util.wxRequest({
                url: config.BASE_URL + _url,
                method: 'POST',
                success: function(res) {
                    if(res.data.setting && res.data.setting.name){
                        wx.setNavigationBarTitle({
                            title: res.data.setting.name + '支付'
                        });
                        _this.setData(res.data);
                    }else{
                        
                    }
                },
                complete: function(e) {
                    _this.setData({
                        hideLoading: true
                    });
                }
            });
        });
    },
    evt_submit: function(e) {
       var _this = this;
        // console.info(e);
        var vcode_val = null;
        if(e.detail.value && e.detail.value.vcode){
            vcode_val = e.detail.value.vcode;
        }
        wx.showToast({
            title: '正在支付',
            icon: 'loading',
            mask: true,
            duration: 10000
        });
        util.wxRequest({
            url: config.BASE_URL + '/m/balancepay-do_payment.html',
            method: 'POST',
            data: {
                bill_id: this.data.bill_arr.bill_id,
                vcode:vcode_val
            },
            success: function(res) {
                if (res.data && res.data.success) {
                    wx.showModal({
                        title: '支付成功',
                        showCancel: false,
                        success: function(e) {
                            // wx.navigateBack();
                            let _url = '';
                            if(_this.data.from != undefined && _this.data.from === 'gb'){
                                // _url = "/pages/member/gborder/index";
                              _url = '/pages/groupbooking/payment/paysuccess/paysuccess?activity_id=' + this.data.activity_id + '&product_id=' + this.data.product_id + '&imgsrc=' + this.data.imgsrc;
                            }else{
                                _url = "/pages/member/order/index";
                            }
                            wx.redirectTo({
                                url:_url
                            })
                        }
                    });
                } else {
                    wx.showModal({
                        title: '支付失败',
                        content: res.data.error || '',
                        showCancel:false
                    });
                }
            },
            complete: function() {
                wx.hideToast();
            }
        });
    },
    evt_getcode: function(e) {
        var _this = this;
        if (_this.data.vcode_percent > 0) {
            return;
        }
        util.wxRequest({
            url: config.BASE_URL + '/m/passport-member_vcode.html',
            method: 'POST',
            data: {
                account: _this.data.member_mobile
            },
            success: function(res) {
                let resdata = res.data;
                if (resdata.success) {
                    wx.showToast({
                        icon: 'success',
                        title: '发送成功',
                        success: function() {
                            _this.setData({
                                vcode_percent: 1
                            });
                            if (_this.vcode_percent_timer) {
                                clearInterval(_this.vcode_percent_timer)
                            }
                            var iv = 1;
                            _this.vcode_percent_timer = setInterval(function() {
                                if (_this.data.vcode_percent > 100) {
                                    _this.setData({
                                        vcode_percent: 0
                                    });
                                    return clearInterval(_this.vcode_percent_timer);
                                }
                                _this.setData({
                                    vcode_percent: Math.round(iv / 60 * 100)
                                });
                                iv++;
                            }, 1000);
                        }
                    });
                } else {
                    wx.showModal({
                        title: '获取验证码失败',
                        content: (resdata.error || ''),
                        showCancel: false
                    });
                }
            },
            complete: function() {

            }
        });
    },
    evt_goto: function(e) {
        wx.navigateTo({
            url: e.currentTarget.dataset.url
        });
    }
});
