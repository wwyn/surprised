// pages/member/information/information.js
const config = require('../../../config/config.js');
const util = require('../../../utils/util.js');
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
    var _this = this;
    util.checkMember.call(this, function () {
      util.wxRequest({
        url: config.BASE_URL + '/m/my-setting.html',
        success: function (res) {
          var pagedata = res.data;
          var id = pagedata.member.member_id;
          if(id>99999){
            id=id;
          }else if(id>9999&&id<100000){
             id="0"+id;
          } else if (id > 999 && id < 10000) {
            id = "00" + id;
          } else if (id > 99 && id < 1000) {
            id = "000" + id;
          } else if (id > 9 && id < 100) {
            id = "0000" + id;
          } else{
            id = "00000" + id;
          }
          if (_this.data.member && pagedata.member) {
            for (var k in _this.data.member) {
              console.log(_this.data.member[k])
              pagedata.member[k] = _this.data.member[k];
            }
          }
          _this.setData({ pagedata, update_name:true,id:id });
        },
        complete: function () {
          wx.stopPullDownRefresh();
          _this.setData({
            hideLoading: true
          });
        }
      });

      if (_this.data.version == 'home') {
        //线下活动报名预约在会员中心首页展示
        util.wxRequest({
          url: config.BASE_URL + '/m/customer-schedule_order.html',
          success: function (res) {
            //console.log(res);
            _this.setData({ sysinfo: wx.getSystemInfoSync() });
            _this.setData(res.data);
          },
          fail: function (re) {
            console.info(re);
          },
          complete: function () {
          
          }
        });
      }
    });
  },
  update_name:function(){
    this.setData({
      update_name:false
    })
  },
  up_name:function(e){
    console.log(e.detail.value)
    this.setData({
      name: e.detail.value
    })
  },
  // 失去焦点
  e_bindblur:function(){
    this.setData({
      update_name:true,
      'pagedata.member.name': this.data.name
    })
  },
  // 上传头像
  load_image: function (e) {
    util.loadImage(this, e.currentTarget.dataset.ident, 'm');
  },
  evt_chgavatar: function (e) {
    var _this = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePaths = res.tempFilePaths;
        if (!tempFilePaths[0]) {
          return;
        }
        wx.showToast({
          icon: 'loading',
          mask: true,
          content: '上传中',
          duration: 50000
        });
        util.wxUpload({
          url: config.BASE_URL + '/m/imagemanage-wx_upload.html',
          filePath: tempFilePaths[0],
          name: 'file',
          success: function (res) {
            console.log("res",res)
            if (res.data == '') {
              wx.showModal({
                title: '上传失败',
                content: '图片上传失败,请重试',
                showCancel: false
              })
              return;
            };
            var data = JSON.parse(res.data);
            var image_id = data.image_id;
            console.log(image_id)
            _this.setData({
              'pagedata.member.avatar': image_id
            });
          },
          complete: function (e) {
            // wx.hideToast();
            util.wxRequest({
              url: config.BASE_URL + '/m/my.html',
              success: function (res) {
                console.log(res)}})
            wx.hideToast();
          }
        })
      }
    });
  },
  evt_update: function (e) {
    var _this=this;
    console.info(e);
    console.log(this.data.pagedata.member.avatar)
    var form_params = {
      avatar: _this.data.pagedata.member.avatar,
      'contact[name]':_this.data.name
    };

    for (let k in form_params) {
      if (!(form_params[k])) {
        delete (form_params[k]);
      }
    }
    console.info(form_params);
    wx.showToast({
      icon: 'loading',
      mask: true,
      content: '保存中',
      duration: 50000
    });
    util.wxRequest({
      url: config.BASE_URL + '/m/my-save_setting.html',
      method: 'POST',
      data: form_params,
      success: function (res) {
        let resdata = res.data;
        if (resdata.success) {
          wx.showModal({
            title: '保存成功',
            content: '个人信息保存成功',
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                wx.setStorage({
                  key: 'reload_member_info',
                  data: 'true',
                  complete: function () {
                    wx.navigateBack();
                  }
                });

              }
            }
          });
        }
      },
      complete: function () {
        wx.hideToast();
      }
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: '个人信息',
    })
  },
  // 退出当前账号
  logout:function(){
    delete(app.globalData.member);
    wx.removeStorage({
      key: '_SID',
      success: function(res) {
        wx.reLaunch({
          url: '/pages/index/index',
        })
      },
    })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    let options={};
    this.onLoad(options)
  }
})