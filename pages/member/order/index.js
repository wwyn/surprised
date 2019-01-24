const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
const app = getApp();
var current_page = 1;
var loading_more = false;
var load_list = function(page) {
    loading_more = true;
    var _this = this;
    var page = page ? page : 1;
    util.wxRequest({
        url: config.BASE_URL + '/m/my-orders' + ('-' + this.data.order_type) + '-' + page + '.html',
        success: function(res) {
            var newdata = res.data;
            var _thisdata = _this.data;
            if (newdata) {
                if (_thisdata.order_list && page > 1) {
                    newdata.order_list = _thisdata.order_list.concat(newdata.order_list);
                    Object.assign(newdata.order_items_group,_thisdata.order_items_group);
                    Object.assign(newdata.merchant_list, _thisdata.merchant_list);
                    // for (var order_id in _thisdata.order_items_group) {
                    //     newdata.order_items_group[order_id] = _thisdata.order_items_group[order_id];
                    // }
                }
                if (!newdata.order_list || !newdata.order_list.length) {
                    newdata.empty_list = 'YES';
                } else {
                    newdata.empty_list = 'NO';
                }
                _this.setData(newdata);
            }
        },
        complete:function(){
            _this.setData({hideLoading:true});
            loading_more = false;
        }
    });
};

Page({
    data: {
        order_type: 'all',
        empty_list: 'NO',
        status_kvmap: {
            order_status: {
                'active': '执行中',
                'dead': '已作废',
                'finish': '已完成'
            },
            pay_status: ['未支付', '已支付', '已付款至到担保方', '部分付款', '部分退款', '全额退款'],
            ship_status: ['未发货', '已发货', '部分发货', '部分退货', '已退货'],
        },
        img_url:config.BASE_HOST
    },
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '我的订单'
        });
        this.setData({
            is_ready:true
        });
    },
    onShow:function(){
        // if(this.data.is_ready){
        //     load_list.call(this,current_page);
        // }
    },
    onLoad: function(options) {
        var _this = this;
        wx.getSystemInfo({
            success: function(res) {
                _this.setData({
                    sv_height: res.windowHeight,
                });
            }
        });
        this.setData(options);
        current_page = 1;
        util.checkMember.call(this, function() {
            load_list.call(_this,current_page);
        });
    },
    load_image: function(e) {
        util.loadImage(this,e.currentTarget.dataset.ident,'xs');
    },
    evt_scrolltolower: function(e) {
        if (loading_more || this.data.pager.total == this.data.pager.current) {
            return;
        }
        current_page += 1;
        load_list.call(this, current_page);
    },
    evt_navigator:function(e){
        wx.navigateTo({
            url:e.currentTarget.dataset.url
        });
    },
    evt_cancelorder:function(e){
        var order_id = e.currentTarget.dataset.orderid;
        var _this = this;
        wx.showModal({
            title:'取消订单#'+order_id,
            content:'取消后,该订单将无法进行任何操作。是否确认取消订单？',
            cancelText:'否',
            confirmText:'是',
            success:function(res){
                if(res.confirm){
                    util.wxRequest({
                        url: config.BASE_URL + '/m/order-docancel-'+order_id+'.html',
                        success: function(res) {
                            wx.showToast({
                                title:"订单取消成功",
                                icon:"success",
                                duration:1500,
                            });
                            load_list.call(_this, current_page);
                        }
                    });
                }
            }
        });
    },
  //确认收货
  orderSure_Fun: function (e) {
    let _this = this;
    wx.showModal({
      title: '确认收货',
      content: '确认收到该订单的商品',
      cancelText: '否',
      confirmText: '是',
      confirmColor: '#FC4773',
      cancelColor: '#999999',
      success: function (res) {
        if (res.confirm) {
          util.wxRequest({
            url: config.BASE_URL + '/m/order-dofinish-' + e.currentTarget.dataset.order_id + '.html',
            success: function (res) {
              if (res.data.success) {
                wx.showToast({
                  title: "确认收货成功",
                  icon: "success",
                  duration: 1500,
                });
                current_page = 1;
                load_list.call(_this, current_page);
              }
            }
          });
        }
      }
    });
  }
});
