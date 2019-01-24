const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');

Page({
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '提现'
        });
    },
    onPullDownRefresh: function() {
        //this.onLoad.call(this);
    },
    onShow: function() {

    },
    onLoad: function(options) {
        var _this = this;
        //wx.showNavigationBarLoading();
        util.checkMember.call(this, function() {
            util.wxRequest({
                url: config.BASE_URL + '/m/ubalance-cash.html',
                success: function(res) {
                    _this.setData(res.data);
                },
                complete: function() {
                    _this.setData({
                        hideLoading: true
                    });
                }
            });
        });
    },
    evt_moneyipt: function(e) {
        //console.info(e);
        this.setData({
            update_ubalance_val: e.detail.value * this.data.setting.exchange_ratio * (1 + parseFloat(this.data.setting.cash_out_fee_ratio))
        });
    },
    evt_submit: function(e) {
        wx.showToast({
            title: '正在提交',
            icon: 'loading',
            mask: true
        });
        util.wxRequest({
            url: config.BASE_URL + '/m/ubalance-cash_out.html',
            method: 'POST',
            data: e.detail.value,
            success: function(res) {
                var resdata = res.data;
                console.info(res);
                if (!resdata.error) {
                    wx.showModal({
                        title: '提现申请成功',
                        content: '您的提现申请已成功提交,财务将尽快审核放款',
                        showCancel: false,
                        success: function(e) {
                            wx.navigateBack();
                        }
                    });
                } else {
                    wx.showModal({
                        title: '提现申请失败',
                        content: resdata.error || '',
                        showCancel: false
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
    }
});
