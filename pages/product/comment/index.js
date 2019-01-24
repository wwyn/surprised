//index.js
//获取应用实例
const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
var current_page = 1;
var loading_more = false;

var load_list = function(page) {
    loading_more = true;
    var _this = this;
    var page = page ? page : 1;
    util.wxRequest({
        url: config.BASE_URL + '/m/comment-show-' + this.data.goods_id + '-' + page + '.html',
        success: function(res) {
            var newdata = res.data;
            var _thisdata = _this.data;
            if (newdata) {
                if (_thisdata.comment_list && page > 1) {
                    newdata.comment_list = _thisdata.comment_list.concat(newdata.comment_list);
                }

                _this.setData(newdata);
            }
        },
        complete: function() {
            _this.setData({
                hideLoading: true
            });
            loading_more = false;
        }
    });
};


Page({
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '商品评价详情'
        });
    },
    onShow: function() {
        var _this = this;
        wx.getSystemInfo({
            success: function(res) {
                _this.setData({
                    sv_height: res.windowHeight,
                });
            }
        });
    },
    onReachBottom: function() {
        if (this.data.pager.total == this.data.pager.current) {
            return;
        }
        current_page += 1;
        load_list.call(this, current_page);
    },
    onLoad: function(options) {
        var _this = this;
        _this.setData(options);
        load_list.call(this, 1);
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
    }
});
