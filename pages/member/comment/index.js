const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
const dateFormat = require('../../../utils/dateformat.js');
const app = getApp();
var comment_images = {};


Page({
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '评价商品'
        });
        comment_images = {};
    },
    onLoad: function(options) {
        var _this = this;
        var order_id = options.order_id;
        util.checkMember.call(this, function() {
            util.wxRequest({
                url: config.BASE_URL + '/m/comment-form-' + order_id + '.html',
                success: function(res) {
                    var pagedata = res.data;
                    var exits_comment = pagedata.exits_comment;
                    if (exits_comment) {
                        for (var product_id in exits_comment) {
                            for (var comment_id in exits_comment[product_id]) {
                                pagedata.exits_comment[product_id][comment_id]['createtime'] =
                                    dateFormat(parseInt(pagedata.exits_comment[product_id][comment_id]['createtime']) * 1000, "yyyy-mm-dd HH:MM:ss");
                            }
                        }
                    }
                    pagedata['hideLoading'] = true;
                    _this.setData(pagedata);

                }
            });
        });
    },
    load_image: function(e) {
        util.loadImage(this, e.currentTarget.dataset.ident, 'xs');
    },
    evt_submit: function(e) {
        var post_data = e.detail.value;
        post_data['order_id'] = this.data.order.order_id;
        if (this.data.comment_mark) {
            for (var goods_id in this.data.comment_mark) {
                post_data['comment[mark][' + goods_id + ']'] = this.data.comment_mark[goods_id];
            }
        }
        if (this.data.comment_images) {
            for (var product_id in this.data.comment_images) {
                var image_arr = this.data.comment_images[product_id];
                for (var i = 0; i < image_arr.length; i++) {
                    post_data['comment[image][' + product_id + '][' + i + ']'] = image_arr[i]['image_id'];
                }
            }
        }
        wx.showToast({
            title: "提交中",
            icon: 'loading',
            mask: true,
            duration: 10000
        });
        util.wxRequest({
            url: config.BASE_URL + '/m/comment-save.html',
            method: 'POST',
            data: post_data,
            success: function(res) {
                var res_data = res.data;
                if (res_data.success) {
                    wx.showModal({
                        title: '评论成功',
                        showCancel: false,
                        success: function(re) {
                            wx.navigateBack();
                        }
                    });
                } else {
                    wx.showModal({
                        title: '提交失败',
                        showCancel: false,
                        content: res_data.error
                    });
                }
            },
            complete: function() {
                wx.hideToast();
            }
        });
    },
    evt_selimage: function(e) {
        var product_id = e.currentTarget.dataset.productid;
        var goods_id = e.currentTarget.dataset.goodsid;
        var _this = this;
        wx.chooseImage({
            count: 5,
            sizeType: ['compressed'],
            success: function(re) {
                if (re.tempFilePaths && re.tempFilePaths.length) {
                    if (!comment_images[product_id] || !comment_images[product_id].length) {
                        comment_images[product_id] = [];
                    }
                    var upload_toast_title = (re.tempFilePaths.length + '张图片上传中');
                    wx.showToast({
                        title: upload_toast_title,
                        icon: "loading",
                        mask: true,
                        duration: 10000
                    });
                    var upload_task = function(tmp_file) {
                        util.wxUpload({
                            url: config.BASE_URL + '/m/comment-upload_image.html',
                            filePath: tmp_file,
                            name: 'comment_image',
                            success: function(res) {
                                var res_data = JSON.parse(res.data);
                                if (!res_data || res_data.error || !res_data.data) {
                                    //return;
                                }
                                var img_obj = {
                                    "tmp_file": tmp_file,
                                    "image_id": res_data.data
                                };
                                comment_images[product_id].push(img_obj);
                                _this.setData({
                                    "comment_images": comment_images
                                });
                                if (re.tempFilePaths.length) {
                                    upload_task(re.tempFilePaths.shift());
                                } else {
                                    wx.hideToast();
                                }
                            }
                        });
                    };
                    upload_task(re.tempFilePaths.shift());
                }
            }
        });
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
    evt_removeimage: function(e) {
        var product_id = e.currentTarget.dataset.productid;
        var image_id = e.currentTarget.dataset.imageid;
        comment_images[product_id] = comment_images[product_id].filter(function(item) {
            return item.image_id != image_id;
        });
        this.setData({
            "comment_images": comment_images
        });
    },
    evt_starpicker: function(e) {
        var goods_id = e.currentTarget.dataset.goodsid;
        var si = parseInt(e.currentTarget.dataset.si);
        if (si < 1) si = 1;
        if (isNaN(si) || si > 5) si = 5;
        var _set = {};
        _set['comment_mark.' + goods_id] = parseInt(si);
        this.setData(_set);
    }
});
