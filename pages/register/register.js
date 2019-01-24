// pages/register/register.js
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const app = getApp();
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
    invite:'',
    phone:'',
    vcode:'',
    vcode_percent:0,
    invite_disable:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this=this;
    if(options.invitation_code){
      _this.setData({
        invite: options.invitation_code,
        invite_disable:true
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: '注册'
    })
  },
  //获取验证码
  getVcode:function(){
    let _this = this;
    ///passport-send_vcode_sms.html
    if (this.data.phone == '')
    return;
    wx.showLoading({
      title: '获取中',
      mask: true
    })
    util.wxRequest({
        url: config.BASE_URL + '/m/passport-send_vcode_sms.html',
        method:'POST',
        data:{
          mobile:this.data.phone
        },
        success: function (res) {
            if(res.data.error){
              _this.setData({
                error: res.data.error
              })
              return;
            }
            _this.setData({
              vcode_percent:60
            });
            timer.call(_this);
        },
        complete: function () {
          wx.hideLoading();
          _this.setData({ hideLoading: true });
        }
    });
  },
  //注册
  evt_register:function(){
      let _this = this;
      wx.showLoading({
        title: '注册中',
        mask: true
      })
      util.wxRequest({
        url: config.BASE_URL + '/m/passport-create.html',
        method: 'POST',
        data: {
          'pam_account[login_name]': _this.data.phone,
          'vcode': _this.data.vcode,
          'invitation_code':_this.data.invite
        },
        success: function (res) {
          if (res.data.error) {
            _this.setData({
              error: res.data.error
            })
            return;
          }
          wx.setStorageSync('currentMemberId', res.data.data.member_id);
          wx.switchTab({
            url: '/pages/index/index',
          })
        },
        complete: function () {
          wx.hideLoading();
          _this.setData({ hideLoading: true });
        }
      });
  },
  clear_input:function(e){
    let type = e.currentTarget.dataset.type;
    if (type == 'invite') {
      this.setData({
        invite: ''
      })
    } else if (type == 'phone') {
      this.setData({
        phone: ''
      })
    } else {
      this.setData({
        vcode: ''
      })
    }
  },
  evt_blur:function(e){
    let type = e.currentTarget.dataset.type;
    if (type == 'invite') {
      this.setData({
        a1: true,
        b1:false,
        c1:false
      })
    } else if (type == 'phone') {
      this.setData({
        a1: false,
        b1: true,
        c1: false
      })
    } else {
      this.setData({
        a1: false,
        b1: false,
        c1: true
      })
    }
  },
  evt_input:function(e){
      let type = e.currentTarget.dataset.type;
      if(type == 'invite'){
          this.setData({
            invite:e.detail.value
          })
      }else if (type == 'phone'){
          this.setData({
            phone: e.detail.value
          })
      }else{
          this.setData({
            vcode: e.detail.value
          })
      }
      this.setData({
        error: ''
      })
  }
})