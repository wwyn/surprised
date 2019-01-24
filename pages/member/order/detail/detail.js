const config = require('../../../../config/config.js');
const util = require('../../../../utils/util.js');
const app = getApp();


Page({
    data: {
        order_type: 'all',
        status_kvmap: {
            order_status: {
                'active': '',
                'dead': '已作废',
                'finish': '已完成'
            },
            pay_status: ['未支付', '已支付', '已付款至到担保方', '部分付款', '部分退款', '全额退款'],
            ship_status: ['未发货', '已发货', '部分发货', '部分退货', '已退货'],
        }
    },
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '订单详情'
        });
        this.setData({
            is_ready:true
        });
    },
    onShow:function(){
        if(this.data.is_ready && this.data.order_id){
            this.onLoad.call(this,{order_id:this.data.order_id});
        }
    },
    onLoad: function(options) {
        var _this = this;
        this.setData({
          themecolor:app.globalData.themecolor
        })
        var order_id = options.order_id;
        this.setData(options);
        util.checkMember.call(this, function() {
            util.wxRequest({
                url: config.BASE_URL + '/m/order-detail-'+order_id+'.html',
                success: function(res) {
                    var pagedata = res.data;
                    if(pagedata.order.is_virtual !== 'true'){
                        pagedata.order.consignee.area = util.formatArea(pagedata.order.consignee.area);
                    }
                    _this.setData(pagedata);

                },
                complete:function(){
                    _this.setData({hideLoading:true});
                }
            });
        });
        let merchant_id = wx.getStorageSync('merchant_id') ? wx.getStorageSync('merchant_id'):'true';
        this.setData({
          merchant_id: merchant_id
        })

    },
    load_image: function(e) {
        util.loadImage(this,e.currentTarget.dataset.ident,'xs');
    },
    evt_navigator:function(e){
        wx.navigateTo({
            url:e.currentTarget.dataset.url
        });
    },
    evt_goto:function(e){
       let mch = e.currentTarget.dataset.mch;
       if (this.data.merchant_id != 'true' && this.data.merchant_id!=mch) return;
        wx.switchTab({
            url:'/pages/member/index',
            success:function(){
                wx.navigateTo({
                    url:e.currentTarget.dataset.url
                });
            }
        });
    },
    copyTBL: function (e) {
      var self = this;
      wx.setClipboardData({
        data: e.currentTarget.dataset.content,
        success: function (res) {
          wx.showToast({
            title: '复制成功'
          })
        }
      });
    }
});
