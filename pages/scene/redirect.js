const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const getQuery = function (url, query) {
  if (url.indexOf('?') < 0)
    return;
  var arr = url.split('?');
  var query_arr = arr[1].split('&');
  for (var i = 0; i < query_arr.length; i++) {
    let single_arr = query_arr[i].split('=');
    console.log('single_arr', single_arr);
    if (!single_arr[1]) continue;
    query[single_arr[0]] = single_arr[1];
  }
  return query;
};

Page({
    data:{
        hideLoading:false
    },
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '正在跳转...'
        });
    },
    onLoad: function(options) {
        var _this = this;
        if(!options ||!options.scene){
            wx.switchTab({
                url:'/pages/index/index'
            });
            return;
        }
        util.wxRequest({
            url: config.BASE_URL + '/openapi/wechat/get_scene_path/scenekey/'+options.scene,
            success: function(res) {
                var resdata = res.data;
                console.info(resdata);
                if(!resdata || !resdata.result || resdata.result !='success'){
                    wx.switchTab({
                        url:'/pages/index/index'
                    });
                }else{
                    //success
                    var scene_path = resdata.data.scene_path;
                    if(!scene_path){
                        wx.switchTab({
                            url:'/pages/index/index'
                        });
                    }else{
                      try {
                        var query = {};
                        console.log('scene_path解析前');
                        console.log(scene_path);
                        if (scene_path) getQuery(decodeURIComponent(scene_path), query);
                        console.log('scene_path解析后');
                        console.log(query);
                        // 商户id
                        if (query && query.merchant_id) {
                          let mch_id = wx.getStorageSync('merchant_id') ? wx.getStorageSync('merchant_id'):0;
                          if (mch_id != query.merchant_id){
                            wx.setStorageSync('is_reload', 'true');
                          }else{
                            wx.removeStorageSync('is_reload');
                          }
                          if (query.merchant_id != 0) {
                            wx.setStorageSync('merchant_id', query.merchant_id);
                          } else {
                            wx.removeStorageSync('merchant_id');
                          }
                        }
                        if (query && query._vshop_id) {
                          //微店id 记录
                          /**
                           * @see /pages/checkout/checkout.js line 105
                           */
                          wx.setStorageSync('_vshop_id', query._vshop_id);
                        }
                      } catch (e) {
                        console.log(e);
                      }
                        wx.redirectTo({
                            url:scene_path,
                            fail:function(){
                                wx.switchTab({
                                    url:'/pages/index/index'
                                });
                            }
                        });
                    }
                }
            },
            fail: function(re) {
                wx.switchTab({
                    url:'/pages/index/index'
                });
            },complete:function(){
                // _this.setData({
                //     hideLoading:true
                // });
                wx.stopPullDownRefresh();
            }
        });
    }
});
