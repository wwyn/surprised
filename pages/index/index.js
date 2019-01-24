// pages/brand/brand.js
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const app = getApp();
var loading_more = false;
const mul_height = function(){
    let _this = this;
    const query = wx.createSelectorQuery();
    let _height = 200 / 750 * _this.data.sv_width;
    console.log(_height);
    query.selectAll('.active-desc_text').boundingClientRect().exec(function (res) {
      console.log(res, '#############');
      let data_list = _this.data.data_list;
      for(var i=0;i<res[0].length;i++){
        if (res[0][i].height > _height) {
            console.log(11111111111);
            data_list[i]['display'] = 'open';
        }
      }
      _this.setData({
        data_list:data_list
      })
    })
  
  // query.select('.active_desc').boundingClientRect(function (rect) {
  //   // console.log(rect.width)
  //   that.setData({
  //     height: rect.width + 'px'
  //   })
  // }).exec();
}
var load_list = function (page) {
  loading_more = true;
  var _this = this;
  var page = page ? page : 1;
  _this.setData({
    current_time: Date.parse(new Date())
  })
  util.wxRequest({
    url: config.BASE_URL + '/m/activity.html?page=' + page + '&type=' + _this.data.indextype,
    success: function (res) {
      var newdata = res.data;
      // console.log(parseInt(res.data.data_list[0].description.length/22))
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
        _this.setData(newdata,function(){
          mul_height.call(_this);
        });
        //计算高度
        
      }
    },
    complete: function () {
      wx.stopPullDownRefresh();
      wx.hideLoading();
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
    items: [{
      "type": "xcxpage",
      "url": {
        "url": "\/pages\/index\/page\/page?s=test",
        "openType": "navigate"
      },
      "image": {
        "src": "https:\/\/image.vmcshop.com\/af\/20\/2afb5d40f92c.jpg!m?13039_OW1200_OH562",
        "mode": "widthFix",
        "percent": "normal",
        "width": 470,
        "height": 220
      },
      "h5url": "\/m\/index-index-test.html"
    }],
    indextype:'hot',
    current_page: 1,
    img_url:config.BASE_HOST,
    height:70
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    load_list.call(this);
  },
  onPullDownRefresh: function () {
    this.setData({
      current_page: 1
    })
    load_list.call(this, 1);
  },
  evt_link_search:function(){
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
  see_more:function(e){
    let index = e.currentTarget.dataset.index;
    let data_list = this.data.data_list;
    data_list[index].display = 'close';
    console.log(index)
    this.setData({
      //index1:index,
      data_list:data_list
    })
  },
  close_more: function (e) {
    let index = e.currentTarget.dataset.index;
    let data_list = this.data.data_list;
    data_list[index].display = 'open';
    console.log(index)
    this.setData({
      //index1: index,
      data_list: data_list
    })
  },
  changeType:function(e){
      let type = e.currentTarget.dataset.type;
      this.setData({
        data_list:[],
        pager:{},
        indextype:type,
        current_page:1
      })
      load_list.call(this,this.data.current_page);
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
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

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
  //触底事件
  onReachBottom:function(){
    if (loading_more || this.data.pager.total == this.data.pager.current) {
      return;
    }
    this.setData({
      current_page: this.data.current_page+1
    })
    load_list.call(this, this.data.current_page);
  },
  //加载图片
  load_image: function (e) {
    util.loadImage(this, e.currentTarget.dataset.ident, 's');
  },
  load_image_l:function(e){
    util.loadImage(this, e.currentTarget.dataset.ident, 'l');
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
    if (_this.data.image_l&&_this.data.image_l[image_id]){
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
    util.getImg(arr,'l',function(res){
      
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
    
  }
})