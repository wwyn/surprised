// pages/member/myteam/index.js
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const app = getApp();
var current_page = 1;
var loading_more = false;
var load_list = function (page) {
  loading_more = true;
  var _this = this;
  var page = page ? page : 1;
  util.wxRequest({
    url: config.BASE_URL + '/m/my-group-' + page + '.html',
    success: function (res) {
      var newdata = res.data;
      var _thisdata = _this.data;
      if (newdata) {
        if (page > 1 && _thisdata.group_list) {
          newdata.group_list = _thisdata.group_list.concat(newdata.group_list);
        }
        if (!newdata.group_list || !newdata.group_list.length) {
          newdata.empty_list = 'YES';
        } else {
          newdata.empty_list = 'NO';
        }
        _this.setData(newdata);
      }
    },
    complete: function () {
      _this.setData({ hideLoading: true });
      loading_more = false;
    }
  });
};
Page({

  /**
   * 页面的初始数据
   */
  data: {
    img_url: config.BASE_HOST
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var _this = this;
    this.setData(options);
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          sv_height: res.windowHeight - 47,
        });
      }
    });
    util.wxRequest({
      url: config.BASE_URL + '/m/my.html',
      success: function (res) {
        _this.setData({
          member: res.data.member
        })
      },
      complete:function(){
          _this.setData({
            hideLoading:true
          })
      }
    })
    current_page = 1;
    this.setData({
      current_page: current_page ? current_page : 1
    })
    util.checkMember.call(this, function () {
      load_list.call(_this, current_page);
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: '邀请返利',
    })
  },
  invite_more: function () {
    this.setData({
      showAdd: true
    })
  },
  closeAdd: function () {
    this.setData({
      showAdd: false
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    var _this = this;
    var phone = this.data.member.login_account;
    var phone1 = `${phone.substr(0, 3)}****${phone.substr(7)}`;
    var str = this.data.member.name ? this.data.member.name : phone1;
    return {
      title: `${str}邀请你加入鲸喜库代购`,
      imageUrl: _this.data.img_url + '/public/wechat/active/invite.png',
      path: '/pages/invite/invite?member_id=' + _this.data.member.member_id
    }

  }
})