// pages/login/login.js
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
// const app = getApp();
const timer = function () {
  var _this = this;
  if (_this.vcode_percent_timer) {
    clearInterval(_this.vcode_percent_timer)
  }
  _this.vcode_percent_timer = setInterval(function () {
    if (_this.data.vcode_percent <= 0) {
      _this.setData({
        vcode_percent: 0
      });
      return clearInterval(_this.vcode_percent_timer);
    }
    _this.setData({
      vcode_percent: _this.data.vcode_percent - 1
    });
  }, 1000);
}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    img_url: config.BASE_HOST,
    phone:'',
    vcode:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      this.setData(options);
      this.setData({
          hideLoading:true
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: '登录',
    })
  },
  clear_input: function (e) {
    let type = e.currentTarget.dataset.type;
    // console.log(type)
    if (type == 'phone') {
      this.setData({
        phone: ''
      })
    } else{
      this.setData({
        vcode: ''
      })
    }
  },
  evt_blur: function (e) {
    let type = e.currentTarget.dataset.type;
    if (type == 'phone') {
      this.setData({
        a1: true,
        b1:false
      })
    } else if (type == 'vcode'){
      this.setData({
        b1: true,
        a1:false
      })
    } 
  },
  evt_input: function (e) {
    let type = e.currentTarget.dataset.type;
    if (type == 'phone') {
      this.setData({
        phone: e.detail.value
      })
    } else {
      this.setData({
        vcode: e.detail.value
      })
    }
    this.setData({
      error: ''
    })
  },
  //获取验证码
  getVcode: function () {
    let _this = this;
    ///passport-send_vcode_sms.html
    if (this.data.phone == '')
      return;
    wx.showLoading({
      title: '获取中',
      mask: true
    })
    util.wxRequest({
      url: config.BASE_URL + '/m/passport-member_vcode.html',
      method: 'POST',
      data: {
        account: this.data.phone
      },
      success: function (res) {
        if (res.data.error) {
          _this.setData({
            error: res.data.error
          })
          return;
        }
        _this.setData({
          vcode_percent: 60
        });
        timer.call(_this);
      },
      complete: function () {
        wx.hideLoading();
        _this.setData({ hideLoading: true });
      }
    });
  },
  //登录
  evt_login: function () {
    let _this = this;
    wx.showLoading({
      title: '登录中',
      mask:true
    })
    util.wxRequest({
      url: config.BASE_URL + '/m/passport-post_login.html',
      method: 'POST',
      data: {
        'uname': _this.data.phone,
        'vcode': _this.data.vcode
      },
      success: function (res) {
        if (res.data.error) {
          _this.setData({
            error: res.data.error
          })
          return;
        }
        wx.setStorageSync('currentMemberId', res.data.data.member_id);
        if (_this.data.redirect) {
          var arr = JSON.parse(_this.data.redirectoptions);
          var query_str_arr = [];
          for (var k in arr) {
            if (arr[k] && arr[k] != '') {
              query_str_arr.push(k + "=" + arr[k]);
            }
          }
          if (_this.data.redirect == '/pages/index/index' || _this.data.redirect == '/pages/brand/brand' || _this.data.redirect == '/pages/cart/cart' || _this.data.redirect == '/pages/member/index'){
            wx.switchTab({
              url: _this.data.redirect
            })
          }else{
              wx.redirectTo({
                url: _this.data.redirect + '?' + query_str_arr.join('&')
              })
          }
          
        } else {
          wx.switchTab({
            url: '/pages/index/index',
          })
        }
      },
      complete: function () {
        _this.setData({ hideLoading: true });
        wx.hideLoading();
      }
    });
  }
})