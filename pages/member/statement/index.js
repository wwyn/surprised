// pages/member/statement/index.js
const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
const dateFormat = require('../../../utils/dateformat.js');
const app = getApp();
var current_page = 1;
var loading_more = false;
var load_list = function (page) {
  loading_more = true;
  var _this = this;
  var page = page ? page : 1;
  util.wxRequest({
    url: config.BASE_URL+'/m/my-bills'+'-'+page+'.html',
    success: function (res) {
      console.log(res)
      var newdata = res.data;
      console.log(newdata)
      for (var i = 0; i < newdata.length;i++){
        var createtime = dateFormat(newdata[i].createtime * 1000, 'HH:MM')
      }
      var _thisdata = _this.data;
      if (newdata) {
        if (page > 1 && _thisdata.newdata.bill_list) {
          newdata.bill_list = _thisdata.newdata.bill_list.concat(newdata.bill_list);
        }
        if (!newdata.bill_list || !newdata.bill_list.length) {
          newdata.empty_list = 'YES';
        } else {
          newdata.empty_list = 'NO';
        }
        _this.setData({newdata});
      }
    },
    complete: function () {
      _this.setData({ hideLoading: true });
      loading_more = false;
    }
  });
};
Page({

  /**
   * 页面的初始数据
   */
  data: {
    img_url: config.BASE_URL
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var _this = this;
    this.setData(options);
    current_page = 1;
    this.setData({
      current_page: current_page ? current_page:1
    })
    util.checkMember.call(this, function () {
      load_list.call(_this, current_page);
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: '对账单',
    })
  },
  evt_scrolltolower:function(){
    console.log(this.data)
    if (loading_more || this.data.newdata.pager.total == this.data.newdata.pager.current) {
      return;
    }
    current_page += 1;
    load_list.call(this, current_page);
  }
})