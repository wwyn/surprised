// pages/limitimepurchase/index.js
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const app = getApp();
var time = null;
// var current_page = 1;
// var loading_more = false;
const getDateTime = function(date) {
    var olt = date * 1000;
    var time = new Date(olt);
    var year = time.getFullYear();
    var month = (time.getMonth() + 1) < 10 ? '0' + (time.getMonth() + 1) : (time.getMonth() + 1);
    var day = time.getDate() < 10 ? '0' + time.getDate() : time.getDate();
    var hour = time.getHours() < 10 ? '0' + time.getHours() : time.getHours();
    var min = time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes();
    var timeVal = month + '/' + day + ' ' + hour + ':' + min; //year + '/' +
    if (olt == 0) {
        timeVal = ' '
    }
    return timeVal;
}
var load_list = function() {

    var _this = this;
    wx.showNavigationBarLoading();

    util.wxRequest({
        url: config.BASE_URL + '/m/adjustprices.html',
        success: function(res) {
            console.log(res);
            var newdata = res.data;
            var _thisdata = _this.data;
            if (newdata) {
                for (var i = 0; i < newdata.plan_tab.length; i++) {
                    newdata.plan_tab[i].carry_out_time = getDateTime(newdata.plan_tab[i].carry_out_time);
                }
                _this.setData(newdata);
                var list = {};
                for (var i = 0; i < newdata.plan_list.length; i++) {
                    list[newdata.plan_list[i].plan_id] = newdata.plan_list[i]
                }
                _this.setData({
                    activity_list: list,
                    currentid: newdata.plan_tab[0].plan_id
                });
                _this.countdown();
            }
        },
        fail: function(re) {
            console.info(re);
        },
        complete: function(e) {
            // wx.hideToast();
            wx.hideNavigationBarLoading();
            _this.setData({
                hideLoading: true
            });
        }
    });
};
const count_down = function() {
    clearInterval(time);
    var that = this;
    var timestamp = Date.parse(new Date());
    timestamp = timestamp / 1000;
    that.setData({
        timestamp: timestamp
    })
    var intDiff
    if (that.data.activity_list[that.data.currentid].carry_out_time > timestamp) {
        intDiff = that.data.activity_list[that.data.currentid].carry_out_time - timestamp;

    } else if (that.data.activity_list[that.data.currentid].rollback_time - timestamp > 0 && that.data.activity_list[that.data.currentid].carry_out_time < timestamp) {
        intDiff = that.data.activity_list[that.data.currentid].rollback_time - timestamp;
    }
    time = setInterval(function() {
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
            clearInterval(time);
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
    }, 1000)
}
Page({

    /**
     * 页面的初始数据
     */
    data: {
        currentid: ''
    },
    onShareAppMessage: function() {
        let the_path = '/pages/limitimepurchase/index';
        the_path = util.merchantShare(the_path);
        return {
            title:'限时抢购',
            path: the_path
        }
    },
    evt_chooseTag: function(e) {
        var id = e.currentTarget.dataset.id;
        this.setData({
            currentid: id
        })
        this.countdown();
    },
    countdown: function() {
        var _this = this;
        count_down.call(this);
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        load_list.call(this);
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '限时抢购'
        });
    },
    load_image: function(e) {
        util.loadImage(this, e.currentTarget.dataset.ident, 'xs');
    },
    load_image_m: function(e) {
        util.loadImage(this, e.currentTarget.dataset.ident, 'm');
    }
})
