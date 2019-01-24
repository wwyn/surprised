const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
const app = getApp();

Page({
    data:{
        mobile_ipt:'',
        vcode_percent:0
    },
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '绑定手机'
        });
    },
    onLoad: function(options) {
        var _this = this;
        _this.setData({
          themecolor:app.globalData.themecolor
        })
        util.checkMember.call(this,function(){
            _this.setData({
                hideLoading:true
            });
        });
    },
    evt_getphonenumber:function(e){
        var _this = this;
        var res = e.detail;
        if(!res.iv || !res.encryptedData){
            return;
        }
        var wx_session_key = this.data.member.wx_session_key;
        if(!wx_session_key){
            return;
        }
        wx.showToast({
            icon:'loading',
            title:'正在绑定',
            mask:true,
            duration:50000
        });
        util.wxRequest({
            url: config.BASE_URL + '/openapi/toauth/callback/wechat_toauth_wxapppam/bind_mobile',
            method:'POST',
            data:{
                session_key:wx_session_key,
                iv:res.iv,
                encryptedData:res.encryptedData
            },
            success: function(res) {
                var resdata = res.data;
                if(resdata.result == 'error'){
                    wx.showModal({
                        title:'绑定失败',
                        content:resdata.data
                    });
                }
                if(resdata.result == 'success'){
                    wx.showModal({
                        title:'绑定成功',
                        content:'已成功绑定手机:'+resdata.data.purePhoneNumber,
                        showCancel:false,
                        success:function(res){
                            app.globalData.member.exist_login_type &&
                            app.globalData.member.exist_login_type.push &&
                            app.globalData.member.exist_login_type.push('mobile');
                            wx.navigateBack();
                        }
                    });
                }
            },
            complete: function() {
                wx.hideToast();
            }
        });
    },
    evt_mobileipt:function(e){
        this.setData({
            mobile_ipt:e.detail.value
        });
    },
    evt_getcode: function(e) {
        var _this = this;
        if(_this.data.vcode_percent>0){
            return;
        }
        util.wxRequest({
            url: config.BASE_URL + '/m/passport-send_vcode_sms.html',
            method:'POST',
            data:{
                mobile:_this.data.mobile_ipt
            },
            success: function(res) {
                let resdata = res.data;
                if(resdata.success){
                    wx.showToast({
                        icon:'success',
                        title:'发送成功',
                        success:function(){
                            _this.setData({
                                vcode_percent:1
                            });
                            if(_this.vcode_percent_timer){
                                clearInterval(_this.vcode_percent_timer)
                            }
                            var iv = 1;
                            _this.vcode_percent_timer = setInterval(function(){
                                if(_this.data.vcode_percent>100){
                                    _this.setData({
                                        vcode_percent:0
                                    });
                                    return clearInterval(_this.vcode_percent_timer);
                                }
                                _this.setData({
                                    vcode_percent:Math.round(iv/60 * 100)
                                });
                                iv++;
                            },1000);
                        }
                    });
                }else{
                    wx.showModal({
                        title:'获取验证码失败',
                        content:(resdata.error||''),
                        showCancel:false
                    });
                }
            },
            complete: function() {

            }
        });
    },
    evt_submit: function(e) {
        util.wxRequest({
            url: config.BASE_URL + '/m/my-set_pam_mobile-save.html',
            method:'POST',
            data:e.detail.value,
            success: function(res) {
                let resdata = res.data;
                if(resdata.success){
                    app.globalData.member.exist_login_type &&
                    app.globalData.member.exist_login_type.push &&
                    app.globalData.member.exist_login_type.push('mobile');
                    wx.showToast({
                        icon:'success',
                        title:'绑定成功',
                        success:function(){
                            wx.navigateBack();
                        }
                    });
                }else{
                    wx.showModal({
                        title:'绑定失败',
                        content:(resdata.error||''),
                        showCancel:false
                    });
                }
            }
        });
    },
    evt_goback:function(e){
        wx.navigateBack();
    }
});
