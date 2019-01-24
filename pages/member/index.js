const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    img_url: config.BASE_URL,
    isShow: false
  },
  // 点击详情展示
  showDetails: function() {
    this.setData({
      isShow: true
    })
  },
  // 点击确认关闭
  affirmDetails: function() {
    this.setData({
      isShow: false
    })
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: '我的',
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.debugmode_tap_count = 1;
    var _this = this;
    // wx.getStorage({
    //   key: 'reload_member_info',
    //   success: function (res) {
    //     if (res.data == 'true') {
    //       app.globalData.member = null; //清空会员数据缓存
    //       _this.onLoad.call(this);
    //       wx.removeStorage({
    //         key: 'reload_member_info'
    //       });
    //     }
    //   }
    // });
    var _this = this;
    util.checkMember.call(this, function () {
      util.wxRequest({
        url: config.BASE_URL + '/m/my.html',
        success: function (res) {
          console.log(res)
          var pagedata = res.data;
          console.log(_this.data)
          if (_this.data.member && pagedata.member) {
            for (var k in _this.data.member) {
              pagedata.member[k] = _this.data.member[k];
            }
          }
          _this.setData({
            pagedata,
            amount1: res.data.today_data,
            amount2: res.data.week_data,
            amount3: res.data.month_data
          });
        },
        complete: function () {
          wx.stopPullDownRefresh();
          wx.removeStorage({
            key: 'reload_member_info'
          });
          _this.setData({
            hideLoading: true
          });
        }
      });
    });
  },
  load_image: function (e) {
    console.log(e)
    util.loadImage(this, e.currentTarget.dataset.ident, 'm');
  },
  evt_update: function (e) {
    console.info(e);
    var form_params = e.detail.value;

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
  // 扫码
  evt_scan:function(){
    var _this=this;
    wx.scanCode({
       success: function(res){
        // console.log("扫码",res.result)      
         util.wxRequest({
           url: config.BASE_URL + '/m/my-logistics_order-' + res.result +'.html',
           success: function (res) {
             console.log(res)
             if(res.data.error){
                wx.showModal({
                  title: '扫码失败',
                  content: res.data.error||"未知单号",
                  showCancel:false
                })
                return;
             }
             wx.navigateTo({
               url: '/pages/member/logistics/tracker/index?order_id=' + res.data.order_id,
             })
           },
           complete: function () {
             
           }
         });
       },
       fail: function(res){ 
        //  wx.showModal({
        //    title: '扫码失败',
        //    content:"未知码",
        //    showCancel: false
        //  })
       }, 
       complete: function(res){ 

       } 
      })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var options={};
    this.onShow(options)
  }
})