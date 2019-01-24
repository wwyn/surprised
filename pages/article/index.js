//文章列表页
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
var current_page = 1;
var loading_more = false;
var load_list = function(page) {
    loading_more = true;
    var _this = this;
    var query_str_arr = [];
    //wx.showNavigationBarLoading();
    page = page ? page : current_page;
    util.wxRequest({
        url: config.BASE_URL + '/m/n-index-default-' + page + '.html',
        success: function(res) {
            var newdata = res.data;
            var _thisdata = _this.data;
            for (let i = 0; i < newdata.alist.length; i++) {
                newdata.alist[i].body && newdata.alist[i].body.content &&delete(newdata.alist[i].body.content);
            }
            if (newdata) {
                if (_thisdata.alist && page > 1) {
                    newdata.alist = _thisdata.alist.concat(newdata.alist);
                }
                if (!newdata.alist || !newdata.alist.length) {
                    newdata.empty_list = 'YES';
                } else {
                    newdata.empty_list = 'NO';
                }
                _this.setData(newdata);
                if(_thisdata.path){
                    var path = _thisdata.path.pop();
                    wx.setNavigationBarTitle({
                        title: path['title']
                    });
                }
            }
        },
        fail: function(re) {
            console.info(re);
        },
        complete: function(e) {
            // wx.hideToast();
            //wx.hideNavigationBarLoading();
            wx.stopPullDownRefresh();
            _this.setData({
                hideLoading: true
            });
            loading_more = false;
        }
    });
    current_page = page;
};

Page({
    data: {
        node_id: 1,
    },
    onPullDownRefresh: function() {

        load_list.call(this, 1);
    },
    onReachBottom: function() {
        if (loading_more || this.data.alist_pager.total == this.data.alist_pager.current) {
            return;
        }
        current_page += 1;
        load_list.call(this, current_page);
    },
    onReady: function() {
        var _this = this;
        wx.getSystemInfo({
            success: function(res) {
                _this.setData({
                    auto_height:res.windowWidth*0.4,
                    sv_height:res.windowHeight
                    // fp_height:res.windowHeight - 30
                });
            }
        });
    },
    onLoad: function(options) {
        var _this = this;
        load_list.apply(this, [1]);
    },
    onShareAppMessage: function() {
        var the_path = '/pages/article/index?node_id=' + this.data.node_id;
        the_path = util.merchantShare(the_path);
        return {
            title: this.data.title,
            path: the_path
        };
    },
    load_image_m: function(e) {
        var image_id = e.currentTarget.dataset.ident;
        util.loadImage(this,image_id,'m');
    }
});
