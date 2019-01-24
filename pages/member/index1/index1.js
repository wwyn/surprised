const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const app = getApp();
// const check_mobile_account = function() {
//     // saas 下 小程序appid 无权限问题
//     //if(config.RUN_ON_SAAS) return true;
//     //TODO 如果不需要手机号强制绑定情况
//     if (app.globalData.member.exist_login_type.indexOf('mobile') < 0) {
//         wx.navigateTo({
//             url: '/pages/member/signup/mobile'
//         });
//     }
// };

Page({
    data: {
        bannerImg: '',
        img_url: config.BASE_HOST,
        version: ''
    },
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '会员中心'
        });
    },
    onPullDownRefresh: function() {
        this.onLoad.call(this);
    },
    onShow: function() {
        this.debugmode_tap_count = 1;
        var _this = this;
        wx.getStorage({
            key: 'reload_member_info',
            success: function(res) {
                if (res.data == 'true') {
                    app.globalData.member = null; //清空会员数据缓存
                    _this.onLoad.call(this);
                    wx.removeStorage({
                        key: 'reload_member_info'
                    });
                }
            }
        });
    },
    onLoad: function(options) {
        this.setData({
            themecolor: app.globalData.themecolor
        })
        var _this = this;
        if (config.RUN_ON_SAAS && wx.getExtConfigSync) {
            var extConfig = wx.getExtConfigSync();
            if(extConfig){
                extConfig.my_banner && _this.setData({
                    bannerImg:extConfig.my_banner
                });
                extConfig.app_norm && _this.setData({
                    version:extConfig.app_norm
                });
            }
        }
        //wx.showNavigationBarLoading();
        util.checkMember.call(this, function() {
            util.wxRequest({
                url: config.BASE_URL + '/m/my.html',
                success: function(res) {
                    var pagedata = res.data;
                    if (_this.data.member && pagedata.member) {
                        for (var k in _this.data.member) {
                            pagedata.member[k] = _this.data.member[k];
                        }
                    }
                    _this.setData(pagedata);
                },
                complete: function() {
                    //wx.hideNavigationBarLoading();
                    wx.stopPullDownRefresh();
                    check_mobile_account();
                    _this.setData({
                        hideLoading: true
                    });
                }
            });

            if(_this.data.version == 'home'){
                //线下活动报名预约在会员中心首页展示
                util.wxRequest({
                    url: config.BASE_URL + '/m/customer-schedule_order.html',
                    success: function(res) {
                        //console.log(res);
                        _this.setData({sysinfo:wx.getSystemInfoSync()});
                        _this.setData(res.data);
                    },
                    fail: function(re) {
                        console.info(re);
                    },
                    complete: function() {
                        // _this.setData({
                        //   hideLoading: true
                        // })
                    }
                });
            }
        });

    },
    evt_goto: function(e) {
        wx.navigateTo({
            url: e.currentTarget.dataset.url
        });
    },
    load_image: function(e) {
        util.loadImage(this, e.currentTarget.dataset.ident, 'm');
    },
    evt_debugmode: function(e) {
        //隐藏调试模式开关.点击5次后触发
        console.info('debugmode_tap_count:' + this.debugmode_tap_count);
        if (this.debugmode_tap_count > 0) {
            if (this.debugmode_tap_count % 5 == 0) {
                wx.setEnableDebug({
                    enableDebug: !(this.debugmode_tap_count > 5)
                });
                console.info('setEnableDebug:' + (!(this.debugmode_tap_count > 5)));
            }
            if (this.debugmode_tap_count == 10) {
                return this.debugmode_tap_count = 1;
            }
        }
        this.debugmode_tap_count += 1;
    }
});
