// pages/register/agreement/index.js
const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
const app = getApp()
Page({
  onLoad: function (options) {
    var _this=this;
    util.wxRequest({
      url: config.BASE_URL + '/m/passport-signup.html',
      success: function (res) {
        _this.setData({
          registration_protocol: res.data.registration_protocol
        })
      },
      complete: function () {
        _this.setData({
          hideLoading:true
        })
      }
    });
  }
})