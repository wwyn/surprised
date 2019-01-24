const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
const app = getApp();


Page({
    data:{
        img_url: config.BASE_HOST,
        themecolor: app.globalData.themecolor
    },
    onLoad: function(options) {
        let _this = this;
        if (options) {
            _this.setData(options);
        }
    },
    onShow: function() {
        let _this = this;
        util.checkMember.call(this, function(member) {
            util.wxRequest({
                url: config.BASE_URL + '/m/my-receiver.html',
                success: function(res) {
                    var pagedata = res.data;
                    for(var i in pagedata.list){
                        pagedata.list[i]['area_format'] = util.formatArea(pagedata.list[i]['area']);
                    }
                    _this.setData(pagedata);
                    if(!pagedata.list){
                        wx.setStorageSync('member_addr_selected', {
                            'member_id': _this.data.member.member_id,
                            'addr_id': null
                        });
                        //获取页面栈
                        var pages = getCurrentPages();
                        if(pages.length > 1){
                            //上一个页面实例对象
                            var prePage = pages[pages.length - 2];
                            //关键在这里
                            prePage.refreash_maddr();
                        }
                    }else{
                        if(_this.data.select&&_this.data.removed_id==_this.data.select){
                            _this.setData({
                                select: _this.data.list[0].addr_id
                            });
                            wx.setStorageSync('member_addr_selected', {
                                'member_id': _this.data.member.member_id,
                                'addr_id': _this.data.list[0].addr_id
                            });
                        }
                    }
                },
                complete:function(){
                    _this.setData({
                        hideLoading: true
                    });
                }
            });
        });
    },
    evt_setdefault: function(e) {
        var _this = this;
        var addr_id = e.currentTarget.dataset.addrid;
        if (!addr_id) return;
        wx.showLoading({
            title:'加载中..'
        })
        util.wxRequest({
            url: config.BASE_URL + '/m/my-receiver-set_default-' + addr_id + '.html',
            success: function(res) {
                for (var i = 0; i < _this.data.list.length; i++) {
                    if (_this.data.list[i].addr_id == addr_id) {
                        _this.data.list[i].is_default = 'true';
                    } else {
                        _this.data.list[i].is_default = 'false';
                    }

                }
                _this.setData({
                    'list': _this.data.list
                });
            },
            complete:function(){
                wx.hideLoading();
            }
        });
    },
    evt_empty: function(e) {
        //空事件处理
    },
    evt_navigateback: function(e) {
        var _this = this;
        var addr_id = e.currentTarget.dataset.addrid;
        if (!addr_id) return;
        wx.setStorageSync('member_addr_selected', {
            'member_id': _this.data.member.member_id,
            'addr_id': addr_id
        });
        wx.navigateBack();
    },
    evt_editaddr: function(e) {
        var addr_id = e.currentTarget.dataset.addrid;
        wx.navigateTo({
            url: '/pages/member/addr/edit/edit?addrid=' + addr_id
        });
    },
    evt_removeaddr: function(e) {
        let _this = this;
        let addr_id = e.currentTarget.dataset.addrid;
        wx.showModal({
            title: '删除收货地址',
            content: '确认删除？',
            confirmColor:_this.data.themecolor.price_text,
            success: function(res) {
                if (res.confirm) {
                    // wx.showLoading({
                    //     title:'加载中..'
                    // })
                    util.wxRequest({
                        url: config.BASE_URL + '/m/my-receiver-delete-' + addr_id + '.html',
                        success: function(res) {
                            if (res.data.success||res.data.result=='success') {
                                _this.setData({
                                    removed_id:addr_id
                                });
                                _this.onShow.call(_this);
                            }
                        }
                    });
                }
            }
        });
    },
    onPullDownRefresh:function(){
        this.onShow();
    }
});
