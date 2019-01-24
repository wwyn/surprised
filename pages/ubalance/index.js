const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const dateformat = require('../../utils/dateformat.js');
var current_page = 1;
var loading_more = false;
var load_list = function(page) {
    loading_more = true;
    var _this = this;
    var page = page ? page : 1;
    util.wxRequest({
        url: config.BASE_URL + '/m/ubalance-index-'+(_this.data.type||'all')+'-'+page+'.html',
        success: function(res) {
          console.log(res)
            var newdata = res.data;
            for (let i = 0; i < newdata.record_list.length; i++) {
                newdata.record_list[i]['opt_time'] =
                dateformat(parseInt(newdata.record_list[i]['opt_time'])*1000,"yyyy-mm-dd HH:MM:ss");
            }
            var _thisdata = _this.data;
            if (newdata) {
                if (_thisdata.record_list && page > 1) {
                    newdata.record_list = _thisdata.record_list.concat(newdata.record_list);
                }
                if (!newdata.record_list || !newdata.record_list.length) {
                    newdata.empty_list = 'YES';
                } else {
                    newdata.empty_list = 'NO';
                }
                _this.setData(newdata);
            }
        },
        complete:function(){
            wx.stopPullDownRefresh();
            loading_more = false;
            _this.setData({
                hideLoading:true
            });
            wx.hideToast();
            wx.setNavigationBarTitle({
                title: _this.data.data.name
            });
        }
    });
};
Page({
    data:{
      img_url:config.BASE_HOST
    },
    onReady: function() {
        var _this  = this;
        wx.getSystemInfo({
            success: function(res) {
                _this.setData({
                    sv_height: res.windowHeight - (71+34+46),
                });
            }
        });
    },
    onPullDownRefresh: function() {
        this.onLoad.call(this);
    },
    onShow:function(){
        var _this = this;
        //wx.showNavigationBarLoading();
        util.checkMember.call(this, function() {
            load_list.call(_this, current_page = 1);
        });
    },
    onLoad: function(options) {

    },
    onReachBottom: function(e) {
        if (loading_more || this.data.pager.total == this.data.pager.current) {
            return;
        }
        current_page += 1;
        load_list.call(this, current_page);
    },
    evt_chgtab:function(e){
        console.info(e.currentTarget.dataset.type);
        this.setData({
            type:e.currentTarget.dataset.type,
            showFilter: false
        });
        wx.showToast({
            title:'加载中',
            icon:'loading',
            mask:true,
            duration:10000
        });
        load_list.call(this, current_page = 1);
    },
    evt_goto:function(e){
        wx.navigateTo({
            url:e.currentTarget.dataset.url
        });
    },
    closeFilter:function(){
      this.setData({
        showFilter: false
      })
    },
    evt_showfilter:function(){
      this.setData({
          showFilter:true
      })
    }
});
