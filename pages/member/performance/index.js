// pages/member/performance/index.js
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
    method:"POST",
    url: config.BASE_URL + '/m/my-sells' + ('-' + _this.data.performance_type) + '-' + page + '.html',
    data:{
      from_time: _this.data.filter_data.from+" 00:00:00",
      to_time: _this.data.filter_data.to+" 23:59:59"
    },
    success: function (res) {
      var newdata = res.data;
      var _thisdata = _this.data;
      if (newdata) {
        if ( page > 1 && _thisdata.newdata.order_list) {
          newdata.order_list = _thisdata.newdata.order_list.concat(newdata.order_list);
        }
        if (!newdata.order_list || !newdata.order_list.length) {
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
    img_url: config.BASE_URL,
    hideLoading:true,
    performance_type:"today"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var _this=this;
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          sv_height: res.windowHeight,
        });
      }
    });
    var date = new Date();
    var curr_date = date.getFullYear() + "-" + ((date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + "-" + (date.getDate()>9?date.getDate():'0'+date.getDate());
    console.log((date.getDate() > 9 ? date.getDate() : '0' + date.getDate())-1)
    var b2 = date.getFullYear() + "-" + (((date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + "-" + ((date.getDate() - 6) > 9 ? (date.getDate() - 6) : '0' + (date.getDate() - 6)));
    var b1 = date.getFullYear() + "-" + ((date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + "-01";
    this.setData({
      performance_type: options.performance_type ? options.performance_type : "today",
      // filter_data['from']: filter_data['from'] ? filter_data['from'] : se_start,
      'filter_data.from': curr_date,
      se_end: curr_date,
      curr_date: curr_date
    });
    if (_this.data.performance_type == "today") {
      _this.setData({
        'filter_data.from': _this.data.se_end,
        'filter_data.to': _this.data.se_end
      });
    } else if (_this.data.performance_type == "week") {
      console.log("sdasd")
      _this.setData({
        'filter_data.from': b2,
        'filter_data.to': _this.data.se_end
      });
    } else {
      _this.setData({
        'filter_data.from': b1,
        'filter_data.to': _this.data.se_end
      });
    }
    
    console.log(this.data)
    current_page = 1;
    util.checkMember.call(this, function () {
      load_list.call(_this);
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
   wx.setNavigationBarTitle({
     title: '销售业绩',
   })
  },
  evt_changefilter_from: function (e) {
    var _this=this;
    var date = new Date();
    var curr_date = date.getFullYear() + "-" + ((date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + "-" + (date.getDate() > 9 ? date.getDate() : '0' + date.getDate());
    var a1 = e.detail.value.substring(0, 4);//年份
    var a = e.detail.value.substring(8, 10);//哪一天
    var b = e.detail.value.substring(5, 7);//月份
    var c = a1 + "-" + b + "-" + (parseInt(a) + 6 > 9 ? parseInt(a) + 6 : '0' +(parseInt(a) + 6));
    if (a1 < date.getFullYear()){//不是今年的
      console.log(1)
      if (b == '01' || b == '03' || b == '05' || b == '07' || b == '08' || b == '10' || b =='12'){
        var c1 = a1 + "-" + b + "-31";
        var b1 = a1 + "-" + b + "-01";
      }else{
        console.log(12345)
        var c1 = a1 + "-" + b + "-30";
        var b1 = a1 + "-" + b + "-01";
      }
    } else if (b < (date.getMonth() + 1)){//不是这一月的
      console.log(2)
      if (b == '01' || b == '03' || b == '05' || b == '07' || b =='08'||b=='10'||b=='12'){
        var c1 = a1 + "-" + b + "-31";
        var b1 = a1 + "-" + b + "-01";
      } else {
        console.log(12345)
        var c1 = a1 + "-" + b + "-30";
        var b1 = a1 + "-" + b + "-01";
      }
    }else{
      var b1 = a1 + "-" + b + "-01";
      var c1 = _this.data.se_end;
    }
    if(_this.data.performance_type=="today"){
      _this.setData({
        'filter_data.from': e.detail.value,
        'filter_data.to': e.detail.value
      });
    } else if(_this.data.performance_type == "week"){
      console.log("sdasd")
      _this.setData({
        'filter_data.from': e.detail.value,
        'filter_data.to': c
      });
    }else{
      _this.setData({
        'filter_data.from': b1,
        'filter_data.to':c1
      });
    }
    load_list.call(this)
  },
  evt_changefilter_to: function (e) {
    console.log(e)
    this.setData({
      'filter_data.to': e.detail.value
    });
    load_list.call(this)
    console.log(this.data)
  },
  load_image: function (e) {
    util.loadImage(this, e.currentTarget.dataset.ident, 'xs');
  },
  // 分页
  evt_scrolltolower: function (e) {
    console.log(this.data)
    if (loading_more || this.data.newdata.pager.total == this.data.newdata.pager.current) {
      return;
    }
    current_page += 1;
    load_list.call(this, current_page);
  }
})