const config = require('../config/config.js');
const util = require('../utils/util.js');
const dateFormat = require('../utils/dateformat.js');
const getGpsDistance = require('../utils/gpsdistance.js');

const format_gpsdistance = function (val) {
  let km = Math.round(val);
  return (km > 0 ? (val.toFixed(1) + 'km') : (Math.round(val * 1000) + ' m'));
}
const count_gpsdistance = function (widgetname,index, i) {
    var _this = this;
    
    var arr = _this.data.widgets[widgetname][index].items;
    if (widgetname == 'storelist') {
      arr = _this.data.widgets[widgetname][index].items;
    }
    wx.getLocation({
        success: function(res) {
          let set = {};
          if (widgetname=='activecard'){
            let gpsdistance = getGpsDistance(res.latitude,
            res.longitude, arr[i].store.lat, arr[i].store.lng);
            arr[i].store.gpsdistance = format_gpsdistance(gpsdistance);
            set['widgets.activecard.' + index + '.items'] = arr;
            _this.setData(set);
          } else if (widgetname == 'storelist'){
            let gpsdistance = getGpsDistance(res.latitude,
            res.longitude, arr[i].lat, arr[i].lng);
            arr[i].gpsdistance = format_gpsdistance(gpsdistance);
            arr[i].distance = gpsdistance;
            set['widgets.storelist.' + index + '.items'] = arr;
            if(i==(arr.length-1)){
              for (var k = 0; k < arr.length - 1; k++) {
                for (var j = k + 1; j < arr.length; j++) {
                  if (arr[k].distance > arr[j].distance) {
                    var temp = arr[k];
                    arr[k] = arr[j];
                    arr[j] = temp;
                  }
                }
              }
              if (_this.data.widgets[widgetname][index].limit) {
                set['widgets.storelist.' + index + '.items'] = arr.slice(0, Number(_this.data.widgets[widgetname][index].limit));
              } else {
                set['widgets.storelist.' + index + '.items'] = arr;
              }
              _this.setData(set);
            }
          }
         
        },
        fail: function(res) {
            console.log(res);
            let set = {};
            if (widgetname == 'storelist'){
              if (_this.data.widgets[widgetname][index].limit) {
                set['widgets.storelist.' + index + '.items'] = arr.slice(0, Number(_this.data.widgets[widgetname][index].limit));
              } else {
                set['widgets.storelist.' + index + '.items'] = arr.slice(0,15);
              }
              _this.setData(set);
            }
        }
    });
}

var format_region_data = function(region_data) {
    if (!region_data || region_data.length < 1) {
        return [];
    }
    var _return = [];
    for (var i = 0; i < region_data.length; i++) {
        var rd = region_data[i],
            rd = rd.split(':');
        _return.push({
            'text': rd[0],
            'value': rd[1],
            'c_idx': rd[2]
        });
    }
    return _return;
}

var init_region = function(path = [0, 0, 0]) {
    var _this = this;

    util.getRegionData([1, path[0]], function(data) {
        let _data = format_region_data(data);
        _this.setData({
            'region_data.second': _data,
        });
        try {
            var child_index = _data[path[1]]['c_idx'];
        } catch (e) {
            child_index = _data[0]['c_idx'];
        }
        util.getRegionData([2, child_index], function(data) {
            _this.setData({
                'region_data.third': format_region_data(data),
            });
        });
    });
};


var get_region_val = function(index) {
    var region_val = 'mainland:',
        region_val_arr = [],
        rl = ['first', 'second', 'third'],
        region_data = this.data.region_data,
        selected_region = this.data.selected_region[index];
    //filter
    for (var i = 0; i < rl.length; i++) {
        if (region_data[rl[i]].length && region_data[rl[i]][selected_region[i]]) {
            region_val_arr.push(region_data[rl[i]][selected_region[i]]);
        }
    }
    for (var i = 0; i < region_val_arr.length; i++) {
        var loop = region_val_arr[i];
        if (i == region_val_arr.length - 1) {
            region_val += loop['text'] + ':' + loop['value'];
        } else {
            region_val += loop['text'] + '/';
        }
    }
    return region_val;
}

var set_region_val = function(val) {
    if (!val) return;
    var val = val.split(':'),
        text_path = val[1].split('/'),
        rl = ['first', 'second', 'third'],
        sr = [0, 0, 0];
    for (var i = 0; i < text_path.length; i++) {
        if (!rl[i]) {
            continue;
        }
        var lv = this.data.region_data[rl[i]];
        for (var j = 0; j < lv.length; j++) {
            if (lv[j].text == text_path[i]) {
                sr[i] = j;
                init_region.call(this, sr);
                break;
            }
        }
    };

    this.setData({
        "selected_region": sr
    });

}

module.exports = {
    /*商品搜索框*/
    searchbar: {
        'data': {
            "show_scan": true,
            "background": false,
            "fixed": false,
            "ipt_background": "#FFFFFF",
            "input_val": "",
            "placeholder": ""
        },
        'event': {
            evt_input: function(e, index) {
                let set = {};
                set['widgets.searchbar.' + index + '.input_val'] = e.detail.value;
                let timer = 0;
                var _this = this;
                _this.setData(set);

            },
            evt_confirm: function(e, index) {
                let input_val = this.data.widgets.searchbar[index].input_val;
                if (input_val != '') {
                    wx.navigateTo({
                        url: '/pages/gallery/gallery?keyword=' + input_val
                    });
                }
            },
            evt_clear: function(e, index) {
                let set = {};
                set['widgets.searchbar.' + index + '.input_val'] = '';
                this.setData(set);
            },
            evt_scan: function(e, index) {
                wx.scanCode({
                    success: function(res) {
                        if (!res.result) return;
                        wx.navigateTo({
                            url: '/pages/gallery/gallery?keyword=' + res.result
                        });
                    }
                });
            }
        }
    },
    /*图片轮播*/
    slider: {
        data: {
            "indicator_dots": true,
            "autoplay": true,
            "interval": 5000,
            "duration": 500,
            "circular": true,
            "height": 160
        },
        event: {
            onLoad: function(widget_data, index) {
                var sw = this.data.systeminfo.windowWidth,
                    iw = widget_data.items[0].image.width,
                    ih = widget_data.items[0].image.height;
                var ratio = sw / (iw / ih) - 10;
                var set = {};
                set['widgets.slider[' + index + '].swiperHeight'] = ratio;
                this.setData(set);
                //console.log(this.data.widgets.slider[1].swiperHeight)
            },
        }
    },
    /*图片导航*/
    imgnav: {
        data: {
            "limit": 4,
            // "img_height": 50,
            // "img_width": 50,
            "bottom_margin": 10,
            "show_text": true
        },
        event: {}
    },
    /*文本导航*/
    textnav: {
        data: {},
        event: {}
    },
    /*空白辅助*/
    blankhelper: {
        data: {
            "height": 10,
        },
        event: {}
    },
    /*线条*/
    linehelper: {
        data: {
            "line_color": "#E9E9E9",
            "padding": false,
            "type": 'solid'
        },
        event: {}
    },
    /*商品列表*/
    goodslist: {
        data: {
            "title": "商品列表",
            "show_title": false,
            "with_panel": true,
            "type": "swiper",
            "card_style": false,
            "swiper_height": 150,
            "swiper_item_margin": 10,
            // "filter": false,
            // "orderby":false,
            "limit": 9,
            "show_product_title": true,
            "show_product_price": true
        },
        event: {
            onLoad: function(widget_data, index) {
                var _this = this;
                var api_data = '?page_index=1&' + 'page_size=' + (widget_data.limit || 9);
                var filterArray = [];
                if (widget_data.filter) {
                    if (!widget_data.filter_type) {
                        widget_data.filter_type = 'tag_name';
                    }
                    if (!widget_data.filter[widget_data.filter_type]) {
                        widget_data.filter_type = 'tag_name';
                        widget_data.filter[widget_data.filter_type] = '首页推荐';
                    }
                    if (widget_data.filter_type == 'tag_name') {
                        filterArray.push('filter[' + widget_data.filter_type + '][]=' + widget_data.filter[widget_data.filter_type]);
                    } else {
                        for (var i = 0; i < widget_data.filter[widget_data.filter_type].length; i++) {
                            filterArray.push('filter[' + widget_data.filter_type + '][]=' + widget_data.filter[widget_data.filter_type][i]);
                        }
                    }
                }
                util.wxRequest({
                    url: config.BASE_URL + '/openapi/goods/gallery' + api_data + '&' + filterArray.join('&'),
                    success: function(res) {
                        let resdata = res.data;
                        if (resdata.result == 'success') {
                            let goods_list = resdata.data.goods_list;
                            for (var i = 0; i < goods_list.length; i++) {
                                goods_list[i]['product']['image'] = util.fixImgUrl(goods_list[i]['product']['image']);
                            }
                            let set = {};
                            set['widgets.goodslist.' + index + '.items'] = goods_list;
                            _this.setData(set);
                        }

                    },
                    fail: function(re) {
                        console.info(re);
                    }
                });

            }
        }
    },
    /*万能表单*/
    omnipotentform: {
        data: {},
        event: {
            onLoad: function(widget_data, index) {
                var _this = this;
                if (widget_data.filter.length==0) {
                  return;
                }
                var form_id = widget_data.filter[0].form_id;
                var select_key = 'selected_region.' + index;
                _this.setData({
                    [select_key]: [0, 0, 0],
                })
                
                util.wxRequest({
                    url: config.BASE_URL + '/m/universalform-' + form_id + '.html',
                    success: function(res) {
                        let resdata = res.data;
                        if (resdata.error) return;
                        let form_list = resdata.form;
                        let form = {};

                        form['widgets.omnipotentform.' + index + '.items'] = form_list;
                        form['widgets.omnipotentform.' + index + '.imgcode'] = config.BASE_URL + '/vcode-index-universalform.html?sess_id=' + wx.getStorageSync('_SID');
                        _this.setData(form);
                        var modules = _this.data.widgets.omnipotentform[index].items.modules;
                        var _data = _this.data.widgets.omnipotentform[index].items.modules;
                        for (var _key in _data) {
                            if (_data[_key].type == 'select') {
                                var arr = ['请选择'];
                                for (var key in _data[_key].options) {
                                    arr.push(key);
                                }
                                _data[_key].options = arr;
                                _data[_key].checked = 0;
                                var skey = 'widgets.omnipotentform.' + index + '.items.modules';
                                _this.setData({
                                    [skey]: _data
                                })
                            }
                            if (_data[_key].type == 'region') {
                                var key = _key;
                                util.getRegionData([0, 0], function(data) {
                                    var region_dataset = format_region_data(data);

                                    if (_this.data.maddr && _this.data.maddr.area) {
                                        set_region_val.call(_this, _this.data.maddr.area);
                                    } else {
                                        init_region.call(_this);
                                    }
                                    _this.setData({
                                        'region_data.first': region_dataset
                                    });

                                    var sdata = _this.data.widgets.omnipotentform[index].submitdata ? _this.data.widgets.omnipotentform[index].submitdata : {},
                                        k = _data[key].name,
                                        v = get_region_val.call(_this, index);
                                    var skey = 'widgets.omnipotentform.' + index + '.submitdata';
                                    sdata[k] = v;
                                    _this.setData({
                                        [skey]: sdata,
                                    })
                                });
                            }
                        }
                    },
                    fail: function(re) {
                        console.info(re);
                    }
                });
            },
            evt_radiochange: function(e) {
                var _this = this;
                var index = e.currentTarget.dataset.widgetIndex,
                    sdata = _this.data.widgets.omnipotentform[index].submitdata ? _this.data.widgets.omnipotentform[index].submitdata : {},
                    k = e.currentTarget.dataset.name,
                    v = e.detail.value,
                    arr = e.currentTarget.dataset.range,
                    _key = e.currentTarget.dataset.key;
                var _data = _this.data.widgets.omnipotentform[index].items.modules;
                _data[_key].checked = v;
                var skey = 'widgets.omnipotentform.' + index + '.items.modules';
                _this.setData({
                    [skey]: _data
                })
                sdata[k] = (arr[v] == '请选择' ? '' : arr[v]);
                var skey = 'widgets.omnipotentform.' + index + '.submitdata';
                this.setData({
                    [skey]: sdata,
                })
            },
            evt_selectchange: function(e) {
                var _this = this;
                var index = e.currentTarget.dataset.widgetIndex,
                    sdata = _this.data.widgets.omnipotentform[index].submitdata ? _this.data.widgets.omnipotentform[index].submitdata : {},
                    k = e.currentTarget.dataset.name,
                    v = e.detail.value;
                sdata[k] = v;
                var skey = 'widgets.omnipotentform.' + index + '.submitdata';
                this.setData({
                    [skey]: sdata,
                })
            },
            evt_checkboxchange: function(e) {
                var _this = this;
                var index = e.currentTarget.dataset.widgetIndex,
                    sdata = _this.data.widgets.omnipotentform[index].submitdata ? _this.data.widgets.omnipotentform[index].submitdata : {},
                    k = e.currentTarget.dataset.name,
                    v = e.detail.value;
                for (var i = 0; i < v.length; i++) {
                    sdata[k + '[' + i + ']'] = v[i];
                }
                //sdata[k] = v;
                var skey = 'widgets.omnipotentform.' + index + '.submitdata';
                this.setData({
                    [skey]: sdata,
                })
            },
            evt_selectdate: function(e) {
                var _this = this;
                var index = e.currentTarget.dataset.widgetIndex,
                    sdata = _this.data.widgets.omnipotentform[index].submitdata ? _this.data.widgets.omnipotentform[index].submitdata : {},
                    k = e.currentTarget.dataset.name,
                    v = e.detail.value;
                sdata[k] = v;
                var skey = 'widgets.omnipotentform.' + index + '.submitdata';
                var selecteddate = 'widgets.omnipotentform.' + index + '.selecteddate';
                this.setData({
                    [skey]: sdata,
                    [selecteddate]: v
                })
            },
            evt_regionchange: function(e) {
                var index = e.currentTarget.dataset.widgetIndex;
                var _this = this;
                if (!this.data.region_data || !this.data.region_data.first || !this.data.region_data.first.length || e.timeStamp < 700) {
                    return;
                }
                var path = e.detail.value;
                if (path[0] != this.data.selected_region[index][0]) {
                    path[1] = 0;
                    path[2] = 0;
                }
                if (path[1] != this.data.selected_region[index][1]) {
                    path[2] = 0;
                }
                init_region.call(this, path);
                var select_key = 'selected_region.' + index;
                this.setData({
                    [select_key]: path,
                })
                var sdata = _this.data.widgets.omnipotentform[index].submitdata ? _this.data.widgets.omnipotentform[index].submitdata : {},
                    k = e.currentTarget.dataset.name,
                    v = get_region_val.call(this, index);
                sdata[k] = v;
                var skey = 'widgets.omnipotentform.' + index + '.submitdata';
                this.setData({
                    [skey]: sdata,
                })
            },
            evt_submit: function(e) {
                var _this = this;
                var index = e.currentTarget.dataset.widgetIndex,
                    sdata = _this.data.widgets.omnipotentform[index].submitdata ? _this.data.widgets.omnipotentform[index].submitdata : {},
                    k = e.currentTarget.dataset.name,
                    v = e.detail.value,
                    form_items = _this.data.widgets.omnipotentform[index].items.modules;
                for (var k in e.detail.value) {
                    sdata[k] = e.detail.value[k];
                }
                var skey = 'widgets.omnipotentform.' + index + '.submitdata';
                this.setData({
                    [skey]: sdata,
                });
                var submitdata = _this.data.widgets.omnipotentform[index].submitdata;
                for (var k in form_items) {
                    if (form_items[k].required == 'true' && form_items[k].show == 'true') {
                        //表单项必填
                        if (form_items[k].type == 'checkbox' || form_items[k].type == 'images') {
                            //submitdata[form_items[k].name]
                            var key = form_items[k]['name'] + '[0]';
                            if (!submitdata[key] || submitdata[key] == '') {
                                wx.showModal({
                                    title: '请填写必填项',
                                    content: form_items[k].module_name + '不能为空',
                                    showCancel: false
                                });
                                return;
                            }
                        } else {
                            if (!submitdata[form_items[k].name] || submitdata[form_items[k].name] == '') {
                                wx.showModal({
                                    title: '请填写必填项',
                                    content: form_items[k].module_name + '不能为空',
                                    showCancel: false
                                });
                                return;
                            }
                        }
                    }
                }
                util.wxRequest({
                    url: config.BASE_URL + '/m/universalform-save.html',
                    method: 'POST',
                    data: submitdata,
                    success: function(res) {
                        if (res.data.success) {
                            wx.showModal({
                                title: '表单提交成功',
                                showCancel: false,
                                success: function(re) {
                                    wx.navigateBack();
                                }
                            });
                        } else {
                            wx.showModal({
                                title: '表单提交失败',
                                content: (res.data.error || ''),
                                showCancel: false
                            });
                        }
                    }
                })
            },
            evt_imageupload: function(e) {
                var _this = this;
                var index = e.currentTarget.dataset.widgetIndex,
                    sdata = _this.data.widgets.omnipotentform[index].submitdata ? _this.data.widgets.omnipotentform[index].submitdata : {},
                    k = e.currentTarget.dataset.name,
                    v = '';
                wx.chooseImage({
                    count: 1,
                    sizeType: ['original', 'compressed'],
                    sourceType: ['album', 'camera'],
                    success: function(res) {
                        var tempFilePaths = res.tempFilePaths;
                        util.wxUpload({
                            url: config.BASE_URL + '/m/imagemanage-wx_upload.html',
                            filePath: tempFilePaths[0],
                            name: 'file',
                            success: function(res) {
                                if (res.data == '') {
                                    wx.showModal({
                                        title: '上传失败',
                                        content: '图片上传失败,请重试',
                                        showCancel: false
                                    })
                                    return;
                                };
                                var data = JSON.parse(res.data);
                                v = data.image_id;
                                //do something
                                sdata[k] = v;
                                var skey = 'widgets.omnipotentform.' + index + '.submitdata';
                                var imgkey = 'widgets.omnipotentform.' + index + '.image';
                                _this.setData({
                                    [skey]: sdata,
                                    [imgkey]: 'https:' + data.url
                                })
                            }
                        })
                    }
                })
            },
            evt_imagesupload: function(e) {
                var _this = this;
                var index = e.currentTarget.dataset.widgetIndex,
                    sdata = _this.data.widgets.omnipotentform[index].submitdata ? _this.data.widgets.omnipotentform[index].submitdata : {},
                    k = e.currentTarget.dataset.name,
                    v = '';

                wx.chooseImage({
                    count: 9,
                    sizeType: ['original', 'compressed'],
                    sourceType: ['album', 'camera'],
                    success: function(res) {
                        var tempFilePaths = res.tempFilePaths;
                        var images = _this.data.widgets.omnipotentform[index].images ? _this.data.widgets.omnipotentform[index].images : [],
                            submitimages = _this.data.widgets.omnipotentform[index].submitdata[k] ? _this.data.widgets.omnipotentform[index].submitdata[k] : [];
                        for (var i = 0; i < tempFilePaths.length; i++) {
                            util.wxUpload({
                                url: config.BASE_URL + '/m/imagemanage-wx_upload.html',
                                filePath: tempFilePaths[i],
                                name: 'file',
                                success: function(res) {
                                    var data = JSON.parse(res.data);
                                    v = data.image_id;
                                    sdata[k + '[' + images.length + ']'] = v;
                                    var skey = 'widgets.omnipotentform.' + index + '.submitdata';
                                    var imgkey = 'widgets.omnipotentform.' + index + '.images';
                                    images.push('https:' + data.url);
                                    _this.setData({
                                        [skey]: sdata,
                                        [imgkey]: images
                                    })
                                }
                            })
                        }
                    }
                })
            },
            evt_mobileipt: function(e) {
                var index = e.currentTarget.dataset.widgetIndex;
                var skey = 'widgets.omnipotentform.' + index + '.getvcode_mobile';
                this.setData({
                    [skey]: e.detail.value
                });
            },
            evt_getcode: function(e) {
                var _this = this;
                var index = e.currentTarget.dataset.widgetIndex;
                if (_this.data.widgets.omnipotentform[index].vcode_percent > 0) {
                    return;
                }
                util.wxRequest({
                    url: config.BASE_URL + '/m/universalform-vmobile.html',
                    method: 'POST',
                    data: {
                        mobile: _this.data.widgets.omnipotentform[index].getvcode_mobile
                    },
                    success: function(res) {
                        let resdata = res.data;
                        if (resdata.success) {
                            wx.showToast({
                                icon: 'success',
                                title: '发送成功',
                                success: function() {
                                    var skey = 'widgets.omnipotentform.' + index + '.vcode_percent'
                                    _this.setData({
                                        [skey]: 1
                                    });
                                    if (_this.vcode_percent_timer) {
                                        clearInterval(_this.vcode_percent_timer)
                                    }
                                    var iv = 1;
                                    _this.vcode_percent_timer = setInterval(function() {
                                        if (_this.data.widgets.omnipotentform[index].vcode_percent > 100) {
                                            _this.setData({
                                                [skey]: 0
                                            });
                                            return clearInterval(_this.vcode_percent_timer);
                                        }
                                        _this.setData({
                                            [skey]: Math.round(iv / 60 * 100)
                                        });
                                        iv++;
                                    }, 1000);
                                }
                            });
                        } else {
                            wx.showModal({
                                title: '获取验证码失败',
                                content: (resdata.error || ''),
                                showCancel: false
                            });
                        }
                    },
                    complete: function() {

                    }
                });
            },
            evt_getimagecode: function(e) {
                var _this = this;
                var index = e.currentTarget.dataset.widgetIndex;
                var skey = 'widgets.omnipotentform.' + index + '.imgcode';
                var img_url = config.BASE_URL + '/vcode-index-universalform.html?' + new Date().getTime() + '&sess_id=' + wx.getStorageSync('_SID');
                this.setData({
                    [skey]: img_url,
                })
            }
        }
    },
    /**
     * 智能橱窗
     */
    showcase: {
        data: {
            cols: 'col-1-2', //-2-1,-3
            has_gap: true
        },
        event: {}
    },
    /**
     * 图文混合
     */
    imagetext: {
        data: {

        },
        event: {}
    },
    /**
     * 视频
     */
    video: {
        data: {
            cols: 'col-1-2', //-2-1,-3
            has_gap: true
        },
        event: {}
    },
    /*标签导航*/
    labelnav: {
        data: {
            tabShow: false,
        },
        event: {
            onLoad: function(widget_data, index) {

            },
            evt_tabscroll: function(e) {
                wx.setStorageSync('scrollLeft', e.detail.scrollLeft);
            },
            evt_openPage: function(e) {
                //点击跳转事件
                var dataset = e.currentTarget.dataset;
                var scrollLeft = wx.getStorageSync('scrollLeft');
                var _this = this;
                var url = dataset.url,
                    openType = dataset.opentype,
                    isActive = dataset.isactive,
                    index = dataset.widgetIndex;
                if (!url) return;
                if (openType === 'redirect' || !openType) {
                    // wx.redirectTo({
                    //     url:url
                    // })
                    //this.setData({'data':{}})
                    //这种方法有不可预知的问题,有可能导致页面数据不对(暂时未发现),但用户要求这样做,说以后出现问题让我再改,sowtf
                    this.onLoad({
                        's': url.split('?')[1].split('=')[1]
                    })
                } else {
                    wx.navigateTo({
                        url: url
                    })
                }
                setTimeout(function() {
                    if (scrollLeft) {
                        var o = {};
                        o['widgets.labelnav.' + index + '.scrollLeft'] = scrollLeft;
                        _this.setData(o)
                    }
                }, 500)

            },
            evt_selectcatMore: function(e) {
                var index = e.currentTarget.dataset.widgetIndex;
                var obj = {};
                obj['widgets.labelnav.' + index + '.tabShow'] = !this.data.widgets.labelnav[index].tabShow;
                this.setData(obj)
            },
        }
    },
    /*文章列表*/
    articlelist: {
        data: {
            "title": "文章列表",
            "with_panel": true,
            "type": "gallery",
            "swiper_height": 80,
            "swiper_width": 80,
            "mode": "aspectFit",
            "limit": 9

        },
        event: {
            onLoad: function(widget_data, index) {
                var _this = this;

                if (widget_data.filter_type == 'column_id') {
                    if (widget_data.filter['column_id'] == false || widget_data.filter['column_id'].length == 0) {
                        return false;
                    }
                    util.wxRequest({
                        url: config.BASE_URL + '/m/n-' + widget_data.filter['column_id'][0] + '-' + 1 + '.html?size=' + widget_data.limit,
                        success: function(res) {
                            let resdata = res.data;
                            if (resdata.alist) {
                                let article_list = resdata.alist;
                                var arr = [];
                                for (var i = 0; i < article_list.length; i++) {
                                    if (!article_list[i].body || !article_list[i].body.image_id) {
                                        arr.push('');
                                    } else {
                                        arr.push(article_list[i].body.image_id);
                                    }
                                    if (!article_list[i].body || !article_list[i].body.seo_description) {
                                      article_list[i].seo_description = '';
                                    } else {
                                      article_list[i].seo_description = article_list[i].body.seo_description;
                                    }
                                    
                                }
                                util.getImg(arr, '', function(imgs) {
                                    for (var i = 0; i < imgs.length; i++) {
                                        article_list[i].src = imgs[i];
                                    }
                                    let set = {};
                                    set['widgets.articlelist.' + index + '.items'] = article_list;
                                    _this.setData(set);
                                })

                            }

                        },
                        fail: function(re) {}
                    });
                } else {
                    var content_id = widget_data.filter['content_id'];
                    if (widget_data.filter['content_id'] == false || widget_data.filter['content_id'].length == 0) {
                        return false;
                    }
                    var str = content_id.join(',');
                    util.wxRequest({
                        url: config.BASE_URL + '/openapi/content_node/articles_body/article_id/' + str + '/article_limit/' + widget_data.limit,
                        success: function(response) {
                            let article_list = response.data.data;
                            if (!response.data || !response.data.data)
                                return false;
                            var arr = [];
                            for (var i = 0; i < response.data.data.length; i++) {
                                if (!response.data.data[i].image_id) {
                                    arr.push('');
                                } else {

                                    arr.push(response.data.data[i].image_id);
                                }

                            }
                            util.getImg(arr, '', function(imgs) {
                                for (var i = 0; i < imgs.length; i++) {
                                    response.data.data[i].src = imgs[i];
                                }
                                let set = {};
                                set['widgets.articlelist.' + index + '.items'] = article_list;
                                _this.setData(set);
                            })
                        },
                        fail: function(re) {}
                    });

                }


            }
        }
    },
    activecard: {
        data: {
            'isShowTitle': true,
            'isShowTime': true,
            'isShowAddress': true,
            'isShowRadius': true,
            'isShowGap': true,
            'isShowBrief': true,
            'title': '',
            'time': '',
            'address': '',
            'brief': '',
            'img_url': config.BASE_HOST
        },
        event: {
            onLoad: function(widget_data, index) {
                var _this = this;
                var activity_id = widget_data.filter['activity_id'];
                if (!activity_id)
                    return;
                if (activity_id.length == 0) {
                    return;
                }
                util.wxRequest({
                    url: config.BASE_URL + '/openapi/xcxpage/activity?filter[id]=' + widget_data.filter['activity_id'],
                    method: 'GET',
                    success: function(res) {
                        let resdata = res.data;
                        if (resdata) {
                            let activity_list = resdata.data;
                            let set = {};
                            var arr = [];
                            for (var i = 0; i < activity_list.length; i++) {
                                activity_list[i].from_time = dateFormat(parseInt(activity_list[i].from_time) * 1000, 'yyyy.mm.dd HH:MM');
                                activity_list[i].to_time = dateFormat(parseInt(activity_list[i].to_time) * 1000, 'yyyy.mm.dd HH:MM');

                                if (!activity_list[i].subject.default_image_id) {
                                    arr.push('');
                                } else {
                                    arr.push(activity_list[i].subject.default_image_id);
                                }
                            }
                            util.getImg(arr, '', function(imgs) {
                                for (var i = 0; i < imgs.length; i++) {
                                    activity_list[i].subject.src = imgs[i];
                                }
                                let set = {};
                                set['widgets.activecard.' + index + '.items'] = activity_list;
                                _this.setData(set);
                                for (var i = 0; i < activity_list.length; i++) {
                                    count_gpsdistance.call(_this,'activecard', index, i);
                                }
                            })
                        }
                    },
                    fail: function(re) {
                        console.info(re);
                    }
                });
            }
        }
    },
    /**
     * 新版智能橱窗
     */
    smartwindow: {
        data: {
            cols: 'col-1', //-2-1,-3
            has_gap: true,
            has_radius: true
        },
        event: {}
    },
    grouppresale: {
        data: {
            "title": "团购预售",
            'display_type': 'normal',
            'filter_type': 'group_id'
        },
        event: {
            onLoad: function(widget_data, index) {
                var _this = this;
                if (widget_data.filter_type == 'group_id') {
                    util.wxRequest({
                        url: config.BASE_URL + '/openapi/xcxpage/groupbooking?filter[activity_id]=' + widget_data.filter['group_id'][0],
                        success: function(res) {
                            let resdata = res.data;
                            if (resdata && resdata.data && resdata.data.length>0) {
                                let group_list = resdata.data[0];
                                let set = {};
                                var arr = [];
                                
                                var timestamp = Date.parse(new Date());
                                timestamp = timestamp / 1000;
                                if (timestamp < group_list.start_time){
                                  group_list.statusname = '未开始'
                                } else if (timestamp >= group_list.end_time){
                                  group_list.statusname = '已结束'
                                }else{
                                  group_list.statusname = '去开团'
                                }
                                arr.push(group_list);
                                set['widgets.grouppresale.' + index + '.items'] = arr;
                                _this.setData(set);
                            }
                        },
                        fail: function(re) {
                            console.info(re);
                        }
                    });
                } else {
                    util.wxRequest({

                        url: config.BASE_URL + '/openapi/xcxpage/preselling?filter[activity_id]=' + widget_data.filter['presale_id'][0],
                        success: function(res) {
                            let resdata = res.data;
                            if (resdata && resdata.data && resdata.data.length > 0) {

                                let presale_list = resdata.data[0];
                                let set = {};
                                var arr = [];
                                arr.push(presale_list);
                                set['widgets.grouppresale.' + index + '.items'] = arr;
                                _this.setData(set);

                            }
                        },
                        fail: function(re) {
                            console.info(re);
                        }
                    });
                }
            }
        }
    },
    sixteenpalaces: {
        data: {
            has_gap: true,
            has_radius: true,
            bgColor: '#efefef'
        },
        event: {}
    },
    fixedpopup: {
        data: {
            'location': 'right-bottom',
            'img_url': config.BASE_HOST,
            'isShow': true
        },
        event: {
            evt_closePopup: function(e) {
                var index = e.currentTarget.dataset.widgetIndex;
                var obj = {};
                obj['widgets.fixedpopup.' + index + '.isShow'] = !this.data.widgets.fixedpopup[index].isShow;
                this.setData(obj)
            },
            evt_phonestart: function(e) {
                wx.makePhoneCall({
                    phoneNumber: e.currentTarget.dataset.phone
                });
            },
            evt_codestart:function(){
              var url = util.getCurrentPageUrlWithArgs();    //当前页面url
              console.log(url);
              wx.showToast({
                title: '正在生成..',
                icon: 'loading',
                duration: 10000
              });
              util.getqrcode({
                'path': url,
                'type': 'scene',
                'width': 430
              }, function (qr_image_data) {
                wx.hideToast();
                wx.previewImage({
                  urls: [qr_image_data.qrcode_image_url]
                });
              });
            },
            evt_gotopstart:function(){
              wx.pageScrollTo({
                scrollTop: 0
              })
            },
            evt_wxappstart: function (e) {
              var appid = e.currentTarget.dataset.appid;
              console.log(appid);
              wx.navigateToMiniProgram({
                appId: appid,
                path: '',
                envVersion: 'release',
                success(res) {
                  // 打开成功
                  //console.log(res)
                },
                fail(res){
                    //console.log(res)
                }
              })
            }
        }
    },
    storelist: {
      data: {
        'isShowTel':true,
        'isShowAddress': true,
        'isShowImg':true,
        'isShowTime':true,
        'limit':'',
        'display_type':'normal',
        'img_url': config.BASE_HOST
      },
      event: {
        onLoad: function (widget_data, index) {
          var _this = this;
          var store_id = widget_data.filter['store_id'];
          if (!store_id)
            return;
          if (store_id.length == 0) {
            return;
          }
          //widget_data.limit
          util.wxRequest({
            url: config.BASE_URL + '/openapi/xcxpage/stores?filter[id]=' + store_id.join(','),
            data:{
              
            },
            method: 'GET',
            success: function (res) {
              let resdata = res.data;
              if (resdata) {
                let store_list = resdata.data;
                let set = {};
                set['widgets.storelist.' + index + '.items'] = store_list;
                _this.setData(set);
                var arr = [];
                for (var i = 0; i < store_list.length; i++) {
                  count_gpsdistance.call(_this, 'storelist', index, i);
                }
                
              }
            },
            fail: function (re) {
              console.info(re);
            }
          });
        }
      }
    },
    /*文本导航*/
    textmsg: {
      data: {},
      event: {}
    },
    // 限时降价
    limitimepurchase:{
      data: {
        title:'',
        'filter_type':'plan_id',
        'display_type':'swiper',
        "swiper_height":150,
        "imgSrc":null,
        'bgColor':'#cc0000',
        'countdown':'',
        'timestamp':''
      },
      event: {
        onLoad: function (widget_data, index) {
             var _this = this;
             let adjust = function(_this,widget_data,index){
                var time = function(){};
                  clearInterval(time);
                 
                  var plan_id = widget_data.filter['plan_id'];
                  if (!plan_id)
                    return;
                  if (plan_id.length == 0) {
                    return;
                  }
                  //widget_data.limit
                  util.wxRequest({
                    url: config.BASE_URL + '/openapi/xcxpage/adjustprices?filter[plan_id]=' + plan_id.join(','),
                    method: 'GET',
                    success: function (res) {
                      let resdata = res.data;
                      let set = {};
                      if (resdata && resdata.data && resdata.data.length>0) {
                        let limit_list = resdata.data;
                        let set = {};
                        set['widgets.limitimepurchase.' + index + '.items'] = limit_list;
                        _this.setData(set);
                        var timestamp = Date.parse(new Date());
                        timestamp = timestamp / 1000;
                        let set2 = {};
                        set2['widgets.limitimepurchase.' + index + '.timestamp'] = timestamp;
                        _this.setData(set2);
                        var intDiff;
                        if (limit_list[0].carry_out_time >timestamp) {
                          intDiff = limit_list[0].carry_out_time - timestamp;
                        } else if (limit_list[0].rollback_time - timestamp>0&&limit_list[0].carry_out_time<timestamp) {
                          intDiff = limit_list[0].rollback_time - timestamp;
                        }
                        if (!intDiff) {
                            set['widgets.limitimepurchase.' + index + '.countdown'] = false;
                          _this.setData(set);
                            return;
                        };
                        time = setInterval(function () {
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
                            // _this.onLoad.call(_this, _this.data.options);
                            adjust(_this,widget_data,index)
                            clearInterval(time);
                          }
                          set['widgets.limitimepurchase.' + index + '.countdown'] = {
                            days: day,
                            hours: hour,
                            minutes: minute,
                            seconds: second,
                          };
                          _this.setData(set);
                          intDiff -= 1;
                        }, 1000)
                      }
                    },
                    fail: function (re) {
                      console.info(re);
                    }
                  });
           }
            adjust(_this,widget_data,index)
        }
      }
    },
    /*优惠券*/
    coupon: {
      data: {
        display_type:'card',
        imgSrc:''
      },
      event: {
        onLoad: function (widget_data, index) {
          var time = null;
          var _this = this;
          var coupon_id = widget_data.filter['coupon_id'];
          if (!coupon_id)
            return;
          if (coupon_id.length == 0) {
            return;
          }
          //widget_data.limit
          util.wxRequest({
            url: config.BASE_URL + '/m/couponactivity-' + coupon_id + '.html',
            data: {

            },
            method: 'GET',
            success: function (res) {
              if(res.data&&res.data.data_list){
                var arr = [];
                for (var i in res.data.data_list.cpns_list) {
                  res.data.data_list.cpns_list[i].from_time = dateFormat(parseInt(res.data.data_list.cpns_list[i].from_time) * 1000, 'yy-mm-dd');
                  res.data.data_list.cpns_list[i].to_time = dateFormat(parseInt(res.data.data_list.cpns_list[i].to_time) * 1000, 'yy-mm-dd');
                  res.data.data_list.cpns_list[i]['bought'] = (res.data.data_list.cpns[res.data.data_list.cpns_list[i].cpns_id].achieve_sum / res.data.data_list.cpns[res.data.data_list.cpns_list[i].cpns_id].num_sum * 100).toFixed(2);
                  arr.push(res.data.data_list.cpns_list[i]);
                }
                if (!widget_data.limit){
                  res.data.data_list.cpns_list = arr;
                }else{
                  res.data.data_list.cpns_list = arr.slice(0, Number(widget_data.limit));
                }
                 let set = {};
                 set['widgets.coupon.' + index + '.items'] = [res.data.data_list];
                 _this.setData(set);
              }
            },
            fail: function (re) {
              console.info(re);
            }
          });
        },
        evt_achievecoupon: function (e) {
          var cpnurl = e.currentTarget.dataset.cpnurl;
          var _this = this;
          util.checkMember.call(_this, function () {
            util.wxRequest({
              url: config.BASE_URL + '/openapi/acpns/achieve/' + cpnurl,
              success: function (res) {
                var r = res.data;
                if (r.result == 'success') {
                  wx.showModal({
                    title: '领取成功',
                    content: '恭喜您已获得一张优惠券',
                    showCancel: true,
                    confirmText: '继续领',
                    confirmColor: '#02BB00',
                    cancelText: '查看',
                    cancelColor: '#000000',
                    success: function (res) {
                      if (res.confirm) {
                        //取消继续领
                      } else if (res.cancel) {
                        wx.navigateTo({
                          url: '/pages/member/coupons/index'
                        })
                      }
                    }
                  });
                } else {
                  wx.showModal({
                    title: '领取失败',
                    showCancel: false,
                    content: r.msg,
                    confirmText: '知道了',
                  });
                }
              }
            })
          })
        }
      }
    }
};
