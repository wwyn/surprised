// pages/brand/brand.js
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const app = getApp();
var current_page = 1;
var loading_more = false;
var load_list = function (page) {
  loading_more = true;
  var _this = this;
  var query_str_arr = [];
  wx.showNavigationBarLoading();
  page = page ? page : current_page;
  query_str_arr.push("page=" + page);
  var filter = _this.data.filter;
  var filtering_status = 'NO';
  for (var k in filter) {
    if (filter[k] && filter[k] != '' && k != 'page') {
      filtering_status = 'YES';
      query_str_arr.push(k + "=" + filter[k]);
      if (k == 'keyword') {
        _this.setData({
          input_val: decodeURIComponent(filter[k])
        });
      }
    }
  }
  _this.setData({
    'filtering': filtering_status,
    //'query_str':query_str_arr.join('&')
  });
  // wx.showLoading({
  //   title: '加载中',
  // })
  util.wxRequest({
    url: config.BASE_URL + '/m/merchant-mlist.html?' + query_str_arr.join('&'),
    success: function (res) {
      console.info(res);
      var newdata = res.data;
      var _thisdata = _this.data;
      if (newdata) {
        if (_thisdata.data_list && page > 1) {
          newdata.data_list = _thisdata.data_list.concat(newdata.data_list);
        }
        if (newdata.data_list) {

        }
        if (!newdata.data_list) {
          newdata.empty_list = 'YES';
        } else {
          console.info(1);
          newdata.empty_list = 'NO';
          // for (var i = 0; i < newdata.data_list.length; i++) {
          //     newdata.data_list[i]['image'] &&
          //         (newdata.data_list[i]['image'] = util.fixImgUrl(newdata.data_list[i]['image']));
          // }
        }
        // console.info(newdata);
        _this.setData(newdata);
      }
    },
    fail: function (re) {
      console.info(re);
    },
    complete: function (e) {
      wx.stopPullDownRefresh();
      wx.hideNavigationBarLoading();
      _this.setData({
        hideLoading: true
      });
      loading_more = false;
    }
  });
  current_page = page;
};
Page({

  /**
   * 页面的初始数据
   */
  data: {
      keyword:'',
      img_url:config.BASE_HOST
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      hideLoading: true,
      input_val:''
    })
    load_list.call(this,1);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },
  evt_link_search: function () {
    wx.navigateTo({
      url: '/pages/brandsearch/brandsearch',
    })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    load_list.call(this, current_page = 1);
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (loading_more || this.data.pager.total == this.data.pager.current) {
      return;
    }
    current_page += 1;
    load_list.call(this, current_page);
  },
  evt_input: function (e, index) {
    let set = {};
    set['input_val'] = e.detail.value;
    this.setData(set);
  },
  evt_confirm: function (e, index) {
    var filter = this.data.filter;
    if (!filter) {
      filter = {};
    }
    filter['keyword'] = this.data.input_val ? this.data.input_val : '';
    this.setData({
      'filter': filter
    });
    load_list.call(this, 1);
  },
  clearInput: function () {
    this.setData({
      input_val: ""
    });
    var filter = this.data.filter;
    if (!filter || filter['keyword'] == '') {
      return;
    }
    delete (filter['keyword']);
    this.setData({
      'filter': filter
    });
    load_list.call(this, 1);
  },
  //加载图片
  load_image: function (e) {
    util.loadImage(this, e.currentTarget.dataset.ident, 'l');
  }
})