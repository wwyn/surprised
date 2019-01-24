const config = require('../../config/config.js');
const util = require('../../utils/util.js');

const wxpay  = function(money){
    if(money<=0)return;
    var pagedata = this.data;
    wx.showToast({
        'icon':'loading',
        'title':'准备支付',
        'mask':true,
        'duration':10000
    });
    var _this = this;
    util.wxRequest({
        url:config.BASE_URL+'/m/balancepay-do_recharge.html?openid='+pagedata.member.openid,
        method:'POST',
        data:{
            money:money,
            payapp_id:'wxpayinwxapp'
        },
        success: function(res) {
            wx.hideToast();
            if(res.data.error){
                wx.showModal({
                  title: '支付请求异常',
                  content: res.data.error||''
                });
            }else{
                let pay_params = res.data;
                pay_params.success = function(res){
                    wx.showModal({
                        title: '充值成功',
                        showCancel: false,
                        success: function(e) {
                          wx.setStorage({
                            key: 'reload_member_info',
                            data: 'true',
                            complete: function () {
                              wx.navigateBack();
                            }
                          });
                        }
                    });
                };
                pay_params.fail = function(res){
                    if(res.errMsg == 'requestPayment:fail cancel'){
                        return;
                    }
                }
                wx.requestPayment(pay_params);
            }
        }
    });
};
Page({
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '充值'
        });
    },
    onPullDownRefresh: function() {
        
    },
    onShow:function(){

    },
    onLoad: function(options) {
        var _this = this;
        //wx.showNavigationBarLoading();
        util.checkMem.call(this, function() {
            util.wxRequest({
                url: config.BASE_URL + '/m/ubalance-recharge.html',
                success: function(res) {
                    _this.setData(res.data);
                }
            });
        });
    },
    evt_moneyipt:function(e){
        //console.info(e);
        this.setData({
            update_ubalance_val:e.detail.value * this.data.setting.exchange_ratio
        });
    },
    evt_submit:function(e){
        wxpay.call(this,e.detail.value.money);
    }
});
