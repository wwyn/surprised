// pages/brand/brand.js
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const app = getApp();
var loading_more = false;
var load_list = function (page) {
  loading_more = true;
  var _this = this;
  var page = page ? page : 1;
  _this.setData({
    current_time: Date.parse(new Date())
  })
  util.wxRequest({
    url: config.BASE_URL + '/m/activity.html?merchant_id='+_this.data.merchant_id+'&page=' + page + '&type=' + _this.data.indextype,
    success: function (res) {
      var newdata = res.data;
      var _thisdata = _this.data;
      if (newdata) {
        if (_thisdata.data_list && page > 1) {
          newdata.data_list = _thisdata.data_list.concat(newdata.data_list);
          //var obj = Object.assign(_thisdata.data_list, newdata.data_list);
        }
        if (!newdata.data_list || !newdata.data_list.length) {
          newdata.empty_list = 'YES';
        } else {
          newdata.empty_list = 'NO';
        }
        _this.setData(newdata);
      }
    },
    complete: function () {
      wx.stopPullDownRefresh();
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
    indextype: 'hot',
    current_page: 1,
    img_url:config.BASE_HOST,
    quantityVal:'0.00'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    if (wx.getStorageSync('addprice')) {
      this.setData({
        quantityVal: wx.getStorageSync('addprice')
      })
    }
    this.setData({
      merchant_id: options.merchant_id
    })
    load_list.call(this);
  },
  onReady:function(){
    let _this = this;
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          sv_width: res.windowWidth,
          sv_height: res.windowHeight,
        });
      }
    });
  },
  evt_link_search: function () {
    wx.navigateTo({
      url: '/pages/search/search',
    })
  },
  evt_link_event: function (e) {
    let id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/event/event?activity_id=' + id,
    })
  },
  copyTBL: function (e) {
    let item = e.currentTarget.dataset.item;
    wx.setClipboardData({
      data: item,
      success: function (res) {
        wx.showToast({
          title: '复制成功！',
        })
      }
    });
  },
  go_cart: function () {
    wx.switchTab({
      url: '/pages/cart/cart',
    })
  },
  changeType: function (e) {
    let type = e.currentTarget.dataset.type;
    this.setData({
      data_list:[],
      indextype: type,
      current_page: 1
    })
    load_list.call(this, this.data.current_page);
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
  //触底事件
  onReachBottom: function () {
    if (loading_more || this.data.pager.total == this.data.pager.current) {
      return;
    }
    this.setData({
      current_page: this.data.current_page + 1
    })
    load_list.call(this, this.data.current_page);
  },
  //加载图片
  load_image: function (e) {
    util.loadImage(this, e.currentTarget.dataset.ident, 's');
  },
  onPullDownRefresh: function () {
    this.setData({
      current_page:1
    })
    load_list.call(this,1);
  },
  evt_previewimage: function (e) {
    let _this = this;
    var image_id = e.currentTarget.dataset.ident;
    var imgs = e.currentTarget.dataset.imgs;
    var index = e.currentTarget.dataset.index;
    var images = this.data.images;
    var arr = [];
    for (let i = 0; i < imgs.length; i++) {
      arr.push(imgs[i].image_id)
    }
    if (_this.data.image_l && _this.data.image_l[image_id]) {
      let urls = [];
      for (let i = 0; i < imgs.length; i++) {
        urls.push(_this.data.image_l[imgs[i].image_id])
      }
      wx.previewImage({
        urls: urls,
        current: _this.data.image_l[image_id]
      });
      return;
    }
    util.getImg(arr, 'l', function (res) {

      wx.previewImage({
        urls: res,
        current: res[index]
      });
      let image_l = {};
      for (var j = 0; j < arr.length; j++) {
        image_l[arr[j]] = res[j]
      }
      _this.data.image_l ? (image_l = Object.assign({}, image_l, _this.data.image_l)) : (image_l = image_l);
      console.log(image_l);
      _this.setData({
        image_l: image_l
      });
    })

  },
  evt_active_image: function (e) {
    let _this = this;
    wx.setStorageSync('addprice', _this.data.quantityVal ? _this.data.quantityVal : 0);
    let url = config.BASE_HOST + '/m/share-index.html?activity_id=' + _this.data.addid + '&add=' + (_this.data.quantityVal ? _this.data.quantityVal : 0) + '&date=' + (_this.data.addtime ? _this.data.addtime:0);
    console.log(url);
    let imgUrl = 'https://jxk.linlangec.com' + '/pageres?url=' + encodeURIComponent(url) + '&size=' + 375 + 'x375' +'&add=' + (_this.data.quantityVal ? _this.data.quantityVal:0);
    this.setData({
      showactiveImg: true,
      imgUrl: imgUrl,
      addshow:false
    })
  },
  //加价框
  showAdd: function (e) {
    let id = e.currentTarget.dataset.id;
    let date = e.currentTarget.dataset.time;
    this.setData({
      addshow: true,
      addid:id,
      addtime:date
    })
  },
  closeAdd: function (e) {
    this.setData({
      addshow: false,
    })
  },
  evt_quantityval: function (e) {
    this.setData({
      quantityVal: e.detail.value
    });
  },
  tappqminus: function (e) {
    let num = Number(this.data.quantityVal) - 1;
    num = parseFloat(num).toFixed(2);
    this.setData({
      quantityVal: num
    });
  },
  tappqplus: function (e) {
    let num = Number(this.data.quantityVal) + 1;
    num = parseFloat(num).toFixed(2);
    this.setData({
      quantityVal:num
    });
  },
  evt_focus: function () {
    if (this.data.quantityVal == 0) {
      this.setData({
        quantityVal: ""
      })
    }
  }
})