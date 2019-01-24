// pages/search/search.js
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const app = getApp();
Page({
  data: {
    BASE_HOST: config.BASE_HOST,
    searchHistory: [],
    themecolor: app.globalData.themecolor
  },
  onLoad: function (options) {
    const _this = this;
    // util.wxRequest({
    //     url:config.BASE_URL+'/m/list-search.html',
    //     method:'GET',
    //     success:function(res){
    //         _this.setData({
    //             hotSearch: res.data.hotgoods
    //         })
    //     }
    // })
  },
  onShow: function () {
    let _this = this;
    if (wx.getStorageSync('searchbrandHistory')) {
      _this.setData({
        searchHistory: wx.getStorageSync('searchbrandHistory')
      })
    }
  },
  evt_input: function (e, index) {
    let set = {};
    set['input_val'] = e.detail.value;
    this.setData(set);
  },
  evt_confirm: function (e, index) {
    let input_val = this.data.input_val;
    if (input_val != '' && input_val) {
      if (input_val.charCodeAt() != 32) {
        let searchArr = wx.getStorageSync('searchbrandHistory') ? wx.getStorageSync('searchbrandHistory') : [];
        let index = searchArr.indexOf(input_val);
        if (index >= 0) {
          searchArr.splice(index, 1);
        }
        searchArr.unshift(input_val);
        wx.setStorageSync('searchbrandHistory', searchArr);
      }
    }
    if (input_val == undefined) input_val = '';
    wx.reLaunch({
      url: '/pages/brand/brand?keyword=' + input_val
    });
  },
  clearInput: function () {
    this.setData({
      'input_val': ''
    });
  },
  evt_delete_history: function () {
    const _this = this;
    wx.showModal({
      title: '是否清空搜索记录?',
      showCancel: true,
      cancelText: '取消',
      confirmColor: _this.data.themecolor.price_text,
      success: function (re) {
        if (re.confirm) {
          if (wx.getStorageSync('searchbrandHistory')) {
            wx.removeStorageSync('searchbrandHistory');
            _this.setData({
              searchHistory: wx.getStorageSync('searchbrandHistory')
            })
          }
        }
      }
    })
  }
});