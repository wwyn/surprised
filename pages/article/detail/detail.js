//文章详情
const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
const WxParse = require('../../../utils/wxParse/wxParse.js');
const dateFormat = require('../../../utils/dateformat.js');
Page({
    data: {

    },
    onReady: function() {
        wx.setNavigationBarTitle({
            title:' '
        });
    },
    onLoad: function(options) {
        var _this = this;
        var article_id = options.article_id;
        util.wxRequest({
            url: config.BASE_URL + '/m/p-' + article_id + '.html',
            success: function(res) {
                var pagedata = res.data;
                pagedata.detail.indexs.pubtime = dateFormat(parseInt(pagedata.detail.indexs.pubtime)*1000,"yyyy-mm-dd HH:MM:ss");
                _this.setData(pagedata);
                WxParse.wxParse('article_content', 'html', pagedata.detail.bodys.content, _this, 15);
            },
            complete: function() {
                _this.setData({
                    hideLoading: true
                });
            }
        });
    },
    onShareAppMessage: function() {
        var the_path = '/pages/article/detail/detail?article_id=' + this.data.detail.indexs.article_id;
        the_path = util.merchantShare(the_path);
        return {
            title: this.data.title,
            path: the_path
        };
    }
});
