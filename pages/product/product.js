//gallery.js
//商品列表页
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
var md5 = require('../../utils/md5.js');
const WxParse = require('../../utils/wxParse/wxParse.js');
//const dateFormat = require('../../utils/dateformat.js');
const app = getApp();
//var currentPages = getCurrentPages();
var adjustprice_timer = 0;
//处理相册
const set_slide = function(image_arr) {
    var _this = this;
    var image_ids = [];
    for (var i in image_arr) {
        image_ids.push(image_arr[i].image_id);
    }
    util.wxRequest({
        url: config.BASE_URL + '/openapi/storager/m',
        method: 'POST',
        data: {
            'images': image_ids
        },
        success: function(res) {
            let resdata = res.data.data;
            //console.info(resdata);
            for (let i = 0; i < resdata.length; i++) {
                resdata[i] = util.fixImgUrl(resdata[i]);
            }
            _this.setData({
                'slide_images': resdata
            });
        }
    })

};
//加载促销
const set_promotions = function(goods_id, cur_price) {
    var _this = this;
    util.wxRequest({
        url: config.BASE_URL + '/openapi/goods/promotion/goods_id/' + goods_id + '/price/' + cur_price,
        success: function(res) {
            var gpromotion_data = res.data.data;
            if (gpromotion_data.sale_price) {
                _this.setData({
                    'data_detail.product.buy_price': gpromotion_data.sale_price
                });
            }
            if (gpromotion_data.plist.length) {
                _this.setData({
                    'promotion_list': gpromotion_data.plist
                });
            }
        }
    })

};
//相关商品
const set_related = function() {
    var _this = this;
    util.wxRequest({
        url: config.BASE_URL + '/openapi/goods/related?goods_id=' + _this.data.data_detail.goods_id,
        success: function(res) {
            var pagedata = res.data;
            _this.setData({
                'related': pagedata.data
            });
        }
    });
}
const set_cartcount = function() {
    var _this = this;
    util.wxRequest({
        url: config.BASE_URL + '/openapi/cart/count',
        success: function(res) {
            try {
                if (res.data.data.quantity > 0) {
                    _this.setData({
                        cartCount: res.data.data.quantity
                    });
                }
            } catch (e) {

            }

        }
    });
}
const set_adjustprice = function() {
    clearInterval(adjustprice_timer);
    var _this = this;
    util.wxRequest({
        url: config.BASE_URL + '/openapi/ajprice/products?product_id=' + _this.data.data_detail.product.product_id,
        success: function(res) {
            console.log(res);
            if (res.data && res.data.data && res.data.data.length > 0) {
                var adjustprice = res.data.data[0];
                console.log(adjustprice);
                var intDiff;
                var timestamp = Date.parse(new Date());
                timestamp = timestamp / 1000;
                _this.setData({
                    is_adjust: true,
                    adjustprice:adjustprice,
                    timestamp: timestamp
                });
                if (adjustprice.carry_out_time > timestamp) {
                    intDiff = adjustprice.carry_out_time - timestamp;
                    _this.setData({
                        time_flag: '开启'
                    });
                } else if (adjustprice.rollback_time - timestamp > 0 && adjustprice.carry_out_time < timestamp) {
                    intDiff = adjustprice.rollback_time - timestamp;
                    _this.setData({
                        time_flag: '结束'
                    });
                }
                adjustprice_timer = setInterval(function() {
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
                        clearInterval(adjustprice_timer);
                    }
                    _this.setData({
                        countdown: {
                            days: day,
                            hours: hour,
                            minutes: minute,
                            seconds: second,
                        }
                    });
                    //console.log(_this.data.countdown);
                    intDiff -= 1;
                }, 1000);
            }else{
                _this.setData({
                    is_adjust: false,
                    adjustprice:{},
                    timestamp: ''
                });
            }
        }
    });
}

const set_comment = function() {
    var _this = this;
    util.wxRequest({
        url: config.BASE_URL + '/m/comment-show-' + _this.data.data_detail.goods_id + '.html',
        success: function(res) {
            var pagedata = res.data;
            _this.setData({
                'comment': pagedata
            });
        }
    });
}

const set_desc = function() {
    this.setData({
        desc_loaded: 'YES',
    });
    WxParse.wxParse('product_desc', 'html', this.data.data_detail.description, this, 0);
}

const set_favorite = function() {
    var _this = this;
    util.checkMember.call(this, function() {
        util.wxRequest({
            url: config.BASE_URL + '/openapi/goods/check_fav/',
            data: {
                member_id: _this.data.member.member_id,
                goods_id: _this.data.data_detail.goods_id
            },
            success: function(res) {
                if (res.data.result == 'success') {
                    _this.setData({
                        isfav: (res.data.data.is_fav > 0 ? 'YES' : 'NO'),
                        favcount: res.data.data.fav_count
                    });
                }
            }
        });
    });

}

const stock_confirm = function() {
    var _this = this;
    util.wxRequest({
        url: config.BASE_URL + '/openapi/stock/confirm',
        method: 'POST',
        data: {
            sku: _this.data.data_detail.product.bn
        },
        success: function(res) {
            var pagedata = res.data;
            _this.setData({
                'stock': pagedata.data
            });
        }
    });
};

/**
 *  vshop
 */
const load_profit = function(product) {
    var _this = this;
    util.wxRequest({
        url: config.BASE_URL + '/m/vshop-pickout.html',
        method: 'GET',
        data: {
            'pids': product.product_id
        },
        success: function(res) {
            var pickout_data = res.data.data;
            if (pickout_data) {
                for (var pid in pickout_data) {
                    if (pickout_data[pid]['profit'] > 1) {
                        pickout_data[pid]['s_price'] = parseFloat(pickout_data[pid]['profit']).toFixed(2);
                    } else {
                        pickout_data[pid]['s_price'] = (parseFloat(product['buy_price']) * parseFloat(pickout_data[pid]['profit'])).toFixed(2);
                    }
                    var _set = {};
                    _set['pickout_data.' + pid] = pickout_data[pid];
                    _this.setData(_set);
                }
            }

        },
        complete: function() {

        }
    });
};





Page({
    data: {
        pickout_data: {},
        desc_loaded: 'NO',
        slide_images: [],
        quantityVal: 1,
        cartCount: 0,
        is_ready: false,
        themecolor: '',
        fromother: false,
        is_adjust: false,
	themecolor:'',
        fromother:false,
        img_url: config.BASE_HOST,
        is_showshare:false,
        showposter:false,
        swiperCurrent:0,
    },
    onShareAppMessage: function() {
        var _this = this;
        var the_path = '/pages/product/product?product_id=' + this.data.data_detail.product.product_id;
        if (this.data.pickout_data) {
            try {
                var vshop_id = this.data.pickout_data[Object.keys(this.data.pickout_data)[0]]['vshop_id'];
                if (vshop_id) {
                    the_path += '&_vshop_id=' + vshop_id + '&from=other';
                }
            } catch (e) {}
        }
        the_path = util.merchantShare(the_path);
        console.log(the_path);
        return {
            title: this.data.data_detail.name,
            path: the_path,
            imageUrl: util.fixImgUrl(this.data.slide_images[0])
        };
    },
    onReady: function() {
        var _this = this;
        _this.setData({
            is_ready: true
        });
        wx.setNavigationBarTitle({
            title: '商品详情'
        });
        wx.getSystemInfo({
            success: function(res) {
                console.info(res);
                _this.setData({
                    windowWidth: res.windowWidth,
                    windowHeight: res.windowHeight
                });
            }
        });
        clearInterval(adjustprice_timer);
    },
    onShow: function() {
        if (this.data.is_ready) {
            stock_confirm.call(this);
        }
    },
    onLoad: function(options) {
        this.setData({
            themecolor: app.globalData.themecolor
        })
        console.log(app.globalData.themecolor);
        var _this = this;
        if (options._vshop_id) {
            //for 微店
            wx.setStorageSync('_vshop_id', options._vshop_id);
        }
        if (options.from == 'other') {
            this.setData({
                fromother: true
            })
        }
        util.wxRequest({
            url: config.BASE_URL + '/m/item-' + options.product_id + '.html',
            success: function(res) {
                var pagedata = res.data;
                // //点亮星
                // var mark_star = pagedata.data_detail.mark_star;
                // pagedata['mark_star_arr'] = ['n', 'n', 'n', 'n', 'n'];
                // for (var i = 0; i < Math.round(mark_star); i++) {
                //     pagedata['mark_star_arr'][i] = 'y';
                // }

                _this.setData(pagedata);
                _this.setData({
                  quantityVal: 1,
                  swiperCurrent:0
                })
                //埋点
                app.oceanWay('ViewProduct', {
                  PageController: config.BASE_URL + '/m/item-' + options.product_id + '.html',
                  PageTitle: '商品详情',
                  ProductPrice: pagedata.data_detail.product.price,
                  ProductCatalog: pagedata.data_detail.category.cat_name,
                  ProductUnit: pagedata.data_detail.product.unit,
                  ProductName: pagedata.data_detail.product.name,
                  ProductBrand: pagedata.data_detail.brand.brand_name,
                  ProductBarcode: pagedata.data_detail.product.barcode,
                  ProductSpec: pagedata.data_detail.product.spec_info,
                  ProductWeightG: pagedata.data_detail.product.weight,
                  ProductSKU: pagedata.data_detail.product.bn,
                  ProductDBPID: pagedata.data_detail.product.product_id
                }, true);
                //会员微店
                load_profit.call(_this, pagedata.data_detail.product);

                //相册
                if (pagedata.data_detail.images){
                  set_slide.apply(_this, [pagedata.data_detail.images]);
                }
                //促销
                set_promotions.apply(_this, [pagedata.data_detail.goods_id, pagedata.data_detail.product.buy_price]);
                //购物车数量
                set_cartcount.call(_this);
                //评论
                set_comment.call(_this);
                //收藏 favorite
                set_favorite.call(_this);
                //库存确认
                stock_confirm.call(_this);
                //相关商品
                set_related.call(_this);
                //限时降价
                set_adjustprice.call(_this);
            },
            complete: function() {
                _this.setData({
                    hideLoading: true
                });
            },
            fail: function(re) {
                console.info(re);
            },
        });
        let merchant_id = wx.getStorageSync('merchant_id') ? wx.getStorageSync('merchant_id') : 'true';
        this.setData({
          merchant_id: merchant_id
        })

    },
    onReachBottom: function(e) {
        this.evt_loaddesc();
        this.onReachBottom = function() {};
    },
    evt_loaddesc: function() {
        set_desc.call(this);
    },
    tapspecitem: function(e) {
        var product_id = e.currentTarget.dataset.productid;
        if (product_id && product_id != this.data.data_detail.product.product_id) {
            this.onLoad({
                "product_id": product_id
            });
        }
    },
    tapslide: function(e) {
        var current_url = util.fixImgUrl(e.target.dataset.src);
        var urls = [];
        for (var i = 0; i < this.data.slide_images.length; i++) {
            urls.push(util.fixImgUrl(this.data.slide_images[i]));
        }
        wx.previewImage({
            current: util.fixImgUrl(e.target.dataset.src), // 当前显示图片的http链接
            urls: urls // 需要预览的图片http链接列表
        });
    },
    tappqminus: function(e) {
        this.setData({
            quantityVal: Number(this.data.quantityVal) - 1
        });
    },
    tappqplus: function(e) {
        if (this.data.quantityVal + 1 > this.data.stock[this.data.data_detail.product.bn].num) {
            wx.showModal({
                content: '库存不足,当前最多可售数量:' + this.data.stock[this.data.data_detail.product.bn].num,
                showCancel: false,
                success: function() {
                    //wx.navigateBack();
                }
            });
        } else {
            this.setData({
                quantityVal: Number(this.data.quantityVal) + 1
            });
        }

    },
    evt_quantityblur: function(e) {
        var _this = this;
        if (e.detail.value == 0) {
            e.detail.value = 1;
        }
        if (Number(e.detail.value) > this.data.stock[this.data.data_detail.product.bn].num) {
            wx.showModal({
                content: '库存不足,当前最多可售数量:' + this.data.stock[this.data.data_detail.product.bn].num,
                showCancel: false,
                success: function() {
                    //wx.navigateBack();
                    _this.setData({
                        quantityVal: _this.data.stock[_this.data.data_detail.product.bn].num
                    });
                }
            });
        } else {
            this.setData({
                quantityVal: Number(e.detail.value)
            });
        }

    },
    addcart: function(e) {
        var _this = this;

        util.checkMember.call(this, function() {

            var _timer = setTimeout(function() {
                wx.showToast({
                    title: '正在加入..',
                    icon: 'loading',
                    duration: 2000
                });
            }, 500);
            var product_id = _this.data.data_detail.product.product_id;
            var quantity = _this.data.quantityVal;
            util.wxRequest({
                url: config.BASE_URL + '/m/cart-' + (e.currentTarget.dataset.fastbuy ? 'fastbuy' : 'add') + '-' + product_id + '-' + quantity + '.html',
                success: function(res) {
                    var res_data = res.data;
                    wx.hideToast();
                    if (res_data.error) {
                        wx.showModal({
                            title: '购买失败',
                            content: res_data.error
                        });
                    } else {
                        if (e.currentTarget.dataset.fastbuy) {
                            //立即购买
                            if (getCurrentPages().length > 2) {
                                wx.redirectTo({
                                    url: '/pages/checkout/checkout?is_fastbuy=true'
                                });
                                return;
                            } else {
                                wx.navigateTo({
                                    url: '/pages/checkout/checkout?is_fastbuy=true'
                                });
                                return;
                            }
                        }
                        console.info(res_data);
                        // _this.setData({
                        //     'cartCount': res_data.data.goods_count
                        // });
                        //购物车数量
                        set_cartcount.call(_this);
                        wx.showToast({
                            title: '已加入',
                            icon: 'success',
                            duration: 1200
                        });
                    }
                },
                complete: function(e) {
                    clearTimeout(_timer);
                }
            });
        });
    },
    load_image: function(e) {
        util.loadImage(this, e.currentTarget.dataset.ident, 'xs');
    },
    evt_previewimage: function(e) {
        var image_id = e.currentTarget.dataset.ident;
        util.wxRequest({
            url: config.BASE_URL + '/openapi/storager/l',
            method: 'POST',
            data: {
                'images': [image_id]
            },
            success: function(res) {
                var image_src_data = res.data.data;
                wx.previewImage({
                    urls: [util.fixImgUrl(image_src_data[0])]
                });
            }
        });
    },
    evt_favorite: function(e) {
        var favstatus = e.currentTarget.dataset.favstatus;
        if (!favstatus) return true;
        var action = config.BASE_URL + '/m/my-favorite-' + (favstatus == 'YES' ? 'del' : 'add') + '-' + this.data.data_detail.goods_id + '.html';
        var _this = this;
        util.wxRequest({
            url: action,
            success: function(res) {
                if (res.data.success) {
                    _this.setData({
                        isfav: (favstatus == 'YES' ? 'NO' : 'YES')
                    });
                    wx.showToast({
                        title: (favstatus == 'YES' ? '移除收藏成功' : '成功加入收藏'),
                        icon: 'success',
                        duration: 1200
                    });
                }
            }
        });

    },
    evt_goto: function(e) {
        wx.switchTab({
            url: '/pages/index/index',
            success: function() {
                wx.navigateTo({
                    url: e.currentTarget.dataset.url
                });
            }
        });
    },
    evt_pickout: function(e) {
        var _this = this;
        var gid = e.currentTarget.dataset.goodsid;
        var pid = e.currentTarget.dataset.productid;
        var pickout_data = this.data.pickout_data;
        pickout_data[pid]['pickout'] = !pickout_data[pid]['pickout'];
        _this.setData({
            'pickout_data': pickout_data
        });
        util.wxRequest({
            url: config.BASE_URL + '/m/vshop-pickout-save.html',
            method: 'GET',
            data: {
                'gids': gid
            },
            success: function(res) {
                if (res.data && res.data.error) {
                    pickout_data[pid]['pickout'] = !pickout_data[pid]['pickout'];
                    _this.setData({
                        'pickout_data': pickout_data
                    });
                }
            }
        });
    },
    evt_showqrcode: function(e) {
        var product_id = this.data.data_detail.product.product_id;
        var the_path = '/pages/product/product?product_id=' + product_id;
        if (this.data.pickout_data) {
            try {
                var vshop_id = this.data.pickout_data[Object.keys(this.data.pickout_data)[0]]['vshop_id'];
                if (vshop_id) {
                    the_path += '&_vshop_id=' + vshop_id + '&from=other';
                }
            } catch (e) {}

        }
        wx.showToast({
            title: '正在生成..',
            icon: 'loading',
            duration: 10000
        });


    },
    evt_gohome: function() {
        wx.switchTab({
            url:'/pages/index/index'
        });
    },
    evt_gotop: function() {
        wx.pageScrollTo({
            scrollTop: 0,
            duration:600
        })
    },
    evt_showshare: function(e) {
        var _this = this;
        var product_id = _this.data.data_detail.product.product_id;
        var the_path = '/pages/product/product?product_id=' + product_id;
        if (this.data.pickout_data) {
            try {
                var vshop_id = this.data.pickout_data[Object.keys(this.data.pickout_data)[0]]['vshop_id'];
                if (vshop_id) {
                    the_path += '&_vshop_id=' + vshop_id + '&from=other';
                }
            } catch (e) {}

        };
        const zoom_drawimage = function(o_w, o_h, m_w, m_h) {
            if (o_w > m_w) {
                let scaling = 1 - (o_w - m_w) / o_w;
                o_w = o_w * scaling;
                o_h = o_h * scaling;
            }
            if (o_h > m_h) {
                let scaling = 1 - (o_h - m_h) / o_h;
                o_w = o_w * scaling;
                o_h = o_h * scaling;
            }
            return {
                w: o_w,
                h: o_h
            };
        };
        wx.showActionSheet({
            itemList: ['二维码', '海报二维码'],
            success: function(res) {
                console.info(res);
                if (res.cancel) return;
                switch (res.tapIndex) {
                    case 0:
                        //直接生成二维码
                        wx.showLoading({
                            mask: true
                        });
                        util.getqrcode({
                            'path': the_path,
                            'type': 'scene',
                            'width': 430
                        }, function(qr_image_data) {
                            wx.hideLoading();
                            wx.previewImage({
                                urls: [qr_image_data.qrcode_image_url]
                            });
                        });
                        break;
                    case 1:
                        if (_this.poster_canvas_draw_complete) {
                            return _this.setData({
                                'canvas_poster_show': true
                            });
                        }
                        wx.showLoading({
                            mask: true
                        });
                        //获得产品大图
                        util.wxRequest({
                            url: config.BASE_URL + '/openapi/storager/l',
                            method: 'POST',
                            data: {
                                'images': [_this.data.data_detail.image_default_id]
                            },
                            success: function(res) {
                                var image_src_data = res.data.data;
                                var big_img_url = util.fixImgUrl(image_src_data[0]);
                                if(!big_img_url)return;
                                //获得产品页小程序二维码
                                util.getqrcode({
                                    'path': the_path,
                                    'type': 'scene',
                                    'width': 200
                                }, function(qr_image_data) {
                                    var qr_image_url = qr_image_data.qrcode_image_url;
                                    if (!qr_image_url) {
                                        return;
                                    }
                                    var win_width = _this.data.windowWidth;
                                    var win_height = _this.data.windowHeight;
                                    var canvas_max_width = win_width - 60;
                                    var canvas_max_height = win_height*0.7;
                                    var padding = 10;
                                    var h_fontsize = 16;
                                    var ctx = wx.createCanvasContext('poster_canvas');
                                    wx.getImageInfo({
                                        src: big_img_url,
                                        success: function(img_data) {
                                            if(!img_data){
                                                return;
                                            }
                                            var img_size = zoom_drawimage(img_data.width, img_data.height, canvas_max_width-padding*2, canvas_max_height*0.7-padding*2);

                                            //绘制商品默认相册图片
                                            ctx.setFillStyle('white');
                                            var img_rect_w = Math.round(img_size.w+padding*2);
                                            var img_rect_h = Math.round(img_size.h+padding*2);
                                            _this.setData({
                                                ctx_img_rect_w:img_rect_w,
                                                ctx_img_rect_h:img_rect_h,
                                            });
                                            ctx.fillRect(0, 0, img_rect_w, img_rect_h);
                                            ctx.drawImage(img_data.path,padding,padding, img_size.w, img_size.h);
                                            //绘制商品名称
                                            var product_name = _this.data.data_detail.name;
                                            if(!product_name)return;
                                            var max_text_width = img_size.w;
                                            ctx.fillRect(0, img_rect_h-1, img_rect_w, 50);
                                            ctx.setFontSize(h_fontsize);
                                            ctx.setTextAlign('left');
                                            ctx.setTextBaseline('middle');
                                            ctx.setFillStyle('black');
                                            console.info(ctx.measureText);
                                            if(typeof ctx.measureText == 'function'){
                                                //精准计算商品名称
                                                var product_name_arr = product_name.trim().split('');
                                                var line_loop_width = 0;
                                                var current_line = 0;
                                                for (let i = 0; i < product_name_arr.length; i++) {
                                                    var loop_x = Math.ceil(line_loop_width+padding);
                                                    if(loop_x<max_text_width){
                                                        ctx.fillText(product_name_arr[i],loop_x,img_rect_h+padding+(h_fontsize+5)*current_line);
                                                        line_loop_width+=ctx.measureText(product_name_arr[i]).width;
                                                    }else{
                                                        current_line+=1;
                                                        if(current_line>1)break;
                                                        line_loop_width=0;
                                                        loop_x = padding;
                                                        ctx.fillText(product_name_arr[i],loop_x,img_rect_h+padding+(h_fontsize+5)*current_line);
                                                        line_loop_width+=ctx.measureText(product_name_arr[i]).width;
                                                    }
                                                }
                                            }else{
                                                //非精准计算商品名称(特别是有英文时)
                                                var line_count = max_text_width/h_fontsize;
                                                var row1 = product_name.substr(0,line_count);
                                                var row2 = product_name.substr(line_count,line_count);
                                                row1!=''&&
                                                ctx.fillText(row1,padding,img_rect_h+padding+(h_fontsize+5)*0);
                                                row2!=''&&
                                                ctx.fillText(row2,padding,img_rect_h+padding+(h_fontsize+5)*1);
                                            }
                                            ctx.setFillStyle('white');
                                            ctx.fillRect(0, img_rect_h+48, img_rect_w, 100);
                                            ctx.setTextAlign('left');
                                            ctx.setTextBaseline('middle');
                                            ctx.setFillStyle('black');
                                            var price_str = _this.data.data_detail.product.buy_price;
                                            ctx.setFillStyle('#666666');
                                            ctx.setFontSize(14);
                                            ctx.fillText('¥',padding,img_rect_h+120);
                                            ctx.setFontSize(20);
                                            ctx.setFillStyle('#333333');
                                            ctx.fillText(price_str,padding+10,img_rect_h+118);
                                            //绘制小程序二维码
                                            wx.getImageInfo({
                                                src: qr_image_url,
                                                success: function(qrimg_data) {
                                                    ctx.drawImage(qrimg_data.path, img_rect_w - 90, img_rect_h+50, 80, 80);
                                                    ctx.draw();
                                                    wx.hideLoading();
                                                    _this.poster_canvas_draw_complete = true;
                                                    _this.setData({
                                                        'canvas_poster_show': true
                                                    });
                                                }
                                            });

                                        }
                                    });
                                });
                            }
                        });

                        break;


                }

            }

        });
    },
    evt_hideposter: function(e) {
        if(!e.target.dataset.hideposter)return;
        this.setData({
            'canvas_poster_show': false
        });
    },
    evt_previewposter: function(e) {
        var _this = this;
        wx.showLoading();
        wx.canvasToTempFilePath({
            canvasId: 'poster_canvas',
            success: function(res) {
                wx.hideLoading();
                wx.previewImage({
                    urls:[res.tempFilePath]
                });
            }
        });
    },
    evt_downloadposter: function(e) {
        var _this = this;
        wx.showLoading();
        wx.canvasToTempFilePath({
            canvasId: 'poster_canvas',
            success: function(res) {
                wx.hideLoading();
                wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: function(res) {
                        console.info(res);
                        _this.setData({
                            'canvas_poster_show': false
                        });
                        wx.showToast({
                            title: '已保存到手机',
                            icon: 'success',
                            duration: 1200
                        });
                    }
                });
            }
        });
    },
    evt_go_shop:function(e){
      let sno = e.currentTarget.dataset.sno;
      let mch = e.currentTarget.dataset.mch;
      if (this.data.merchant_id != mch){
        wx.navigateTo({
          url: '/pages/index/page/page?s=' + sno
        })
      }else{
        wx.reLaunch({
          url: '/pages/index/index?merchant_id=' + mch
        })
      }
    }
})
