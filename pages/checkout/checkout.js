//checkout.js
//结算页
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const strip_tags = require('../../utils/striptags.js');
const dateFormat = require('../../utils/dateformat.js');
const app = getApp();

const form_cart_data = function (data, is_merchant) {
  let _return = data;
  if (is_merchant) {
    if (!_return.objects) return;
    for (var i = 0; i < _return.objects.length; i++) {
      if (_return.objects[i].promotions) {
        //格式化促销规则展示
        if (_return.objects[i].promotions.goods) {
          for (var obj_ident in _return.objects[i].promotions.goods) {
            for (var j = 0; j < _return.objects[i].promotions.goods[obj_ident].length; j++) {
              if (_return.objects[i].promotions.goods[obj_ident][j].tag == '送赠品') {
                _return.objects[i].promotions.goods[obj_ident][j].solution = strip_tags(_return.objects[i].promotions.goods[obj_ident][j].solution).replace(/[\n|\s]/ig, '').split("【赠品】");
              }
            }
          }
        }
        if (_return.objects[i].promotions.order) {
          //console.log('#############3');
          //console.log(_return.objects[i].promotions.order);
          for (var j = 0; j < _return.objects[i].promotions.order.length; j++) {
            if (_return.objects[i].promotions.order[j].tag == '送赠品') {
              _return.objects[i].promotions.order[j].solution = strip_tags(_return.objects[i].promotions.order[j].solution).replace(/[\n|\s]/ig, '').split("【赠品】");
            }
          }
        }
      }
    }
  } else {
    if (_return.promotions) {
        //格式化促销规则展示
        if(_return.promotions.goods){
            for (var obj_ident in  _return.promotions.goods) {
                for (var i = 0; i < _return.promotions.goods[obj_ident].length; i++) {
                    if(_return.promotions.goods[obj_ident][i].tag == '送赠品'){
                        _return.promotions.goods[obj_ident][i].solution = strip_tags(_return.promotions.goods[obj_ident][i].solution).replace(/[\n|\s]/ig,'').split("【赠品】");
                    }
                }
            }
        }
        if(_return.promotions.order){
            for (var i = 0; i < _return.promotions.order.length; i++) {
                if(_return.promotions.order[i].tag == '送赠品'){
                    _return.promotions.order[i].solution = strip_tags(_return.promotions.order[i].solution).replace(/[\n|\s]/ig,'').split("【赠品】");
                }
            }
        }
    }
  }

  return _return;
}

const update_checkout = function() {
        var _this = this;
        util.wxRequest({
            url: config.BASE_URL + '/m/checkout' + (_this.data.is_fastbuy ? '-fastbuy' : '') + '.html',
            success: function(res) {
                var pagedata = res.data;
              console.log('结算中心数据');
              console.log(pagedata);
                if(pagedata.error){
                    return wx.showModal({
                        title:'立即购买失败',
                        content:pagedata.error,
                        showCancel:false,
                        success:function(){
                            wx.navigateBack();
                        }
                    });
                }
                if (!pagedata||!pagedata.cart_result) return;
                // for (var i in pagedata.member_addrs) {
                //     pagedata.member_addrs[i]['area_format'] = util.formatArea(pagedata.member_addrs[i]['area']);
                // }
              pagedata.cart_result = form_cart_data(pagedata.cart_result, pagedata.is_merchant);
                _this.setData(pagedata);
                //积分抵扣暂时注释
                // if (pagedata.cart_result.integraldeduction) {
                //     util.wxRequest({
                //         url: config.BASE_URL + '/openapi/integraldeduction/get_position',
                //         success: function(res) {
                //             _this.setData({
                //                 'cart_result.integraldeduction.position': res.data.data.member_integral_position
                //             });
                //         }
                //     });
                // }
                sync_inused_coupons.call(_this);
            },
            fail: function(re) {
                console.info(re);
            },
            complete: function(e) {
                _this.setData({
                    hideLoading: true
                });
            }
        });
    }
    /**
     * 获得订单提交需要的数据
     */
const get_submit_data = function(pagedata) {

        var _return = {
            'cart_md5': pagedata.cart_md5,
            'invoice_title': pagedata.invoice_title,
            'memo': pagedata.memo,
        };
        _return['need_invoice'] = (_return['invoice_title'] && _return['invoice_title'] != '');
        if(_return['need_invoice'] && pagedata.order_invoice_data){
            for (let k in pagedata.order_invoice_data) {
                _return['invoice_addon['+k+']'] = pagedata.order_invoice_data[k];
            }
        }
        for (var i in pagedata.member_addrs) {
            if (pagedata.member_addrs[i].selected) {
                _return['addr_id'] = pagedata.member_addrs[i]['addr_id'];
                break;
            }
        }
        for (var i in pagedata.dlytypes) {
            if (pagedata.dlytypes[i].selected) {
                _return['dlytype_id'] = pagedata.dlytypes[i]['dt_id'];
                break;
            }
        }
        if(pagedata.is_merchant){
          //_return['dlytype_id'] = '';
          if (!pagedata.cart_result.objects) return;
          for (var j = 0; j < pagedata.cart_result.objects.length;j++){
            let item = pagedata.cart_result.objects[j];
            for (var i in item.dlytypes) {
              if (item.dlytypes[i].selected) {
                _return['dly_id_' + item.merchant.merchant_id] = item.dlytypes[i]['dt_id'];
                break;
              }
            }
          }
        }
        for (var i in pagedata.paymentapps) {
            if (pagedata.paymentapps[i].selected) {
                _return['payapp_id'] = pagedata.paymentapps[i]['app_id'];
                break;
            }
        }
        var _vshop_id = wx.getStorageSync('_vshop_id');
        if(_vshop_id){
            //微店关系
            _return['_vshop_id'] = _vshop_id;
        }
        if(wx.getStorageSync('_qrcode')){
            //O2O分销,门店扫码关系
            _return['qrcode'] = wx.getStorageSync('_qrcode');
        }
        return _return;

    }
    /**
     * 同步购物车优惠券数据到pagedata
     */
const sync_inused_coupons = function() {
  if (!this.data.is_merchant){
    var used_coupons = this.data.cart_result.objects.coupon;
    var my_av_coupons = this.data.my_av_coupons;
    var used_coupons_data = {};
    if (used_coupons.length) {
      for (var i = 0; i < used_coupons.length; i++) {
        if (used_coupons[i]['params']['in_use']) {
          used_coupons_data[used_coupons[i]['coupon']] = used_coupons[i]['params'];
        }
      }
    }
    for (var i in my_av_coupons) {
      if (used_coupons_data[i]) {
        my_av_coupons[i]['in_use'] = used_coupons_data[i];
      } else {
        my_av_coupons[i]['in_use'] = false;
      }
      this.setData({
        'my_av_coupons': my_av_coupons
      });
    }
  }else{
    var used_coupons = [];
    if (!this.data.cart_result.objects) return;
    for (var i=0;i< this.data.cart_result.objects.length;i++){
      for (var j = 0; j < this.data.cart_result.objects[i].objects.coupon.length;j++){
        used_coupons.push(this.data.cart_result.objects[i].objects.coupon[j])
      }
      
    }
    var my_av_coupons = this.data.my_av_coupons;
    var used_coupons_data = {};
    if (used_coupons.length) {
      for (var i = 0; i < used_coupons.length; i++) {
        if (used_coupons[i]['params']['in_use']) {
          used_coupons_data[used_coupons[i]['coupon']] = used_coupons[i]['params'];
        }
      }
    }
    for (var i in my_av_coupons) {
      if (used_coupons_data[i]) {
        my_av_coupons[i]['in_use'] = used_coupons_data[i];
      } else {
        my_av_coupons[i]['in_use'] = false;
      }
      this.setData({
        'my_av_coupons': my_av_coupons
      });
    }
  }

};
const update_maddr = function(addr_selected) {
    var _this = this;
    for (var k in _this.data.member_addrs) {

        if (_this.data.member_addrs[k].addr_id == addr_selected.addr_id) {
            _this.data.member_addrs[k].selected = 'true';
        } else {
            delete(_this.data.member_addrs[k].selected);
        }
        _this.data.member_addrs[k].area_format = util.formatArea(_this.data.member_addrs[k].area);
    }
    _this.setData({
        'member_addrs': _this.data.member_addrs
    });
};

Page({
    data: {
        'active_integral_panel': false,
        'active_coupon_panel': false,
        'is_fastbuy': false,
        'memo':'',
        'datatype':'merchant',
        img_url:config.BASE_HOST
    },
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '订单确认'
        });
    },
    onLoad: function(options) {
        var _this = this;
        _this.setData({
          themecolor:app.globalData.themecolor
        })

        if (options.is_fastbuy) {
            this.setData({
                'is_fastbuy': true
            });
        }
        util.checkMem.call(this, function() {
            update_checkout.call(_this);
        });

    },
    onShow: function() {
        //地址变更处理
        var _this = this;
        var addr_selected = wx.getStorageSync('member_addr_selected');
        if (!addr_selected || !addr_selected.addr_id) {
            return;
        }
        if (addr_selected.addr_id)
            util.wxRequest({
                url: config.BASE_URL + '/m/my-receiver-edit-' + addr_selected.addr_id + '.html',
                success: function(res) {
                    if (!res.data.maddr) {
                        return _this.setData({member_addrs:false});
                    }
                    _this.data.member_addrs = _this.data.member_addrs || {};
                    _this.data.member_addrs[addr_selected.addr_id] = res.data.maddr;
                    update_maddr.call(_this, addr_selected);
                }
            });
    },
    load_image: function(e) {
        util.loadImage(this,e.currentTarget.dataset.ident,'xs');
    },
    evt_tapmodal: function(e) {
        var modal_name = e.target.dataset.modalname;
        if (!modal_name) {
            return;
        }
        var _set = {};
        _set['active_' + modal_name] = false;
        this.setData(_set);
        this.animation.opacity(0).step();
        this.setData({
            modal_animation_data: this.animation.export()
        });
    },
    evt_showmodal: function(e) {
        var modal_name = e.currentTarget.dataset.modalname;
        if (!modal_name) {
            return;
        }
      if (this.data.is_merchant && modal_name =='dlytype_panel'){
          var index = e.currentTarget.dataset.index;
          var mch_id = e.currentTarget.dataset.mch;
          this.setData({
            checkdlytypes: this.data.cart_result.objects[index].dlytypes,
            current_mch: mch_id,
            current_index: index
          })
        console.log(this.data.checkdlytypes);
      } else if (modal_name == 'dlytype_panel'){
          this.setData({
            checkdlytypes: this.data.dlytypes
          })
        }
        var _set = {};
        _set['active_' + modal_name] = true;
        this.setData(_set);
        this.animation = this.animation ? this.animation : wx.createAnimation({
            duration: 400,
            timingFunction: 'ease',
        });
        this.animation.opacity(1).step();
        this.setData({
            modal_animation_data: this.animation.export()
        });
    },
    evt_integral_switch: function(e) {
        var _this = this;
        util.wxRequest({
            url: config.BASE_URL + '/openapi/integraldeduction/cart/' + (e.detail.value ? 'enabled/true/' : ''),
            success: function(res) {
                update_checkout.call(_this);
            }
        });
    },
    evt_dlytypechange: function(e) {
        var _this = this;
        var submit_data = get_submit_data(this.data);
        submit_data['dlytype_id'] = e.currentTarget.dataset.dtid;
        if(_this.data.is_merchant){
          submit_data['dly_id_'+_this.data.current_mch] = e.currentTarget.dataset.dtid;
          //submit_data['dlytype_id'] = '';
        }
        util.wxRequest({
            url: config.BASE_URL + '/m/checkout-check' + (_this.data.is_fastbuy ? '-fastbuy' : '') + '.html',
            data: submit_data,
            method: 'POST',
            success: function(res) {
                if (!res.data.data || res.data.error) {
                    wx.showModal({
                        title: '购物车异常',
                        content: res.data.data.error,
                        success: function(res) {
                            update_checkout.call(_this);
                        }
                    });
                } else {
                    _this.setData(res.data.data);
                    if (_this.data.is_merchant) {
                        // 增加刷新后这一段可以删除
                        let cart_result = _this.data.cart_result;
                        for (var i in cart_result.objects[_this.data.current_index].dlytypes) {
                            if (cart_result.objects[_this.data.current_index].dlytypes[i].dt_id == e.currentTarget.dataset.dtid) {
                                cart_result.objects[_this.data.current_index].dlytypes[i].selected = 'true';
                            } else {
                                delete cart_result.objects[_this.data.current_index].dlytypes[i]['selected']
                            }
                        }
                        _this.setData({
                            'cart_result': cart_result
                        })
                    }
                    _this.evt_tapmodal({
                        target: {
                            dataset: {
                                modalname: 'dlytype_panel'
                            }
                        }
                    });
                }
            }
        });
    },
    evt_payappchange: function(e) {
        var _this = this;
        var submit_data = get_submit_data(this.data);
        submit_data['payapp_id'] = e.currentTarget.dataset.appid;
        util.wxRequest({
            url: config.BASE_URL + '/m/checkout-check' + (_this.data.is_fastbuy ? '-fastbuy' : '') + '.html',
            data: submit_data,
            method: 'POST',
            success: function(res) {
                if (!res.data.data || res.data.error) {
                    wx.showModal({
                        title: '购物车异常',
                        content: res.data.data.error,
                        success: function(res) {
                            update_checkout.call(_this);
                        }
                    });
                } else {
                    _this.setData(res.data.data);
                    _this.evt_tapmodal({
                        target: {
                            dataset: {
                                modalname: 'payapp_panel'
                            }
                        }
                    });
                }
            }
        });
    },
    evt_couponcheck: function(e) {
        var _this = this;
        var dataset = e.currentTarget.dataset;
        if (!dataset || !dataset.coupon || !dataset.nextact) {
            return;
        }
        var post_data = (dataset.nextact == 'use' ? {
            'coupon': dataset.coupon,
        } : {
            'obj_ident': 'coupon_' + dataset.coupon
        });
        util.wxRequest({
            url: config.BASE_URL + '/m/cart-' + dataset.nextact + '_coupon' + (_this.data.is_fastbuy ? '-fastbuy' : '') + '.html',
            data: post_data,
            method: 'POST',
            success: function(res) {
                if (!res.data.data || res.data.error) {
                    wx.showModal({
                        title: '使用优惠券失败',
                        content: '优惠券使用失败原因：不满足促销条件,或存在排他促销规则'
                    });
                    sync_inused_coupons.call(_this);
                } else {
                    var new_cart_md5 = res.data.data['new_cart_md5'];
                    delete(res.data.data['new_cart_md5']);
                    if (_this.data.is_merchant){
                      for(var i=0;i<res.data.data.objects.length;i++){
                        res.data.data.objects[i].dlytypes = _this.data.cart_result.objects[i].dlytypes;
                      }
                      _this.setData({
                        'cart_result': form_cart_data(res.data.data, _this.data.is_merchant)
                      });
                    }else{
                      _this.setData({
                        'cart_result': form_cart_data(res.data.data, _this.data.is_merchant)
                      });
                    }
                    
                    _this.setData({
                        'cart_md5': new_cart_md5
                    });
                    _this.setData({
                        'total.order_total':res.data.data.finally_cart_amount
                    })
                    sync_inused_coupons.call(_this);
                    wx.showToast({
                        title: dataset.nextact == 'use' ? '使用成功' : '取消成功',
                        icon: 'success'
                    });
                }
            }
        });

    },
    evt_scancoupon: function(e) {
        var _this = this;
        wx.scanCode({
            success: function(res) {
                //{errMsg: "scanCode:ok", result: "Agetcoupon", scanType: "QR_CODE", charSet: "UTF-8"}
                _this.setData({
                    'coupon_input': res.result
                });
                _this.evt_couponiptsubmit();
            }
        });
    },
    evt_couponiptsubmit: function(e) {
        var _this = this;
        var coupon_input = _this.data.coupon_input;
        if (!coupon_input) {
            return;
        }
        util.wxRequest({
            url: config.BASE_URL + '/m/cart-use_coupon' + (_this.data.is_fastbuy ? '-fastbuy' : '') + '.html',
            data: {
                'coupon': coupon_input
            },
            method: 'POST',
            success: function(res) {
                if (!res.data.data || res.data.error) {
                    wx.showModal({
                        title: '使用优惠码失败',
                        content: '优惠码使用失败未能成功使用.'
                    });
                } else {
                    var new_cart_md5 = res.data.data['new_cart_md5'];
                    delete(res.data.data['new_cart_md5']);
                    _this.setData({
                      'cart_result': form_cart_data(res.data.data, _this.data.is_merchant)
                    });
                    _this.setData({
                        'cart_md5': new_cart_md5
                    });
                    _this.setData({
                      'total.order_total': res.data.data.finally_cart_amount
                    })
                    sync_inused_coupons.call(_this);
                    wx.showToast({
                        title: '使用成功',
                        icon: 'success'
                    });
                }
            }
        });
    },
    evt_setpagedata: function(e) {
        var _set = {};
        _set[e.currentTarget.dataset.key] = e.detail.value;
        this.setData(_set);
    },
    evt_blur_scoreu: function(e) {
        var integral_val = e.detail.value,
            _this = this;
        if (!_this.data.cart_result.integraldeduction) {
            return;
        }
        if (isNaN(integral_val) || integral_val < 0 || integral_val == _this.data.cart_result.integraldeduction.score_u) {
            _this.setData({
                'cart_result.integraldeduction.score_u': _this.data.cart_result.integraldeduction.score_u
            });
            return;
        }
        util.wxRequest({
            url: config.BASE_URL + '/openapi/integraldeduction/cart/enabled/true/integral/' + integral_val,
            success: function(res) {
                update_checkout.call(_this);
            }
        });
    },
    evt_submit_order: function(e) {
        var pagedata = this.data;
        var submit_data = get_submit_data(pagedata);
        var form_id = e.detail.formId; //模板消息用
        wx.showToast({
            title: '正在提交',
            icon: 'loading',
            mask: true,
            duration: 5000
        });
        util.wxRequest({
            url: config.BASE_URL + '/m/order-create' + (this.data.is_fastbuy ? '-fastbuy' : '') + '.html',
            data: submit_data,
            method: 'POST',
            success: function(res) {
                if (res.data.error) {
                    wx.hideToast();
                    wx.showModal({
                        title: '温馨提示',
                        content: res.data.error || '',
                        showCancel:false
                    });
                } else {
                    let order_id = res.data.redirect.match(/payment-([\d]+)/);
                    if (order_id) {
                        order_id = order_id[1];
                    }
                    /**
                     * 模板消息发送
                     */
                    var action_url = false;
                    var msgCode = '';
                    var msgType = 'AT0002';
                    var msgId = config.TPLMSGID['AT0002'];
                    if (app.globalData.msg_templates && app.globalData.msg_templates.order_create_success) {
                        var action_url = config.BASE_URL + '/openapi/open_app/wx_send_message';
                        msgCode = 'order_create_success';
                        msgType = app.globalData.msg_templates.order_create_success.type;
                        msgId = app.globalData.msg_templates.order_create_success.template;
                    }
                    util.sendMsg({
                        "touser": pagedata.member.openid,
                        "action_url": action_url,
                        "msg_code": msgCode,
                        "msg_type": msgType, //订单创建成功消息模板(对应小程序平台模板类型ID)
                        "template_id": msgId,
                        "page": "/pages/member/order/detail/detail?order_id=" + order_id,
                        "form_id": form_id,
                        "order_id":order_id,
                        "data": {
                            "keyword1": {
                                "value": order_id
                                //（订单号）交易单号
                            },
                            "keyword2": {
                                "value": pagedata.total.order_total
                                //（订单金额,含运费）购买价格
                            },
                            "keyword3": {
                                "value": dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                                //（订单创建时间）购买时间
                            },
                            "keyword4": {
                                "value": "<进入订单详情查看>"
                                //（交易明细）物品名称
                            }
                        },
                        //"emphasis_keyword": "keyword1.DATA" //高亮
                    });

                    wx.redirectTo({
                        url: '/pages/order/payment/payment?order_id=' + order_id + '&flow_success=1'
                    });

                }
            }
        });
    },
    evt_touchmovemodal: function(e) {

    },
    evt_chooseinvoice:function(e){
        var _this = this;
        wx.chooseInvoiceTitle({
            success:function(res){
                let invoice_data = res;
                delete(invoice_data.errMsg);
                let invoice_title = (invoice_data.type == '1'?'个人':invoice_data.title);
                if(!invoice_title || invoice_title == ''){
                    _this.setData({
                        order_invoice_data:null,
                        invoice_title:''
                    });
                }else{
                    _this.setData({
                        order_invoice_data:invoice_data,
                        invoice_title:invoice_title
                    });
                }
                util.wxRequest({
                    url: config.BASE_URL + '/m/checkout-check' + (_this.data.is_fastbuy ? '-fastbuy' : '') + '.html',
                    data: get_submit_data(_this.data),
                    method: 'POST',
                    success: function(res) {
                        if (!res.data.data || res.data.error) {
                            wx.showModal({
                                title: '购物车异常',
                                content: res.data.data.error,
                                success: function(res) {
                                    update_checkout.call(_this);
                                }
                            });
                        } else {
                            _this.setData(res.data.data);
                        }
                    }
                });
            }
        });
    },
    evt_remark: function (e) {
      let id = e.currentTarget.dataset.id;
      let remark = e.currentTarget.dataset.remark;
      let first = e.currentTarget.dataset.first;
      let second = e.currentTarget.dataset.second;
      this.setData({
        remarkid: id,
        remarkContent: remark,
        remarkShow: true,
        remarkfirst: first,
        remarksecond: second
      })
    },
    closeMark: function () {
      this.setData({
        remarkid: '',
        remarkShow: false
      })
    },
    insertContent: function (e) {
      let val = e.detail.value;
      let reg = /([^\u0020-\u007E\u00A0-\u00BE\u2E80-\uA4CF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u0080-\u009F\u2000-\u201f\u2026\u2022\u20ac\r\n])|(\s)/g
      if (val.match(reg)) {
        val = val.replace(reg, '');
      }
      console.log(val);
      this.setData({
        remarkContent: val
      })
    },
    submitMark: function () {
      let _this = this;
      util.wxRequest({
        url: config.BASE_URL + '/m/cart-update.html?ident=goods_' + this.data.remarkid + '&num=' + this.data.remarkContent + '&object_type=remark',
        success: function (res) {
          let cart_result = _this.data.cart_result;
          cart_result.objects[_this.data.remarkfirst].objects.goods[_this.data.remarksecond].params.remark = _this.data.remarkContent;
          console.log(res.data);
          _this.setData({
            cart_md5: res.data.data.cart_md5,
            cart_result: cart_result,
            remarkShow: false
          })
        },
        complete: function () {
          _this.setData({ hideLoading: true });
        }
      });
    },
    refreash_maddr: function () {
      var _this = this;
      var addr_selected = wx.getStorageSync('member_addr_selected');
      util.wxRequest({
        url: config.BASE_URL + '/m/my-receiver-edit-' + addr_selected.addr_id + '.html',
        success: function (res) {
          if (!res.data.maddr) {
            return _this.setData({ member_addrs: false });
          }

          _this.data.member_addrs = _this.data.member_addrs || {};
          _this.data.member_addrs[addr_selected.addr_id] = res.data.maddr;
          _this.setData({
            member_addrs: _this.data.member_addrs
          });
          update_maddr.call(_this, addr_selected);
        }
      });
    }
});
