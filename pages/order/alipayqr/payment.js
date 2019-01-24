//payment.js
//订单成功&支付
const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
//var md5 = require('../../../utils/md5.js');
const app = getApp();


Page({
    data:{
        qrcode_api: config.BASE_URL + '/openapi/qrcode/encode/size/12/margin/0',
        pay:'',
        activity_id: '',
        product_id: '',
        imgsrc:'',
    },
    onReady: function () {
        wx.setNavigationBarTitle({
            title: '支付宝扫码支付'
        });
    },
    onLoad: function (options) {
        this.setData({
          activity_id: options.activity_id,
          product_id: options.product_id,
          imgsrc: options.imgsrc,
        });

        var _this = this;
        _this.setData({
            themecolor: app.globalData.themecolor,
        })
        var order_id = options.order_id;
        var dopayment_url = config.BASE_URL + '/m/checkout-dopayment-' + order_id + '.html';
        util.checkMember.call(this, function () {
            util.wxRequest({
                url: dopayment_url,
                success: function (res) {
                    if(res.statusCode === 200 && res.data && res.data.bill_id){
                        //success show qrcode
                        var pagedata = res.data;
                        pagedata.total_fee = pagedata.total_fee.toFixed(2);
                        _this.setData({
                            pay:res.data
                        })
                        function dopay(){
                            util.wxRequest({
                                url:config.BASE_URL+'/m/order-query_pay-'+res.data.bill_id+'.html',
                                success:function(res){
                                    if(!res.data.pay_status){
                                        app.globalData.timer = setTimeout(dopay,1000);
                                        console.log(app.globalData.timer)
                                    }else{
                                        //
                                        clearTimeout(app.globalData.timer);
                                        wx.navigateBack();
                                        // wx.showModal({
                                        //     title:'支付成功',
                                        //     content:'订单已支付,可在我的订单中查看',
                                        //     showCancel:true,
                                        //     cancelText:'返回首页',
                                        //     confirmText:'查看订单',
                                        //     success:function(res){
                                        //         if(res.confirm){
                                        //             wx.switchTab({
                                        //                 url:'/pages/member/index'
                                        //             })
                                        //         }else{
                                        //             wx.switchTab({
                                        //                 url:'/pages/index/index'
                                        //             })
                                        //         }
                                        //     }
                                        // })
                                    }
                                }
                            })
                        }
                        dopay();
                      if (_this.data.from != undefined && _this.data.from === 'gb') {
                        //跳转到拼单成功的页面
                        wx.redirectTo({
                          url: '/pages/groupbooking/payment/paysuccess/paysuccess?activity_id=' + this.data.activity_id + '&product_id=' + this.data.product_id + '&imgsrc=' + this.data.imgsrc
                        });
                      }
                    }else{
                        wx.showModal({
                            title:'支付失败',
                            content:'支付失败'
                        })
                    }
                }, complete: function (re) {
                    _this.setData({
                        hideLoading: true
                    });
                }
            });
        });
    }

});
