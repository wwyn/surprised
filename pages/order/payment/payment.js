//payment.js
//订单成功&支付
const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
//var md5 = require('../../../utils/md5.js');
const app = getApp();

//小程序内微信支付
var wxpay = function () {
    var pagedata = this.data;
    var order_id = pagedata.order.order_id;
    wx.showToast({
        'icon': 'loading',
        'title': '正在加载',
        'mask': true,
        'duration': 2500
    });
    var _this = this;
    util.wxRequest({
        url: config.BASE_URL + '/m/checkout-dopayment-' + order_id + '.html?openid=' + pagedata.member.openid,
        success: function (res) {
            wx.hideToast()
            if (res.data.error) {
                wx.showModal({
                    title: '支付请求异常',
                    content: res.data.error || ''
                });
            } else {
                let pay_params = res.data;
                pay_params.success = function (res) {
                    wx.showToast({
                        'icon': 'success',
                        'title': '支付成功',
                        'duration': 1500
                    });
                    _this.onLoad({
                        'order_id': order_id
                    });
                    /**
                     * 模板消息发送
                     */
                    var action_url = false;
                    var msgCode = '';
                    var msgType = 'AT0007';
                    var msgId = config.TPLMSGID['AT0007'];
                    if (app.globalData.msg_templates && app.globalData.msg_templates.order_deliver_remind) {
                        var action_url = config.BASE_URL + '/openapi/open_app/wx_send_message';
                        msgCode = 'order_deliver_remind';
                        msgType = app.globalData.msg_templates.order_deliver_remind.type;
                        msgId = app.globalData.msg_templates.order_deliver_remind.template;
                    }
                    if (pay_params.package) {
                        util.sendMsg({
                            "touser": pagedata.member.openid,
                            "action_url": action_url,
                            "msg_code": msgCode,
                            "msg_type": msgType, //订单发货成功消息模板(对应小程序平台模板类型ID)
                            "template_id": msgId,
                            "page": "/pages/member/order/detail/detail?order_id=" + order_id,
                            "form_id": pay_params.package.match(/prepay_id=([^&]+)/i)[1],
                            "order_id": order_id
                                    /**
                                     *  'keyword1'#订单号
                                     *  'keyword2'#发货时间
                                     *  'keyword3'#物流公司
                                     *  'keyword4'#物流单号
                                     *  'keyword5'#收货人
                                     *  'keyword6'#收货地址
                                     *  'keyword7'#收货联系方式
                                     */
                                    //"emphasis_keyword": "keyword1.DATA" //高亮
                        });
                    }
                };
                pay_params.fail = function (res) {
                    if (res.errMsg == 'requestPayment:fail cancel') {
                        return;
                    }
                    wx.showModal({
                        title: '支付失败',
                        content: '请稍后再试'
                    });
                }

                wx.requestPayment(pay_params);
            }
        }
    });


}

Page({
    data:{
        img_url:config.BASE_HOST
    },
    onReady: function () {
        wx.setNavigationBarTitle({
            title: '订单支付'
        });
    },
    evt_tapmodal: function (e) {
        var modal_name = e.target.dataset.modalname;
        if (!modal_name) {
            return;
        }
        var _set = {
        };
        _set['active_' + modal_name] = false;
        this.setData(_set);
        this.animation.opacity(0).step();
        this.setData({modal_animation_data: this.animation.export()});
    },
    evt_showmodal: function (e) {
        var modal_name = e.currentTarget.dataset.modalname;
        if (!modal_name) {
            return;
        }
        var _set = {};
        _set['active_' + modal_name] = true;
        this.setData(_set);
        this.animation = this.animation ? this.animation : wx.createAnimation({
            duration: 400,
            timingFunction: 'ease',
        });
        this.animation.opacity(1).step();
        this.setData({modal_animation_data: this.animation.export()});
    },
    evt_payappchange: function (e) {
        var payapp_id = e.currentTarget.dataset.appid;
        wx.showNavigationBarLoading();
        this.onLoad({
            'order_id': this.data.order.order_id,
            'flow_success': this.data.flow_success,
            'payapp_id': payapp_id,
        });
        var _this = this;
        setTimeout(function () {
            _this.evt_tapmodal({
                target: {
                    dataset: {
                        modalname: 'payapp_panel'
                    }
                }
            });
        }, 300);

    },
    evt_alipayqr:function(){
        //alipay_qr_pay who care
        wx.navigateTo({
            url:'/pages/order/alipayqr/payment?order_id='+this.data.order.order_id
        })
    },
    evt_dopayment: function (e) {
        var payapp = this.data.selected_payapp;
        switch (payapp.app_id) {
            case 'wxpayinwxapp':
                wxpay.call(this);
                break;
            case 'balance':
                wx.redirectTo({
                    url: '/pages/ubalance/pay?order_id=' + this.data.order.order_id
                });
                break;
            case 'alipayqr':
                  this.evt_alipayqr(); 
                break;
        }
    },
    evt_orderdetail: function (e) {
        var order_id = e.currentTarget.dataset.orderid;
        wx.redirectTo({
            url: '/pages/member/order/detail/detail?order_id=' + order_id
        });
    },
    onShow:function(){
        console.log('onshow',this.data.hideLoading)
        if (this.data.hideLoading && this.data.selected_payapp.app_id === 'alipayqr') {
            console.log('~~~~~~~~~~~')
            console.log(app.globalData.timer)
            clearTimeout(app.globalData.timer)
            console.log(app.globalData.timer)
            console.log('@@@@@@@@@@@@@')
            this.onLoad({
                order_id:this.data.order.order_id,
                flow_success:1
            });
        }
    },
    onLoad: function (options) {
        console.log('onload')
        var _this = this;
        _this.setData({
            themecolor: app.globalData.themecolor
        })
        var order_id = options.order_id;
        var act_url = config.BASE_URL + '/m/checkout-payment-' + order_id + '-' + (options.flow_success ? 1 : 0);
        if (options.payapp_id) {
            act_url += '-' + options.payapp_id
        }
        util.checkMem.call(this, function () {
            util.wxRequest({
                url: act_url + '.html',
                success: function (res) {
                    wx.hideNavigationBarLoading();
                    if (res.data.error) {
                        wx.showModal({
                            title: '错误',
                            content: res.data.error || ''
                        });
                    } else {
                        if (res.data.success && res.data.redirect && res.data.redirect.match(/my-orders/)) {
                            //已支付订单
                            wx.showModal({
                                title: '订单已支付成功',
                                content: "订单:" + order_id + "已完成支付。",
                                showCancel: false,
                                success: function (res) {
                                    if (res.confirm) {
                                        wx.redirectTo({
                                            url: '/pages/member/order/detail/detail?order_id=' + order_id
                                        });
                                    }
                                }
                            });
                            return;
                        }
                        for (var i in res.data.payapps) {
                            if (res.data.payapps[i].app_id == res.data.selected_payapp.app_id) {
                                res.data.payapps[i]['selected'] = 'true';
                            }
                        }
                        //res.data.order.consignee.area = util.formatArea(res.data.order.consignee.area);
                        _this.setData(res.data);

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
