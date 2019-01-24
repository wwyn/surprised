// pages/invite/invite.js
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    img_url: config.BASE_URL
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {  
    var _this=this;
    this.setData({
      member_id: options.member_id
    }) 
    util.wxRequest({
      url: config.BASE_URL + '/m/invitationcode-share-' + _this.data.member_id + '.html',
      success: function (res) {
        console.log("res",res)
        _this.setData({
          avatar: res.data.member.avatar,
          name: res.data.member.name,
          mobile: res.data.member.mobile
        })
      },
      complete: function () {
        _this.setData({
          hideLoading: true
        })
      }
    })
  },
  evt_button:function(){
    var _this=this;
    util.wxRequest({
      url: config.BASE_URL + '/m/invitationcode-create-' + _this.data.member_id + '.html',
      success: function (res) {
        console.log(res)
        if (res.data.error) {
          if (res.data.data.team){
            var phone = res.data.data.team.member_name;
            var phone1 = `${phone.substr(0, 3)}****${phone.substr(7)}`;
            var str = res.data.data.team.name ? res.data.data.team.name : phone1;
            _this.setData({
              showAdd: true,
              is_teamed: true,
              shopkeeper: str,
              login_account: res.data.data.login_account
            })
          }else{
            wx.showModal({
              title: '温习提示',
              content: res.data.error ? res.data.error:'',
              showCancel:false
            })
          }
          return;
        }
        if (res.data.success == '申请成功'){
          _this.setData({
            invitation_code: res.data.data.invitation_code,
            generate_member_id: res.data.data.generate_member_id
          })
          wx.redirectTo({
            url: '../register/register?invitation_code=' + _this.data.invitation_code,
          })
        } else if (res.data.success == '绑定成功'){
          wx.showToast({
            title: '加入成功',
            duration:1500
          })
          setTimeout(function(){
            wx.switchTab({
              url: '/pages/index/index',
            })
          },1500)
        }

        
      },
      complete: function () {
        
      }
    })
  },
  closeAdd: function () {
    this.setData({
      showAdd: false
    })
  },
  load_image: function (e) {
    console.log(e)
    util.loadImage(this, e.currentTarget.dataset.ident, 'm');
  },
  can_join:function(){
    var _this=this;
    delete (app.globalData.member);
    wx.removeStorage({
      key: '_SID',
      success: function (res) {
        util.wxRequest({
          url: config.BASE_URL + '/m/invitationcode-create-' + _this.data.member_id + '.html',
          success: function (res) {
            if (res.data.error) {
              _this.setData({
                showAdd: true,
                login_account: res.data.data.login_account
              })
              return;
            }
            _this.setData({
              invitation_code: res.data.data.invitation_code,
              generate_member_id: res.data.data.generate_member_id
            })
            wx.redirectTo({
              url: '../register/register?invitation_code=' + _this.data.invitation_code,
            })
          }
        })
      },
    })
  },
  no_join:function(){
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: '鲸喜库邀您加入',
    })
  }
})