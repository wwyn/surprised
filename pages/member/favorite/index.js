const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
const app = getApp();


Page({
  data:{
    img_url:config.BASE_HOST
  },
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '我的收藏'
        });
    },
    onLoad: function(options) {
        var _this = this;

        util.checkMember.call(this, function() {
            util.wxRequest({
                url: config.BASE_URL + '/m/my-favorite.html',
                success: function(res) {
                    var pagedata = res.data;
                    pagedata['hideLoading'] = true;
                    _this.setData(pagedata);
                }
            });
        });
        let merchant_id = wx.getStorageSync('merchant_id') ? wx.getStorageSync('merchant_id') : 'true';
        this.setData({
          merchant_id: merchant_id
        })
    },
    load_image: function(e) {
        util.loadImage(this,e.currentTarget.dataset.ident,'xs');
    },
    evt_remove: function(e) {
        var goods_id = e.currentTarget.dataset.goodsid;
        var _this =this;
        console.info(e);
    },
    evt_goto:function(e){
        let mch = e.currentTarget.dataset.mch;
        if (this.data.merchant_id != 'true' && this.data.merchant_id != mch) return;
        wx.switchTab({
            url:'/pages/member/index',
            success:function(){
                wx.navigateTo({
                    url:e.currentTarget.dataset.url
                });
            }
        });
    }

});
