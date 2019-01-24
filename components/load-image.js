// components/download-image.js
const util = require('../utils/util.js');
const config = require('../config/config');
const zoom_drawimage = function (o_w, o_h, m_w, m_h) {
  if (o_w > m_w) {
    let scaling = 1 - (o_w - m_w) / o_w;
    o_w = o_w * scaling;
    o_h = o_h * scaling;
  }
  if (o_h > m_h) {
    let scaling = 1 - (o_h - m_h) / o_h;
    o_w = o_w * scaling;
    o_h = o_h * scaling;
  }
  return {
    w: o_w,
    h: o_h
  };
};
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    imgUrl: { // 属性名
      type: String, // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
      value: '', // 属性初始值（可选），如果未指定则会根据类型选择一个
      observer: function (newVal, oldVal) {
        console.log(newVal);
        // var str = 'https://jxk.v1.wdwdwd.com/pageres?url=https%3A%2F%2Fjxktest.v1.wdwdwd.com%2Fm%2Fshare-forward.html%3Fproduct_id%3D739%26type%3Dtwo%26fee%3D1500.00%26add%3D1&size=375x375';
        // this.setData({
        //   imgUrl:str
        // })
        //this.m_size(newVal);
      } // 属性被改变时执行的函数（可选），也可以写成在methods段中定义的方法名字符串, 如：'_myPrivateMethod'
    },
    showImg: {
      type: Boolean,
      value: false,
      observer: function (newVal, oldVal) {

      }
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    img_url: config.BASE_HOST
  },

  /**
   * 组件的方法列表
   */
  methods: {
    m_size: function (img) {
      let _this = this;
      var win_width = _this.data.sv_width;
      var win_height = _this.data.sv_height;
      var canvas_max_width = win_width - 30;
      var canvas_max_height = win_height * 0.9;
      wx.getImageInfo({
        src: img,
        success: function (img_data) {
          if (!img_data) {
            return;
          }
          var img_size = zoom_drawimage(img_data.width, img_data.height, canvas_max_width - 10 * 2, canvas_max_height * 0.9 - 10 * 2);
          var img_rect_w = Math.round(img_size.w + 10 * 2);
          var img_rect_h = Math.round(img_size.h + 10 * 2);
          _this.setData({
            ctx_img_rect_w: img_rect_w,
            ctx_img_rect_h: img_rect_h,
          });
        }
      })
    },
    preview_img: function (e) {
      let img = e.currentTarget.dataset.img;
      wx.previewImage({
        urls: [img]
      });
    },
    evt_close: function () {
      this.setData({
        showImg: false
      })
    },
    evt_download: function () {
      let _this = this;
      var imgSrc = this.data.imgUrl;
      wx.downloadFile({
        url: imgSrc,
        success: function (res) {
          console.log(res);
          //图片保存到本地
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: function (data) {
              // wx.showToast({
              //   title: '保存成功',
              //   icon: 'success',
              //   duration: 2000,
              //   success: function () {
              //     _this.setData({
              //       showImg: false
              //     })
              //   }
              // })
              _this.setData({
                showImg: false
              })
              wx.showModal({
                title: '已经保存图片到相册',
                content: '你可以把相册的图片分享给好友哦～',
                confirmText:'知道了',
                showCancel:false,
                confirmColor:'#FC4773'
              })

            },
            fail: function (err) {
              console.log(err);
              if (err.errMsg === "saveImageToPhotosAlbum:fail auth deny") {
                console.log("当初用户拒绝，再次发起授权")
                wx.openSetting({
                  success(settingdata) {
                    console.log(settingdata)
                    if (settingdata.authSetting['scope.writePhotosAlbum']) {
                      console.log('获取权限成功，给出再次点击图片保存到相册的提示。')
                    } else {
                      console.log('获取权限失败，给出不给权限就无法正常使用的提示')
                    }
                  }
                })
              }
            },
            complete(res) {
              console.log(res);
            }
          })
        }
      })
    }
  },
  ready() {
    let _this = this;
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          sv_width: res.windowWidth,
          sv_height: res.windowHeight,
        });
      }
    });
  }
})
