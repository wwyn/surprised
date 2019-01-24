//app.js
const config = require('config/config.js');
//const util = require('utils/util.js');
//var sensors = require('utils/sensorsdata.js');
//埋点-所有页面浏览，记录一级标题
var oceanUrlTitle = {
  "pages/index/index": '首页',
  "pages/index/page/page": '可视化',
  "pages/scene/redirect": '二维码中转页',
  "pages/store": '体验店',
  "pages/category/category": '分类',
  "pages/gallery/gallery": '商品列表',
  "pages/product/product": '商品详情',
  "pages/digitalmarketing": '营销',
  "pages/product/comment": '评价列表',
  "pages/cart/cart": '购物车',
  "pages/member/index": '个人中心',
  "pages/member/signup": '绑定手机号',
  "pages/member/login": '微信登录',
  "pages/member/setting": '个人设置',
  "pages/member/order": '我的订单',
  "pages/member/comment": '订单评价',
  "pages/member/addr": '收货地址',
  "pages/member/integral": '我的积分',
  "pages/member/favorite": '我的收藏',
  "pages/member/coupons": '我的优惠券',
  "pages/member/integralexchange": '积分兑换',
  "pages/member/logistics": '物流追踪',
  "pages/member/aftersales": '售后',
  "pages/ubalance": '余额宝',
  "pages/quickpay": '快捷支付',
  "pages/checkout/checkout": '结算',
  "pages/order": '订单支付',
  "pages/article": '文章',
  "pages/vshop": '微店',
  "pages/groupbooking": '拼团',
  "pages/member/gborder": '我的团单',
  "pages/preselling": '预售',
  "pages/member/presellingorder": '我的预售',
  "pages/couponactivity": '领券活动',
  "pages/integralmall": '积分商城',
  "pages/community": '社区',
  "pages/oshop": '分销',
  "pages/limitimepurchase/index": '限时购',
  "pages/giftcard": '礼品卡',
  "pages/fastbuy/fastbuy": '快速购买',
  "pages/qrcodes/trace": '正品验证',
  "pages/vip/index": '会员购买'
}
const getQuery = function (url, query) {
  if(url.indexOf('?') < 0)
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

const getCurrentPage = function() {
    let pages = getCurrentPages() //获取加载的页面
    console.info(pages);
    let currentPage = pages[pages.length - 1] //获取当前页面的对象
    let url = currentPage.route //当前页面url
    let options = currentPage.options //如果要获取url中所带的参数可以查看options

    //拼接url的参数
    let urlWithArgs = url + '?'
    for (let key in options) {
        let value = options[key]
        urlWithArgs += key + '=' + value + '&'
    }
    urlWithArgs = urlWithArgs.substring(0, urlWithArgs.length - 1)

    return {
            'current_page_url':urlWithArgs,
            'pages_length':pages.length
    };
}
App({
  onLaunch: function (options) {
    console.log('查看参数');
    console.log(options);
    if (options&&options.referrerInfo && options.referrerInfo.extraData){
      this.globalData.shifan_sid = options.referrerInfo.extraData.sid;
    }
    var _this = this;
    let defaulttheme = '';
    let themelist = {};
    if (config.IS_OCEAN) {
      this.getOpenid();
      //埋点-页面浏览
      sensors.para.autoTrack['pageShow'] = function () {
        let pages = getCurrentPages() //获取加载的页面
        let currentPage = pages[pages.length - 1] //获取当前页面的对
        console.log('页面浏览');
        let data = currentPage.data;
        let params = {};
        _this.getOceanMemeber(params);
        let current_url = getCurrentPages()[getCurrentPages().length - 1].route;
        let current_arr = current_url.split('/');
        let third_url = current_arr[0] + '/' + current_arr[1] + '/' + current_arr[2];
        let second_url = current_arr[0] + '/' + current_arr[1];
        if (oceanUrlTitle[third_url] || oceanUrlTitle[second_url]) {
          params['PageTitle'] = oceanUrlTitle[third_url] ? oceanUrlTitle[third_url] : oceanUrlTitle[second_url];
        }
        let last_page = getCurrentPages()[getCurrentPages().length - 2] ? getCurrentPages()[getCurrentPages().length - 2].route : getCurrentPages()[getCurrentPages().length - 1].route;
        params['HTTP_REFERER'] = last_page;
        params['CURRENT'] = current_url;
        console.log(params);
        return params;
      }
    }
    if (config.RUN_ON_SAAS && wx.getExtConfig) {
      var header = {};
      var ext_vars = wx.getExtConfigSync();
      //小应用特殊头
      header['X-Requested-isWXAPP'] = 'YES';
      //header['content-type'] = 'application/json';
      header['content-type'] = 'application/x-www-form-urlencoded';
      header['x-requested-saas-mode'] = 'APP';
      header['x-requested-saas-app'] = ext_vars.host_pre;
      header['x-requested-saas-client'] = ext_vars.client_id;
      header['x-requested-saas-order'] = ext_vars.order_id;
      wx.getExtConfig({
        success: function (res) {
          if (res.extConfig.themes) {
            themelist = res.extConfig.themes.schemes;
            defaulttheme = res.extConfig.themes.default;
            var arr = [];
            for (var key in themelist) {
              arr.push(key);
            }
            if (arr.length == 0) {
              return false;
            }
            wx.request({
              url: config.BASE_URL + '/openapi/xcxpage/oninit',
              header: header,
              success: function (res) {
                if (res.data.data && res.data.data.theme_color) {
                  if (themelist[res.data.data.theme_color]) {
                    _this.globalData.themecolor = themelist[res.data.data.theme_color].color_addon.themecolor;
                  } else if (themelist[defaulttheme]) {
                    _this.globalData.themecolor = themelist[defaulttheme].color_addon.themecolor;
                  } else {
                    var arr = [];
                    for (var key in themelist) {
                      arr.push(key);
                    }
                    _this.globalData.themecolor = themelist[arr[0]].color_addon.themecolor;
                  }
                } else {
                  if (themelist[defaulttheme]) {
                    _this.globalData.themecolor = themelist[defaulttheme].color_addon.themecolor;
                  } else {
                    var arr = [];
                    for (var key in themelist) {
                      arr.push(key);
                    }
                    _this.globalData.themecolor = themelist[arr[0]].color_addon.themecolor;
                  }
                }
              },
              fail: function (res) {
                if (themelist[defaulttheme]) {
                  _this.globalData.themecolor = themelist[defaulttheme].color_addon.themecolor;
                } else {
                  var arr = [];
                  for (var key in themelist) {
                    arr.push(key);
                  }
                  _this.globalData.themecolor = themelist[arr[0]].color_addon.themecolor;
                }
              }
            });
          }
          wx.request({
            url: config.BASE_URL + '/openapi/open_app/wx_templates',
            header: header,
            success: function (res) {
              _this.globalData.msg_templates = res.data.data;
            }
          });
        }
      })
    }
        try{
            var query = options.query;
            if (query && query._vshop_id) {
                //微店id 记录
                /**
                 * @see /pages/checkout/checkout.js line 105
                 */
                wx.setStorageSync('_vshop_id', query._vshop_id);
            }
            console.log('options解析前');
            console.log(query);
            if (options.query && query.q) getQuery(decodeURIComponent(query.q), query);
            console.log('options解析后');
            console.log(options);
            // 商户id
            if (query && query.merchant_id){
              if (query.merchant_id!=0){
                wx.setStorageSync('merchant_id', query.merchant_id);
              }else{
                wx.removeStorageSync('merchant_id');
              }
            }
        }catch(e){
            console.log(e);
        }
    //this.onError('test error');
  },
  onShow: function (options) {
    console.log('查看参数');
    console.log(options);
    if (options&&options.referrerInfo && options.referrerInfo.extraData) {
      this.globalData.shifan_sid = options.referrerInfo.extraData.sid;
    }
    //TODO
    console.info('app Show');
    try {
      var query = options.query;
      console.log('options解析前');
      console.log(query);
      if (options.query && query.q) getQuery(decodeURIComponent(query.q), query);
      console.log('options解析后');
      console.log(options);
      // 商户id
      if (query && query.merchant_id) {
        if (query.merchant_id != 0) {
          wx.setStorageSync('merchant_id', query.merchant_id);
        } else {
          wx.removeStorageSync('merchant_id');
        }
      }
    } catch (e) {
      console.log(e);
    }
    wx.getNetworkType({
      success: function (re) {
        if (re.networkType == 'none') {
          wx.navigateTo({
            url: '/pages/common/noconnect'
          });
        }
      },
      fail: function () {
        wx.navigateTo({
          url: '/pages/common/noconnect'
        });
      }
    });
    if (wx.onNetworkStatusChange) {
      wx.onNetworkStatusChange(function (is_connected, networkType) {
        if (!is_connected) {
          wx.navigateTo({
            url: '/pages/common/noconnect'
          });
        }
      });
    }
  },
  onHide: function () {
    //TODO
    console.info('app Hide');
  },
  onError: function (msg) {
    //记录错误日志到服务器端
    var system_info = wx.getSystemInfoSync();
    wx.getNetworkType({
      success: function (res) {
        var header = {};
        //小应用特殊头
        header['X-Requested-isWXAPP'] = 'YES';

        //session_id , vmc_uid 处理
        var session_id = wx.getStorageSync('_SID'),
          vmc_uid = wx.getStorageSync('_VMC_UID');
        // SID
        if (session_id)
          header['X-WxappStorage-SID'] = session_id;

        // UID
        if (vmc_uid)
          header['X-WxappStorage-VMC-UID'] = vmc_uid;

        if (config.RUN_ON_SAAS && wx.getExtConfig) {
          var ext_vars = wx.getExtConfigSync();
          // SAAS RUN TYPE
          header['x-requested-saas-mode'] = 'APP';
          header['x-requested-saas-app'] = ext_vars.host_pre;
          header['x-requested-saas-client'] = ext_vars.client_id;
          header['x-requested-saas-order'] = ext_vars.order_id;
        }
        //content-type
        header['content-type'] = 'application/x-www-form-urlencoded';
        wx.request({
          url: config.BASE_URL + '/openapi/wechat/xcxerrorlog',
          method: 'POST',
          header: header,
          data: {
            timestamp: parseInt(new Date().getTime() / 1000),
            //appid: config.APP_ID,
            network_type: res.networkType,
            system_model: system_info.model,
            system_systemver: system_info.system,
            system_platform: system_info.platform,
            //system_sdkver:system_info.SDKVersion,
            system_ver: system_info.version,
            //system_screen:(system_info.screenWidth+'*'+system_info.screenHeight),
            system_window: (system_info.windowWidth + '*' + system_info.windowHeight),
            system_pixel: system_info.pixelRatio,
            system_language: system_info.language,
            error_log: msg
          }
        });
      }
    });
  },
  setMember:function(data){
    var that = this;
    if(!data || typeof data !='object')return;
    if(!that.globalData.member){
        that.globalData.member = {};
    }
    for(let k in data){
        that.globalData.member[k] = data[k];
    }
  },
  getMember: function (cb, is_retry) {
    var that = this
    var _do_login = function () {
      wx.login({
        success: function (res) {
          console.info('login success:');
          var code = res.code;
          console.info(res);
          console.info('new auth code:' + code);
          if (code) {
            wx.getUserInfo({
              //小程序会弹出授权窗体
              success: function (res) {
                console.info('getUserInfo success:');
                console.info(res);
                that.globalData.member = res.userInfo;
                //that.globalData.member['rawData'] = res.rawData;
                that.globalData.member['signature'] = res.signature;
                that.globalData.member['encryptedData'] = res.encryptedData;
                that.globalData.member['iv'] = res.iv;
              },
              fail: function (res) {
                //用户拒绝
                console.info('getUserInfo fail:');
                console.info(res);
              },
              complete: function () {
                if (!that.globalData.member) {
                  that.globalData.member = {};
                }
                that.globalData.member['code'] = code;
                console.info('new auth code:' + code);
                typeof cb == "function" && cb(that.globalData.member)
              }
            });
          }
        },
        fail: function (res) {
          that.globalData.member = null;
          console.info('login fail:');
          console.info(res);
        }
      });
    };
    wx.checkSession({
      success: function () {
        if (that.globalData.member && that.globalData.member.member_id && that.globalData.member.openid) {
          console.info('globalData  cache:');
          console.info(that.globalData.member);
          typeof cb == "function" && cb(that.globalData.member);
        } else {
          //调用登录接口
          _do_login();
        }
      },
      fail: function () {
        _do_login();
      }
    });
  },
  //大数据埋点
  oceanWay: function (eventName, options, is_member) {
    if (!config.IS_OCEAN) return;
    let pages = getCurrentPages() //获取加载的页面
    let currentPage = pages[pages.length - 1] //获取当前页面的对
    //判断参数是否带有utm参数
    if (currentPage.options) {
      let props = currentPage.options;
      let utms = {};
      if (props['utm_campaign']) {
        utms['UTM_CAMPAIGN'] = props['utm_campaign']
      }
      if (props['utm_content']) {
        utms['UTM_CONTENT'] = props['utm_content']
      }
      if (props['utm_medium']) {
        utms['UTM_MEDIUM'] = props['utm_medium']
      }
      if (props['utm_source']) {
        utms['UTM_SOURCE'] = props['utm_source']
      }
      if (props['utm_term']) {
        utms['UTM_TERM'] = props['utm_term']
      }
      Object.assign(options, utms);
    }
    //是否需要member信息
    if (is_member) {
      this.getOceanMemeber(options);
    }
    let last_page = getCurrentPages()[getCurrentPages().length - 2] ? getCurrentPages()[getCurrentPages().length - 2].route : getCurrentPages()[getCurrentPages().length - 1].route;
    options['HTTP_REFERER'] = last_page;
    console.log(eventName + '~~~' + '埋点数据');
    console.log(options);
    sensors.track(eventName, options);
  },
  //埋点数据-身份信息
  getOceanMemeber: function (params) {
    //是否需要member信息
    let ocean_member = wx.getStorageSync('ocean_member');
    if (!ocean_member) {

    } else {
      let member = {
        MemberId: ocean_member.member_id,
        MemberUname: ocean_member.account,
        MemberOpenid: ocean_member.openid
      }
      Object.assign(params, member);
    }
    return params;
  },
  //埋点获取openid
  getOpenid: function () {
    wx.login({
      success: function (res) {
        var code = res.code;
        if (code) {
          var header = {};
          //小应用特殊头
          header['X-Requested-isWXAPP'] = 'YES';
          //header['content-type'] = 'application/json';
          header['content-type'] = 'application/x-www-form-urlencoded';
          wx.request({
            url: config.BASE_URL + '/openapi/toauth/callback/wechat_toauth_wxapppam/callinfo',
            header: header,
            data: {
              code: code
            },
            success: function (res) {
              console.log('获取到openid咯');
              sensors.setOpenid(res.data.data.openid);
              sensors.init();
            },
            fail: function () {
              console.log('没获取到openid咯');
              sensors.init();
            }
          })
        }
      },
      fail: function (res) {
        console.log('没获取到openid咯');
        sensors.init();
        console.info('login fail:');
        console.info(res);
      }
    })
  },
  globalData: {
    member: null,
    themecolor: {
      "text_primary": "#333333",
      "text_info": "#999999",
      "price_text": "#FC4773",
      "foot_bar_bg": "#efefef",
      "foot_bar_icon_text": "#999999",
      "popup_color": "#e64340",
      "buynow_color": "#e64340",
      "addcart_color": "#1aad19",
      "storerare_color": "#ec8b89",
      "buynow_text_color": "#ffffff",
      "addcart_text_color": "#ffffff",
      "storerare_text_color": "#ffffff",
      "buysingle_color": "#ffb800",
      "opengroup_color": "#f83d38",
      "ordercash_color": "#e64340",
      "buysingle_text_color": "#ffffff",
      "opengroup_text_color": "#ffffff",
      "ordercash_text_color": "#ffffff",
      "cart_checkouticon_color": "#FC4773",
      "cart_footbg_color": "#000000",
      "cart_foottext_color": "#ffffff",
      "cart_footprice_color": "#ff9900",
      "cart_checkout_color": "#e64340",
      "cart_checkouttext_color": "#ffffff",
      "form_submit_color": "#1aad19",
      "form_submittext_color": "#ffffff",
      "sure_submit_color": "#e64340",
      "sure_submittext_color": "#ffffff",
      "checkbox_checked_color": "#1aad19",
      "success_icon_color": "#1aad19",
      "success_btn_color": "#1aad19"
    },
    shifan_sid:'',
    msg_templates: {},
    timer:''
  }
});
