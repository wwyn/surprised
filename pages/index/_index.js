const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const widgetsObject = require('../../widgets/widgets.js');
var app = getApp();
// const uniqueArray = function(arr){
//     arr.sort();
//  var re=[arr[0]];
//  for(var i = 1; i < arr.length; i++)
//  {
//      if( arr[i] !== re[re.length-1])
//      {
//          re.push(arr[i]);
//      }
//  }
//  return re;
// };

const widgets_render = function (widgets_conf) {
    let _this = this;
    let widget_stream_data = [];
    let sysinfo = wx.getSystemInfoSync();
    let set = {};
    for (let i = 0; i < widgets_conf.length; i++) {
        let resdata = widgets_conf[i],
                widget_name = resdata['name'],
                widget_data = resdata['data'];
        if (widgetsObject[widget_name]) {
            if (widgetsObject[widget_name]['data']) {
                let default_data = Object.assign({}, widgetsObject[widget_name]['data']);
                widget_data = Object.assign(default_data, widget_data);
            }
            if (widgetsObject[widget_name]['event'] && typeof widgetsObject[widget_name]['event']['onLoad'] == 'function') {
                widgetsObject[widget_name]['event']['onLoad'].apply(_this, [widget_data, i]);
            }
        }
        widget_data['widget_index'] = i;
        widget_data['systeminfo'] = sysinfo;
        widget_data['themecolor'] = _this.data.themecolor;
        set[['widgets', widget_name, i].join('.')] = widget_data;
        widget_stream_data.push(widget_name);
    }
    _this.setData(set);
    _this.setData({
        "widgets_stream": widget_stream_data,
        //"widget_stream_unique":uniqueArray(widget_stream_data)
    });
}

var page_options = {
    data: {
        hideLoading: false,
        is_default_index: true,
    },
    onShow: function () {
      if (wx.getStorageSync('is_reload')=='true'){
        this.onLoad.call(this, this.data.options);
        wx.removeStorageSync('is_reload');
      }
    },
    onReady: function () {
        // wx.setNavigationBarTitle({
        //     title: config.DEFAULT_TITLE
        // });
    },
    onPullDownRefresh: function () {
        this.onLoad.call(this, this.data.options);
    },
    onShareAppMessage: function (res) {
      const ops = this.data.options;
      let url = getCurrentPages()[getCurrentPages().length - 1].route;
      console.log(url);
      // if (!ops.s && !ops._vshop_id) {
      //     url = url
      // }else if(!ops._vshop_id){
      //     url = url + '?s='+ops.s
      // }else if(!ops.s){
      //     url = url + '?_vshop_id='+ops._vshop_id
      // }else{
      //      url = url + '?_vshop_id='+ops._vshop_id + '&s=' +ops.s
      // }
      if (this.data.is_homepage == 'true' && this.data.vshop) {
        url = '/pages/index/index?_vshop_id=' + this.data.vshop.shop_id;
      } else if (this.data.is_homepage == 'true') {
        url = '/pages/index/index';
      } else if (this.data.sno && this.data.vshop) {
        url += '?s=' + this.data.sno + '&_vshop_id=' + this.data.vshop.shop_id;
      } else if (this.data.sno) {
        url += '?s=' + this.data.sno;
      }
      url = util.merchantShare(url);
      return {
        title: this.data.vshop ? this.data.vshop.name + '的店铺' : this.data.title,
        path: url
      }
    },
    onLoad: function (options) {
        if (options && options.merchant_id) {
          if (options.merchant_id != 0) {
            wx.setStorageSync('merchant_id', options.merchant_id);
          }
        }
        this.setData({
            "options": options
        });
        if (getCurrentPages()[getCurrentPages().length - 1].route == 'pages/tabs/tab1/tab1') {
            this.getTabParams1();
        }
        if (getCurrentPages()[getCurrentPages().length - 1].route == 'pages/tabs/tab2/tab2') {
            this.getTabParams2();
        }
        if (getCurrentPages()[getCurrentPages().length - 1].route == 'pages/tabs/tab3/tab3') {
            this.getTabParams3();
        }
        if (getCurrentPages()[getCurrentPages().length - 1].route == 'pages/tabs/tab4/tab4') {
            this.getTabParams4();
        }
        if (getCurrentPages()[getCurrentPages().length - 1].route == 'pages/tabs/tab5/tab5') {
            this.getTabParams5();
        }
        var _this = this;
        if (options && options._vshop_id) {
            wx.setStorageSync('_vshop_id',options._vshop_id)
        }
        //
        wx.getSystemInfo({
            success: function (res) {
                _this.setData({
                    systeminfo: res
                });
            }
        });
        let is_widgets_priview = false;
        let xcxpage_url = '/m/xcxpage.html';
        const vshop_id = wx.getStorageSync('_vshop_id');
        const merchant_id = wx.getStorageSync('merchant_id');
        // if (this.data.options && this.data.options.s) {
        //         xcxpage_url += '?s=' + this.data.options.s;
        // }
        if (!vshop_id) {
            // 无微店 id
            if (this.data.options && this.data.options.s) {
                    xcxpage_url += '?s=' + this.data.options.s;
            }
        }else{
            // 有微店 id
            if (this.data.options && this.data.options.s) {
                xcxpage_url += '?s=' + this.data.options.s+'&_vshop_id=' + vshop_id;
            }else{
                xcxpage_url += '?_vshop_id=' + vshop_id;
            }
        }
        if (merchant_id){
            if (xcxpage_url.indexOf('?') > -1){
                xcxpage_url += '&merchant_id=' + merchant_id;
            }else{
                xcxpage_url += '?merchant_id=' + merchant_id;
            }
            
        }
        try {
            is_widgets_priview = options.widgets_preview;
        } catch (e) {
        }
        util.wxRequest({
            url: config.BASE_URL + xcxpage_url,
            success: function (res) {
                _this.setData({
                    themecolor: app.globalData.themecolor
                });
                let pagedata = res.data;
                //如果是首页，进行浏览埋点
                if (getCurrentPages()[getCurrentPages().length - 1].route == 'pages/index/index') {
                  app.oceanWay('ViewHomePage', {
                    PageController: config.BASE_URL + xcxpage_url,
                    PageTitle: pagedata.title
                  }, true)
                }
                if (!pagedata.widgets) {
                    return false
                }
                _this.setData({
                    'sno': pagedata.sno,
                    'title': pagedata.title,
                    'bg_hex': pagedata.bg_hex,
                    'version': pagedata.version
                });
                if (pagedata.vshop && pagedata.vshop.shop_id){
                  wx.setStorageSync('own_shop', pagedata.vshop.shop_id)
                }else{
                  wx.removeStorageSync('own_shop');
                }
                wx.setNavigationBarTitle({
                    title: pagedata.vshop?pagedata.vshop.name+'的店铺':pagedata.title
                });
                if (wx.setNavigationBarColor) {
                    wx.setNavigationBarColor({
                        frontColor: (pagedata.bar_title_hex || '#000000'),
                        backgroundColor: (pagedata.bar_bg_hex || '#ffffff'),
                        animation: {
                            duration: (pagedata.bar_animation_duration || 400),
                            timingFunc: (pagedata.bar_animation_func || 'easeOut')
                        }
                    });
                }
                if (config.ENVIRONMENT == 'DEVELOPMENT') {
                    widgets_render.call(_this, require('../../widgets/test_case.js'));
                } else {
                    widgets_render.call(_this, pagedata[is_widgets_priview ? 'widgets_draft' : 'widgets']);
                }
            }, complete: function () {
                _this.setData({
                    hideLoading: true
                });
            }
        });
        //util.checkMember.call(this);
        wx.stopPullDownRefresh();
    },
    widget_event_delegate: function (e) {
        //挂件事件代理
        let widget_index = e.currentTarget.dataset.widgetIndex;
        let widget_name = e.currentTarget.dataset.widgetName;
        let event_key = 'event' + e.type.replace(/^\S/, function (s) {
            return s.toUpperCase();
        });
        let event_fn_name = e.currentTarget.dataset[event_key];
        if (event_fn_name && widgetsObject[widget_name] && typeof widgetsObject[widget_name]['event'][event_fn_name] == 'function') {
            widgetsObject[widget_name]['event'][event_fn_name].apply(this, [e, widget_index]);
        }
    }
};

module.exports = page_options;
