const config = require('../../../../config/config.js');
const util = require('../../../../utils/util.js');
const app = getApp();


Page({
    data:{
      img_url:config.BASE_HOST
    },
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '物流追踪'
        });
    },
    onLoad: function(options) {
        var _this = this;
        util.checkMember.call(this,function(){
            util.wxRequest({
                url: config.BASE_URL + '/m/logisticstracker-'+options.order_id+'.html',
                success: function(res) {
                    _this.setData(res.data);
                    var pagedata = _this.data.data;
                    var logi_log = pagedata[0].success.logi_log;
                    var delivery_items = pagedata[0].success.delivery_items;
                    var total = 0;
                    for (var j = 0; j < delivery_items.length; j++){
                      total += Number(delivery_items[j].sendnum);
                    }
                    _this.setData({
                      num_total: total
                    })
                    for (var i = 0; i < logi_log.length;i++){
                      var arr = logi_log[i].time.split(' ');
                      logi_log[i]['date'] = arr[0];
                      logi_log[i]['timer'] = arr[1];
                    }
                    pagedata[0].success.logi_log = logi_log;
                    _this.setData({
                      data: pagedata
                    });
                },
                complete:function(){
                    _this.setData({hideLoading:true});
                }
            });
        });
    },
    load_image: function(e) {
        util.loadImage(this,e.currentTarget.dataset.ident,'xs');
    },
    copyTBL: function (e) {
      let item = e.currentTarget.dataset.item;
      wx.setClipboardData({
        data: item,
        success: function (res) {
          wx.showToast({
            title: '复制成功！',
          })
        }
      });
    },
});
