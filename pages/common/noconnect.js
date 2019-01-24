//index.js
//获取应用实例
const config = require('../../config/config.js');

Page({
    data: {
      img_url:config.BASE_HOST
    },
    evt_retry: function(e) {
        wx.getNetworkType({
            success:function(re){
                if(re.networkType != 'none'){
                    wx.reLaunch({
                        url:'/pages/index/index'
                    });
                }
            },
            fail:function(){
            }
        });
    }
});
