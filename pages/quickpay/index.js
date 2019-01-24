const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const dateFormat = require('../../utils/dateformat.js');

//小程序内微信支付
var wxpay = function(order_id) {
    if (!order_id) return;
    var pagedata = this.data;
    wx.showLoading();
    var _this = this;
    util.wxRequest({
        url: config.BASE_URL + '/m/qpcheckout-payment-' + order_id + '.html?openid=' + pagedata.member.openid,
        success: function(res) {
            wx.hideToast()
            if (res.data.error) {
                wx.showModal({
                    title: '支付请求异常',
                    content: res.data.error || ''
                });
            } else {
                let pay_params = res.data;
                pay_params.success = function(res) {
                    _this.setData({
                        pay_success: true
                    });
                    wx.showToast({
                        'icon': 'success',
                        'title': '支付成功',
                        'duration': 1500
                    });
                    /**
                     * 模板消息发送
                     */
                    if (pay_params.package) {
                        /**
                         * 模板消息发送
                         */
                        util.sendMsg({
                            "touser": pagedata.member.openid,
                            "msg_type": 'AT0002', //订单创建成功消息模板(对应小程序平台模板类型ID)
                            "template_id": config.TPLMSGID['AT0002'],
                            "page": "/pages/index/index",
                            "form_id": pay_params.package.match(/prepay_id=([^&]+)/i)[1],
                            "order_id": order_id,
                            "data": {
                                "keyword1": {
                                    "value": order_id
                                    //（订单号）交易单号
                                },
                                "keyword2": {
                                    "value": pagedata.finally_total
                                },
                                "keyword3": {
                                    "value": dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                    //（订单创建时间）购买时间
                                },
                                "keyword4": {
                                    "value": pagedata.score_g ? "您本次支付共获得" + pagedata.score_g + "积分" : "感谢支付,点击查看更多"
                                }
                            },
                            "emphasis_keyword": "keyword2.DATA" //高亮
                        });
                    }
                };
                pay_params.fail = function(res) {
                    _this.setData({
                        paying: false
                    });
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
    data: {
        paying: false,
        pay_success: false
    },
    onShareAppMessage: function() {
        var the_path = '/pages/quickpay/index?rel_member_id=' + this.data.member.member_id;
        var the_title = this.data.setting.quickpay_payee_warning||'快捷付款';
        the_path = util.merchantShare(the_path);
        return {
            title: the_title,
            path: the_path
        };
    },
    onReady: function() {
        var _this = this;
        wx.setNavigationBarTitle({
            title: ' '
        });
        // wx.getSystemInfo({
        //     success: function(res) {
        //         _this.setData({
        //             win_width: res.windowWidth,
        //             win_height: res.windowHeight
        //         });
        //     }
        // });
    },
    evt_orderdetail: function(e) {
        var order_id = e.currentTarget.dataset.orderid;
        wx.redirectTo({
            url: '/pages/quickpay/order?order_id=' + order_id
        });
    },
    onLoad: function(options) {
        var _this = this;
        util.checkMember.call(this, function() {
            util.wxRequest({
                url: config.BASE_URL + '/m/qpcheckout.html',
                success: function(res) {
                    if (res.data.error) {
                        wx.showModal({
                            title: '错误',
                            content: res.data.error || ''
                        });
                    } else {
                        _this.setData(res.data);
                    }
                },
                complete: function(re) {
                    _this.setData({
                        hideLoading: true
                    });
                }
            });
        });
    },
    evt_submit_order: function(e) {
        var _this = this;
        var params = e.detail.value;
        if (isNaN(params['order_total']) || parseFloat(params['order_total']) <= 0) {
            return wx.showModal({
                title: '支付错误',
                content: '支付金额有误',
                showCancel: false
            });
        }
        wx.showLoading();
        _this.setData({
            paying: true
        });
        util.checkMember.call(this, function() {
            util.wxRequest({
                url: config.BASE_URL + '/m/qpcheckout-submit_order.html',
                method: 'POST',
                data: params,
                success: function(res) {
                    var resdata = res.data;
                    if (resdata && resdata.success && resdata.redirect) {
                        // resdata.redirect  # 快捷支付订单号
                        wxpay.call(_this, resdata.redirect);
                    } else {
                        _this.setData({
                            paying: false
                        });
                        wx.showModal({
                            title: '下单失败',
                            content: resdata.error ? resdata.error : '',
                            showCancel: false
                        });
                    }
                },
                complete: function(re) {
                    wx.hideLoading();
                }
            });
        });
    },
    load_image: function(e) {
        util.loadImage(this, e.currentTarget.dataset.ident, 'm');
    },
    evt_realcal: function(e) {
        console.info(e);
        let set = {};
        set[e.currentTarget.dataset.name] = e.detail.value;
        this.setData(set);
        var setting = this.data.setting;
        var finally_total = 0;
        var dis_rate = 1;
        var out_dis = 0;
        var score_g = 0;
        /*finally_total cal*/
        if (setting.quickpay_discount_rate &&
            (dis_rate = parseFloat(setting.quickpay_discount_rate)) < 1 &&
            dis_rate > 0) {
            if (setting.quickpay_out_discount_enabled == 'yes' && this.data.out_discount && (out_dis = parseFloat(this.data.out_discount)) > 0) {
                if (out_dis > this.data.order_total) {
                    out_dis = this.data.order_total;
                }
                finally_total = (parseFloat(this.data.order_total) - out_dis) * dis_rate + out_dis;
            } else {
                finally_total = parseFloat(this.data.order_total) * dis_rate;
            }
        } else {
            finally_total = this.data.order_total;
        }
        finally_total = isNaN(finally_total) ? 0 : finally_total;
        if(setting.quickpay_score_rate && setting.quickpay_score_rate>0){
            score_g = parseFloat(finally_total) * parseFloat(setting.quickpay_score_rate);
        }
        this.setData({
            finally_total: finally_total,
            score_g:Math.round(score_g)
        });
    },
    evt_reset: function(e) {
        this.setData({
            order_total: 0,
            out_discount: 0,
            pay_success: false,
            finally_total:false,
            score_g:0,
            paying: false
        });
    },
    evt_showqrcode: function(e) {
        var the_path = '/pages/quickpay/index?rel_member_id=' + this.data.member.member_id;
        wx.showToast({
            title: '正在生成..',
            icon: 'loading',
            duration: 10000
        });
        util.getqrcode({
            'path': the_path,
            'type': 'scene',
            'width': 600
        }, function(qr_image_data) {
            wx.hideToast();
            wx.previewImage({
                urls: [qr_image_data.qrcode_image_url]
            });
        });
    }
});
