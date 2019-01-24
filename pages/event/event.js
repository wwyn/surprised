// pages/brandevent/brandevent.js

const config = require('../../config/config.js');
const util = require('../../utils/util.js');
var loading_more = false;
var load_list = function (page) {
  loading_more = true;
  var _this = this;
  var page = page ? page : 1;
  _this.setData({
    current_time: Date.parse(new Date())
  })
  // wx.showLoading({
  //   title: '加载中',
  // })
  util.wxRequest({
    url: config.BASE_URL + '/m/activity-item_goods-' + _this.data.activity.activity_id +'.html?page=' + page ,
    success: function (res) {
      var newdata = res.data;
      var _thisdata = _this.data;
      if (newdata) {
        //校验是否收藏
        if (newdata.data_list){
          check_fav.call(_this, newdata.data_list);
        }
        
        if (_thisdata.data_list && page > 1) {
                  for (var i = 0; i < newdata.data_list.length; i++) {
                    var str = '';
                    str += ('商品名称：' + newdata.data_list[i].product.name + '\n');
                    str += ('购买价格：￥' + parseFloat(Number(newdata.data_list[i].product.buy_price) + Number(newdata.data_list[i].product.purchase_fee)).toFixed(2) + '\n');
                    str += ('编号：' + newdata.data_list[i].gid + '\n');
                    if (newdata.data_list[i].spec_desc&&newdata.data_list[i].spec_desc.t && newdata.data_list[i].spec_desc.t.length > 0) {
                      for (var j = 0; j < newdata.data_list[i].spec_desc.t; j++) {
                        str += (newdata.data_list[i].spec_desc.t[j] + ':');
                        for (var k = 0; k < newdata.data_list[i].spec_desc.v[j].length; k++) {
                          str += newdata.data_list[i].spec_desc.v[j][k].label;
                          if (k != newdata.data_list[i].spec_desc.v[j].length - 1) {
                            str += '/'
                          }
                        }
                        str += '\n';
                        console.log(str);
                      }
                    }
                    newdata.data_list[i]['total_price'] = parseFloat(Number(newdata.data_list[i].product.buy_price) + Number(newdata.data_list[i].product.purchase_fee)).toFixed(2);
                    newdata.data_list[i]['desc'] = str;
                  }
                  newdata.data_list = _thisdata.data_list.concat(newdata.data_list);
                } else if (page == 1) {
                  for (var i = 0; i < newdata.data_list.length; i++) {
                    var str = '';
                    str += ('商品名称：' + newdata.data_list[i].product.name + '\n');
                    str += ('购买价格：￥' + parseFloat(Number(newdata.data_list[i].product.buy_price) + Number(newdata.data_list[i].product.purchase_fee)).toFixed(2) + '\n');
                    str += ('编号：' + newdata.data_list[i].gid + '\n');

                    if (newdata.data_list[i].spec_desc&&newdata.data_list[i].spec_desc.t && newdata.data_list[i].spec_desc.t.length > 0) {
                      console.log(newdata.data_list[i].spec_desc);
                      for (var j = 0; j < newdata.data_list[i].spec_desc.t.length; j++) {
                        str += (newdata.data_list[i].spec_desc.t[j] + ':');
                        for (var k = 0; k < newdata.data_list[i].spec_desc.v[j].length; k++) {
                          str += newdata.data_list[i].spec_desc.v[j][k].label;
                          if (k != newdata.data_list[i].spec_desc.v[j].length - 1) {
                            str += '/'
                          }
                        }
                        str += '\n';
                        console.log(str);
                      }
                    }
                    newdata.data_list[i]['total_price'] = parseFloat(Number(newdata.data_list[i].product.buy_price) + Number(newdata.data_list[i].product.purchase_fee)).toFixed(2);
                    newdata.data_list[i]['desc'] = str;
                    console.log(str);
                  }
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
      _this.setData({ hideLoading: true });
      loading_more = false;
      wx.hideLoading();
    }
  });
};

const check_fav = function (arr) {
  let _this = this;
  //let arr = _this.data.data_list;
  if (!arr) return;
  let gids = [];
  arr.map(function (item, key, ary) {
    gids.push('goods_id[]=' + item.goods_id);
  });
  let member_id = wx.getStorageSync('currentMemberId');
  util.checkMember.call(_this, function () {
    util.wxRequest({
      url: config.BASE_URL + '/openapi/goods/check_favs/?' + gids.join('&') + '&member_id=' + member_id,
      success: function (res) {

        if (res.data.result == 'success') {
          let favs = _this.data.favs || {};
          Object.assign(favs, res.data.data)
          _this.setData({
            favs: favs
          })
          console.log(_this.data.favs);
        }
      }
    })
  })
}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    img_url: config.BASE_HOST,
    current_page:1,
    quantityVal:'0.00',
    data_detail:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;
    _this.setData({
      current_time: Date.parse(new Date())
    })
    if (wx.getStorageSync('addprice')){
        _this.setData({
            quantityVal: wx.getStorageSync('addprice')
        })
    }
    util.wxRequest({
      url: config.BASE_URL + '/m/activity-item-' + options.activity_id+'.html',
      success: function (res) {
        if(res.data.error){
          wx.showModal({
            title:'温馨提示',
            content:res.data.error,
            showCancel:false,
            success:function(){
              wx.navigateBack({
                
              })
            }
          })
          return;
        }
        var newdata = res.data;
        var _thisdata = _this.data;
        if (newdata) {
          //校验是否收藏
          check_fav.call(_this, newdata.data_list);
          // if (_thisdata.data_list && page > 1) {
          //   newdata.data_list = _thisdata.data_list.concat(newdata.data_list);
          //   //var obj = Object.assign(_thisdata.data_list, newdata.data_list);
          // }
          if (!newdata.data_list || !newdata.data_list.length) {
            newdata.empty_list = 'YES';
          } else {
            newdata.empty_list = 'NO';
            for (var i = 0; i < newdata.data_list.length; i++) {
              var str = '';
              str += ('商品名称：' + newdata.data_list[i].product.name + '\n');
              str += ('购买价格：￥' + parseFloat(Number(newdata.data_list[i].product.buy_price) + Number(newdata.data_list[i].product.purchase_fee)).toFixed(2) + '\n');
              str += ('编号：' + newdata.data_list[i].gid + '\n');

              if (newdata.data_list[i].spec_desc&&newdata.data_list[i].spec_desc.t && newdata.data_list[i].spec_desc.t.length > 0) {
                console.log(newdata.data_list[i].spec_desc);
                for (var j = 0; j < newdata.data_list[i].spec_desc.t.length; j++) {
                  str += (newdata.data_list[i].spec_desc.t[j] + ':');
                  for (var k = 0; k < newdata.data_list[i].spec_desc.v[j].length; k++) {
                    str += newdata.data_list[i].spec_desc.v[j][k].label;
                    if (k != newdata.data_list[i].spec_desc.v[j].length - 1) {
                      str += '/'
                    }
                  }
                  str += '\n';
                  console.log(str);
                }
              }
              newdata.data_list[i]['total_price'] = parseFloat(Number(newdata.data_list[i].product.buy_price) + Number(newdata.data_list[i].product.purchase_fee)).toFixed(2);
              newdata.data_list[i]['desc'] = str;
              console.log(str);
            }
          }
          _this.setData(newdata);
          // _this.setData({
          //   activity: newdata.activity
          // })
        }
      },
      complete: function () {
        wx.stopPullDownRefresh();
        _this.setData({ hideLoading: true });
        //loading_more = false;
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
    try {
      let _this = this;
      wx.getSystemInfo({
        success: function (res) {
          _this.setData({
            sv_width: res.windowWidth,
            sv_height: res.windowHeight,
          });
        }
      });
    } catch (e) {
      // Do something when catch error
    }
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    let _this = this;
    _this.setData({
        current_page: 1
    })
    _this.onLoad({ activity_id: _this.data.activity.activity_id});
  },
  //显示弹窗
  addcart: function (e) {
    let item = e.currentTarget.dataset.item;
    this.setData({
      showSpec: true,
      showShare: false,
      data_detail: item
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
  go_cart:function(){
    wx.switchTab({
      url: '/pages/cart/cart',
    })
  },
  clickShare: function (e) {
    let item = e.currentTarget.dataset.item;
    this.setData({
      showShare: true,
      showSpec: false,
      data_detail: item
    })
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
  //收藏
  evt_fav: function (e) {
    let _this = this;
    let id = e.currentTarget.dataset.id;
    var favstatus = e.currentTarget.dataset.status;
    if (!favstatus) return true;
    var action = config.BASE_URL + '/m/my-favorite-' + (favstatus == 'YES' ? 'del' : 'add') + '-' + id + '.html';
    util.wxRequest({
      url: action,
      success: function (res) {
        if (res.data.success) {
          // _this.setData({
          //   isfav: (favstatus == 'YES' ? 'NO' : 'YES')
          // });
          let favs = _this.data.favs;
          favs[id]['is_fav'] = (favstatus == 'YES' ? false : true);
          _this.setData({
            favs: favs
          })
          wx.showToast({
            title: (favstatus == 'YES' ? '移除收藏成功' : '成功加入收藏'),
            icon: 'success',
            duration: 1200
          });
        }
      }
    });
  },
  evt_active_image:function(){
    let _this = this;
    wx.setStorageSync('addprice', _this.data.quantityVal ? _this.data.quantityVal : 0);
    let url = config.BASE_HOST + '/m/share-index.html?activity_id=' + _this.data.activity.activity_id + '&add=' + (_this.data.quantityVal ? _this.data.quantityVal : 0) + '&date=' + (_this.data.activity.last_modify ? _this.data.activity.last_modify:0);
    console.log(url);
    let imgUrl = 'https://jxk.linlangec.com' + '/pageres?url=' + encodeURIComponent(url) + '&size=' + 375 + 'x375';
    this.setData({
      showactiveImg:true,
      addshow:false,
      imgUrl: imgUrl
    })
  },
  showAdd:function(e){
    this.setData({
      addshow: true,
    })
  },
  closeAdd: function (e) {
    this.setData({
      addshow: false,
    })
  },
  evt_shareImg: function (event){
    console.log(event);
    let imgUrl = event.detail.imgUrl;
    this.setData({
      showShare: false,
      showImg: true,
      imgUrl: imgUrl
    })
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
  evt_quantityval: function (e) {
    this.setData({
      quantityVal:e.detail.value
    });
  },
  evt_focus: function () {
    if (this.data.quantityVal == 0) {
      this.setData({
        quantityVal: ""
      })
    }
  },
  tappqminus: function (e) {
    let num = Number(this.data.quantityVal) - 1;
    num = parseFloat(num).toFixed(2);
    this.setData({
      quantityVal:num
    });
  },
  tappqplus: function (e) {
    let num = Number(this.data.quantityVal) + 1;
    num = parseFloat(num).toFixed(2);
    this.setData({
      quantityVal: num
    });
  },
})