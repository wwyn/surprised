//gallery.js
//商品列表页
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const app = getApp();
var current_page = 1;
var loading_more = false;
const check_fav = function(arr){
    let _this = this;
    //let arr = _this.data.data_list;
    if (!arr) return;
    let gids = [];
    arr.map(function (item,key,ary) {
      gids.push('goods_id[]=' + item.goods_id);
    });
    let member_id = wx.getStorageSync('currentMemberId');
    util.checkMember.call(_this,function(){
        util.wxRequest({
          url: config.BASE_URL + '/openapi/goods/check_favs/?' + gids.join('&') +'&member_id='+ member_id,
            success: function (res) {
              
                if(res.data.result=='success'){
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


var load_list = function(page) {
    loading_more = true;
    var _this = this;
    var query_str_arr = [];
    wx.showNavigationBarLoading();
    page = page ? page : current_page;
    query_str_arr.push("page=" + page);
    var filter = _this.data.filter;
    var filtering_status = 'NO';
    for (var k in filter) {
        if (filter[k] && filter[k] != '' && k != 'page') {
            filtering_status = 'YES';
            query_str_arr.push(k + "=" + filter[k]);
            if (k == 'keyword') {
                _this.setData({
                  input_val: decodeURIComponent(filter[k])
                });
            }
        }
    }
    _this.setData({
        'filtering': filtering_status,
        //'query_str':query_str_arr.join('&')
    });
    // wx.showLoading({
    //   title: '加载中',
    // })
    util.wxRequest({
        url: config.BASE_URL + '/m/list.html?' + query_str_arr.join('&'),
        success: function(res) {
            console.info(res);
            var newdata = res.data;
            var _thisdata = _this.data;
          if (newdata) {
                //校验是否收藏
                check_fav.call(_this,newdata.data_list);
                if (_thisdata.data_list && page > 1) {
                  for (var i = 0; i < newdata.data_list.length; i++) {
                    var str = '';
                    str += ('商品名称：' + newdata.data_list[i].product.name + '\n');
                    str += ('购买价格：￥' + parseFloat(Number(newdata.data_list[i].product.buy_price) + Number(newdata.data_list[i].product.purchase_fee)).toFixed(2) + '\n');
                    str += ('编号：' + newdata.data_list[i].gid + '\n');
                    if (newdata.data_list[i].spec_desc.t && newdata.data_list[i].spec_desc.t.length > 0) {
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
                } else if (page == 1&&newdata.data_list) {
                  for (var i = 0; i < newdata.data_list.length; i++) {
                    var str = '';
                    str += ('商品名称：' + newdata.data_list[i].product.name + '\n');
                    str += ('购买价格：￥' + parseFloat(Number(newdata.data_list[i].product.buy_price) + Number(newdata.data_list[i].product.purchase_fee)).toFixed(2) + '\n');
                    str += ('编号：' + newdata.data_list[i].gid + '\n');

                    if (newdata.data_list[i].spec_desc.t && newdata.data_list[i].spec_desc.t.length > 0) {
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
                if (!newdata.data_list) {
                    newdata.empty_list = 'YES';
                    newdata.data_list = false;
                } else {
                    console.info(1);
                    newdata.empty_list = 'NO';
                    // for (var i = 0; i < newdata.data_list.length; i++) {
                    //     newdata.data_list[i]['image'] &&
                    //         (newdata.data_list[i]['image'] = util.fixImgUrl(newdata.data_list[i]['image']));
                    // }
                }
                // console.info(newdata);
                _this.setData(newdata);
                 
            }
        },
        fail: function(re) {
            console.info(re);
        },
        complete: function(e) {
            // wx.hideToast();
            wx.hideNavigationBarLoading();
            wx.hideLoading();
            _this.setData({
                hideLoading: true
            });
            loading_more = false;
        }
    });
    current_page = page;
};


Page({
    data: {
        filter: {},
        input_val: '',
        empty_list: 'NO',
        img_url: config.BASE_HOST,
        showSpec:false,
        data_detail: {}
    },
    onPullDownRefresh: function() {
        load_list.call(this, 1);
    },
    onReachBottom: function() {
      if (loading_more || this.data.pager.total == this.data.pager.current) {
        return;
      }
      current_page += 1;
      load_list.call(this, current_page);
    },
    onLoad: function(options) {
        var _this = this;
        wx.getSystemInfo({
            success: function(res) {
                _this.setData({
                    sv_height: res.windowHeight - 48,
                    fp_height: res.windowHeight - 30
                });
            }
        });
        this.setData({
            filter: options
        });
        load_list.apply(this, [1]);
    },
    //显示弹窗
    addcart:function(e){
      let item = e.currentTarget.dataset.item;
      this.setData({
        showSpec: true,
        showShare: false,
        data_detail: item
      })
    },
    clickShare: function (e) {
      let item = e.currentTarget.dataset.item;
      this.setData({
        showShare: true,
        showSpec:false,
        data_detail: item
      })
    },
    clearInput: function() {
        this.setData({
          input_val: ""
        });
        var filter = this.data.filter;
        if (!filter || filter['keyword'] == '') {
            return;
        }
        delete(filter['keyword']);
        this.setData({
            'filter': filter
        });
        load_list.call(this, 1);
    },
    evt_input: function (e, index) {
      let set = {};
      set['input_val'] = e.detail.value;
      this.setData(set);
    },
    confirmInput: function(e) {
      var filter = this.data.filter;
      if (!filter) {
          filter = {};
      }
      filter['keyword'] = this.data.input_val ? this.data.input_val:'';
      this.setData({
          'filter': filter
      });
      load_list.call(this, 1);
    },
    //加载图片
    load_image: function (e) {
      util.loadImage(this, e.currentTarget.dataset.ident, 's');
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
    //收藏
    evt_fav:function(e){
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
    evt_shareImg: function (event) {
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

  }
});
