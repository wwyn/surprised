const config = require('../config/config.js');
const app = getApp();

function headers(header) {
    header = header || {};
    //小应用特殊头
    header['X-Requested-isWXAPP'] = 'YES';

    //session_id , vmc_uid 处理
    var session_id = wx.getStorageSync('_SID'),
            vmc_uid = wx.getStorageSync('_VMC_UID');
    var ownshop = wx.getStorageSync('own_shop');
    console.log(ownshop);
    if (config.IS_OCEAN){
      var presetprop = app.sensors.getPresetProperties();
      if (presetprop['$latest_utm_campaign']){
        header['latest-utm-campaign'] = presetprop['$latest_utm_campaign'];
      }
      if (presetprop['$latest_utm_content']) {
        header['latest-utm-content'] = presetprop['$latest_utm_content'];
      }
      if (presetprop['$latest_utm_medium']) {
        header['latest-utm-medium'] = presetprop['$latest_utm_medium'];
      }
      if (presetprop['$latest_utm_source']) {
        header['latest-utm-source'] = presetprop['$latest_utm_source'];
      }
      if (presetprop['$latest_utm_term']) {
        header['latest-utm-term'] = presetprop['$latest_utm_term'];
      }
    }
    // SID
    if (session_id)
        header['X-WxappStorage-SID'] = session_id;
    if (ownshop) {
      header['X-REQUESTED-HEADER-VSHOPID'] = ownshop;
    }
    // UID
    if (vmc_uid)
        header['X-WxappStorage-VMC-UID'] = vmc_uid;
    if (wx.getStorageSync('merchant_id')) {
      header['X-WxappStorage-MCH-ID'] = wx.getStorageSync('merchant_id');
    }
    if (config.RUN_ON_SAAS && wx.getExtConfig) {
        var ext_vars = wx.getExtConfigSync();
        // SAAS RUN TYPE
        header['x-requested-saas-mode'] = 'APP';
        header['x-requested-saas-app'] = ext_vars.host_pre;
        header['x-requested-saas-client'] = ext_vars.client_id;
        header['x-requested-saas-order'] = ext_vars.order_id;
    }
    if(app.globalData.shifan_sid){
      header['X-REQUESTED-HEADER-SHIFAN'] = app.globalData.shifan_sid;
      delete (app.globalData.shifan_sid);
    }
    console.log(header);
    return header;
}

function wxRequest(params) {
    if (!params.header) {
        params.header = {};
    }

    headers(params.header);

    //content-type
    params.header['content-type'] = params.header['content-type'] ? params.header['content-type'] : 'application/x-www-form-urlencoded';
    var always = function(res) {
        console.log('公共方法');
        console.log(res.data.member_id);
        if (res.data&&res.data.member_id){
            wx.setStorageSync('currentMemberId', res.data.member_id);
        }
        var x_wxappstorage = res.header['X-WXAPPSTORAGE']?res.header['X-WXAPPSTORAGE']:false;
        if (x_wxappstorage) {
            var arr = x_wxappstorage.split(';');
            for (var i = 0; i < arr.length; i++) {
                var kv = arr[i].split('=');
                if (kv[0] && kv[1]) {
                    wx.setStorageSync(kv[0], kv[1]);
                } else if (kv[0]) {
                    wx.removeStorageSync(kv[0]);
                }
            }
        }
        if (res.data && res.data.error) {
            var res_error = res.data.error;
            var res_redirect = res.data.redirect;
            if (res_redirect && res_redirect.match && res_redirect.match(/passport-login/i)) {
                //服务端登录状态丢失,重新登录
                delete(app.globalData.member);
                // return checkMember(function() {
                //     wx.showModal({
                //         title: '已刷新用户登录状态',
                //         content: '请重新进入',
                //         showCancel: false,
                //         success: function(res) {
                //             wx.navigateBack();
                //         }
                //     });
                // });
              var pages = getCurrentPages(); //获取加载的页面
              var currentPage = pages[pages.length - 1]; //获取当前页面的对象
              var url = currentPage.route; //当前页面url
              var options = currentPage.options;

              if (url == 'pages/login/login') return;
              console.log('/pages/login/login?redirect=/' + url + '&redirectoptions=' + JSON.stringify(options));
              wx.redirectTo({
                url: '/pages/login/login?redirect=/' + url + '&redirectoptions=' + JSON.stringify(options)
              })
            }
        }
    };
    if (params.success) {
        var _tmp = params.success;
        params.success = null;
        params.success = function(res) {
            always(res);
            _tmp(res);
        };
    } else {
        params.success = function(res) {
            always(res);
        };
    }
    wx.request(params);
}

function wxUpload(params) {
    if (!params.header) {
        params.header = {};
    }

    headers(params.header);
    //content-type
    params.header['content-type'] = 'multipart/form-data';

    wx.uploadFile(params);
}
const checkMemberHook = function(page_ins, page_callback_fn) {
    let the_member = app.globalData.member;
    try {
        page_ins.setData({
            'member': the_member,
        });
    } catch (e) {
        //TODO
    }
    typeof page_callback_fn == 'function' && page_callback_fn(the_member);
}
function checkMember(callback, is_retry) {
  typeof callback == 'function' && callback();
}
function checkMem(callback, is_retry) {
  console.log('checkMem');
    var _this = this;
    clearTimeout(app.getMemberTimer);
    app.getMemberTimer = setTimeout(function(){
        console.log('begin getMember at '+new Date());
        app.getMember(function(member) {
            if (member.member_id) {
                return checkMemberHook(_this, callback);
            }
            wxRequest({
                url: config.BASE_URL + '/openapi/toauth/callback/wechat_toauth_wxapppam/callinfo',
                method: 'POST',
                data: member,
                success: function(res) {
                    if (!res.data.result || res.data.result != 'success') {
                        console.info('oauth server callback res error:');
                        console.info(res);
                        wx.showModal({
                            title: '授权失败',
                            content: res.data.data || '',
                            showCancel: (!is_retry),
                            confirmText: (!is_retry ? '重试' : '确定'),
                            success: function(res) {
                                if (!is_retry && res.confirm) {
                                    checkMember.apply(_this, [callback, true]);
                                }
                            }
                        });
                    } else {
                        // app.globalData.member.member_id = res.data.data.member_id;
                        // app.globalData.member.openid = res.data.data.openid;
                        //埋点-身份信息缓存
                        wx.setStorageSync('ocean_member', res.data.data);
                        //app.sensors.login(res.data.data.member_id);
                        Object.assign(app.globalData.member, res.data.data);
                        checkMemberHook(_this, callback);
                    }
                },
                complete: function() {

                }
            });

        });
    },0);
}

function getRegionData(step = [0, 0], callback) {
    if (app.globalData.region_data) {
        var region_data = app.globalData.region_data;
        var return_data = false;
        if (step[0] < 1) {
            return_data = region_data[0];
        } else {
            return_data = region_data[step[0]][step[1]];
        }
        typeof callback == 'function' && callback(return_data);
    } else {

        var url = config.BASE_HOST + '/data/misc/region_data.js?';
        if (config.RUN_ON_SAAS && wx.getExtConfig) {
            url = config.BASE_HOST + '/__SAAS/__APPS/' + wx.getExtConfigSync().app_type + '/' + wx.getExtConfigSync().app_year + '/' + wx.getExtConfigSync().app_sec + '/data/misc/region_data.js?';
        }

        url += new Date().getTime();

        wxRequest({
            url: url,
            success: function(res) {
                try {
                    var region_data = app.globalData.region_data = JSON.parse(res.data.slice(16, -1));
                } catch (e) {

                }
                if (step[0] < 1) {
                    return_data = region_data[0];
                } else {
                    return_data = region_data[step[0]][step[1]];
                }
                typeof callback == 'function' && callback(return_data);
            }
        });
    }
}

function formatArea(area_str = '') {
    var match = area_str.match(/mainland:([^:]+)/);
    if (match) {
        return match[1].split('/').join('-');
    }
}


function sendMsg(options, callback) {
    var action_url = config.BASE_URL + '/openapi/wechat/xcxtplmsg';
    if(options.action_url) action_url = options.action_url;

    var header = headers();
    // content-type
    header['content-type'] = 'application/x-www-form-urlencoded';

    console.log('sendMsgData', options);

    wx.request({
        url: action_url,
        method: 'POST',
        data: options,
        header: header,
        success: function (res) {
            console.info('sendMsg RES:');
            console.info(res);
            (typeof callback == 'function') && callback(res.data);
        }
    });
}

function fix_img_url(url) {
    if (url.match(/^http([s]*):/)) {
        return url;
    }
    return 'https:' + url;
}

function loadImage(page_ins, ident, size) {
    size || (size = 'o');
    if (['o', 'xs', 's', 'm', 'l'].indexOf(size) < 0) {
        size = 'o';
    }
    if (!page_ins || !ident) {
        return;
    }
    if (page_ins.data.images && page_ins.data.images[ident]) {
        return;
    }
    if (!page_ins.image_ids) {
        page_ins.image_ids = {};
    }
    if (!page_ins.image_ids[size]) {
        page_ins.image_ids[size] = []
    }
    if (!page_ins.load_image_timer) {
        page_ins.load_image_timer = {};
    }
    if (page_ins.load_image_timer[size] == 'undefined') {
        page_ins.load_image_timer[size] = 0;
    }
    page_ins.image_ids[size].push(ident);
    clearTimeout(page_ins.load_image_timer[size]);
    page_ins.load_image_timer[size] = setTimeout(function() {
        wxRequest({
            url: config.BASE_URL + '/openapi/storager/' + size,
            method: 'POST',
            data: {
                'images': page_ins.image_ids[size]
            },
            success: function(res) {
                let image_src_data = res.data.data;
                let _set = {};
                for (let i = 0; i < image_src_data.length; i++) {
                    _set['images.' + page_ins.image_ids[size][i]] = fix_img_url(image_src_data[i]);
                }
                page_ins.setData(_set);
            }
        });
    }, 200);
}

function getImg(ident, size, callback) {
    size || (size = 'l');
    if (['o', 'xs', 's', 'm', 'l'].indexOf(size) < 0) {
        size = 'l';
    }
    wxRequest({
        url: config.BASE_URL + '/openapi/storager/' + size,
        method: 'POST',
        data: {
            'images': ident
        },
        success: function(res) {
            if (res && res.data.result == 'success' && res.data && res.data.data && callback) {
                var imgs = [];
                for (var i in res.data.data) {
                    imgs.push(fix_img_url(res.data.data[i]));
                }
                callback(imgs);
            }
        }
    });
}
//倒计时
function count_down(that, intDiff) {
    function cd() {
        var day = 0,
            hour = 0,
            minute = 0,
            second = 0; //时间默认值
        if (intDiff > 0) {
            day = Math.floor(intDiff / (60 * 60 * 24)).toString();
            hour = (Math.floor(intDiff / (60 * 60)) - (day * 24)).toString();
            minute = (Math.floor(intDiff / 60) - (day * 24 * 60) - (hour * 60)).toString();
            second = (Math.floor(intDiff) - (day * 24 * 60 * 60) - (hour * 60 * 60) - (minute * 60)).toString();
        }
        if (day <= 9)
            day = '0' + day;
        if (hour <= 9)
            hour = '0' + hour;
        if (minute <= 9)
            minute = '0' + minute;
        if (second <= 9)
            second = '0' + second;
        if (day == 0 && hour == 0 && minute == 0 && second == 0) {
            clearInterval(cd);
        }
        that.setData({
            countdown: {
                days: day,
                hours: hour,
                minutes: minute,
                seconds: second,
            }
        });
        intDiff -= 1;
    }
    setInterval(cd, 1000)
};

function getqrcode(params, callback = function() {}) {
    if (!params.header) {
        params.header = {};
    }
    var header = headers(params.header);
    delete(params.header);
    console.log(params);
    // 生成二维码统一加入商户Id
    if (params.path){
      params.path = merchantShare(params.path);
    }
    console.log(params);
    wx.request({
        url: config.BASE_URL + '/openapi/wechat/xcxqrcode',
        method: 'POST',
        header: header,
        data: params,
        success: function(res) {
            console.info(res);
            res.data.data['qrcode_image_url'] = fix_img_url(res.data.data['qrcode_image_url']);
            callback(res.data.data);
        }
    });
}

function scene_parse(scene) {
    if (scene) {
        try {
            var scene_obj = JSON.parse(decodeURIComponent(scene));
        } catch (e) {
            return false;
        }
        if (typeof scene_obj == 'object') {
            return scene_obj;
        }
        return false;
    }
    return false;
}

/*获取当前页带参数的url*/
function getCurrentPageUrlWithArgs() {
    var pages = getCurrentPages() //获取加载的页面
    var currentPage = pages[pages.length - 1] //获取当前页面的对象
    var url = currentPage.route //当前页面url
    var options = currentPage.options //如果要获取url中所带的参数可以查看options

    //拼接url的参数
    var urlWithArgs = url + '?'
    for (var key in options) {
        var value = options[key]
        urlWithArgs += key + '=' + value + '&'
    }
    urlWithArgs = urlWithArgs.substring(0, urlWithArgs.length - 1)

    return urlWithArgs
}

function gotoIndex() {
    wx.switchTab({
        url: "/pages/index/index"
    });
}
function merchantShare(url){
    let merchant_id;
    if(wx.getStorageSync('merchant_id')){
        merchant_id = wx.getStorageSync('merchant_id');
    }else{
        merchant_id = 0;
    }
    if (url.indexOf("?") != -1){
      url += '&merchant_id=' + merchant_id
    }else{
      url += '?merchant_id=' + merchant_id
    }
    return url;
}
function getQuery(url, query) {
  if (url.indexOf('?')<0)
  return;
  var arr = url.split('?');
  var query_arr = arr[1].split('&');
  for (var i = 0; i < query_arr.length;i++){
      let single_arr = query_arr[i].split('=');
      console.log('single_arr', single_arr);
      if (!single_arr[1])continue;
      query[single_arr[0]] = single_arr[1];
  }
  return query;
}
module.exports = {
    headers: headers,
    wxRequest: wxRequest,
    wxUpload: wxUpload,
    checkMember: checkMember,
    checkMem: checkMem,
    getRegionData: getRegionData,
    formatArea: formatArea,
    sendMsg: sendMsg,
    fixImgUrl: fix_img_url,
    loadImage: loadImage,
    countdown: count_down,
    getqrcode: getqrcode,
    getImg: getImg,
    sceneParse: scene_parse,
    getCurrentPageUrlWithArgs: getCurrentPageUrlWithArgs,
    gotoIndex: gotoIndex,
    merchantShare: merchantShare,
    getQuery: getQuery
}
