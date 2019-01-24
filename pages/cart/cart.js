//cart.js
//购物车
const config = require('../../config/config.js');
const util = require('../../utils/util.js');
const strip_tags = require('../../utils/striptags.js');
const app = getApp();
let focus_flag = true;
var current_page = 1;
var loading_more = false;

var load_list = function (page) {
  loading_more = true;
  var _this = this;
  var page = page ? page : 1;
  util.wxRequest({
    url: config.BASE_URL + '/m/my-favorite-list-0-'+page+'.html',
    success: function (res) {
      console.log(res)
      var empty_fav = 'NO';
      var newdata = res.data;
     
      var _thisdata = _this.data;
      if (newdata) {
        if (_thisdata.fav_list && page > 1 && newdata.data) {
            for (var i = 0; i < newdata.data.length; i++) {
              var str = '';
              str += ('商品名称：' + newdata.data[i].product.name + '\n');
              str += ('购买价格：￥' + parseFloat(Number(newdata.data[i].product.buy_price) + Number(newdata.data[i].product.purchase_fee)).toFixed(2) + '\n');
              str += ('编号：' + newdata.data[i].gid + '\n');
              if (newdata.data[i].spec_desc &&newdata.data[i].spec_desc.t && newdata.data[i].spec_desc.t.length > 0) {
                for (var j = 0; j < newdata.data[i].spec_desc.t; j++) {
                  str += (newdata.data[i].spec_desc.t[j] + ':');
                  for (var k = 0; k < newdata.data[i].spec_desc.v[j].length; k++) {
                    str += newdata.data[i].spec_desc.v[j][k].label;
                    if (k != newdata.data[i].spec_desc.v[j].length - 1) {
                      str += '/'
                    }
                  }
                  str += '\n';
                  console.log(str);
                }
              }
              newdata.data[i]['total_price'] = parseFloat(Number(newdata.data[i].product.buy_price) + Number(newdata.data[i].product.purchase_fee)).toFixed(2);
              newdata.data[i]['desc'] = str;
            }
            newdata.data = _thisdata.fav_list.concat(newdata.data);
          //Object.assign(newdata.order_items_group, _thisdata.order_items_group);
          //Object.assign(newdata.merchant_list, _thisdata.merchant_list);
          // for (var order_id in _thisdata.order_items_group) {
          //     newdata.order_items_group[order_id] = _thisdata.order_items_group[order_id];
          // }
        } else if (page == 1 && newdata.data) {
          for (var i = 0; i < newdata.data.length; i++) {
            var str = '';
            str += ('商品名称：' + newdata.data[i].product.name + '\n');
            str += ('购买价格：￥' + parseFloat(Number(newdata.data[i].product.buy_price) + Number(newdata.data[i].product.purchase_fee)).toFixed(2) + '\n');
            str += ('编号：' + newdata.data[i].gid + '\n');
            
            if (newdata.data[i].spec_desc&&newdata.data[i].spec_desc.t && newdata.data[i].spec_desc.t.length>0){
              console.log(newdata.data[i].spec_desc);
              for (var j = 0; j < newdata.data[i].spec_desc.t.length; j++) {
                str += (newdata.data[i].spec_desc.t[j] + ':');
                for (var k = 0; k < newdata.data[i].spec_desc.v[j].length; k++) {
                  str += newdata.data[i].spec_desc.v[j][k].label;
                  if (k != newdata.data[i].spec_desc.v[j].length-1){
                    str += '/'
                  }
                }
                str += '\n';
                console.log(str);
              }
            }
            newdata.data[i]['total_price'] = parseFloat(Number(newdata.data[i].product.buy_price) + Number(newdata.data[i].product.purchase_fee)).toFixed(2);
            newdata.data[i]['desc'] = str;
            console.log(str);
          }
        }
        if (!newdata.data || !newdata.data.length) {
          empty_fav = 'YES';
        } else {
          empty_fav = 'NO';
        }
        _this.setData({
          fav_list:newdata.data,
          fav_pager: newdata.pager,
          empty_fav: empty_fav
        });
      }
    },
    complete: function () {
      _this.setData({ hideLoading: true });
      loading_more = false;
    }
  });
};


const form_cart_data = function(data) {
    let _return = data;
    if (!_return.promotions){
        _return.promotions = {}
    }
  if (_return.is_merchant && _return.objects){
    for (var i = 0; i < _return.objects.length;i++){
      if (_return.objects[i].promotions) {
            //格式化促销规则展示
        if (_return.objects[i].promotions.goods) {
          for (var obj_ident in _return.objects[i].promotions.goods) {
            for (var j = 0; j < _return.objects[i].promotions.goods[obj_ident].length; j++) {
              if (_return.objects[i].promotions.goods[obj_ident][j].tag == '送赠品') {
                _return.objects[i].promotions.goods[obj_ident][j].solution = strip_tags(_return.objects[i].promotions.goods[obj_ident][j].solution).replace(/[\n|\s]/ig, '').split("【赠品】");
                  }
                }
              }
            }
        if (_return.objects[i].promotions.order) {
          for (var j = 0; j < _return.objects[i].promotions.order.length; j++) {
            if (_return.objects[i].promotions.order[j].tag == '送赠品') {
              _return.objects[i].promotions.order[j].solution = strip_tags(_return.objects[i].promotions.order[j].solution).replace(/[\n|\s]/ig, '').split("【赠品】");
                }
              }
            }
          }
        }
    }else{
      if (_return.promotions) {
        //格式化促销规则展示
        if (_return.promotions.goods) {
          for (var obj_ident in _return.promotions.goods) {
            for (var i = 0; i < _return.promotions.goods[obj_ident].length; i++) {
              if (_return.promotions.goods[obj_ident][i].tag == '送赠品') {
                _return.promotions.goods[obj_ident][i].solution = strip_tags(_return.promotions.goods[obj_ident][i].solution).replace(/[\n|\s]/ig, '').split("【赠品】");
              }
            }
          }
        }
        if (_return.promotions.order) {
          for (var i = 0; i < _return.promotions.order.length; i++) {
            if (_return.promotions.order[i].tag == '送赠品') {
              _return.promotions.order[i].solution = strip_tags(_return.promotions.order[i].solution).replace(/[\n|\s]/ig, '').split("【赠品】");
            }
          }
        }
      }
    }
    
    return _return;
}
let is_checkALl_fun = function (page_ins, newdata) {
  let is_check = 1;
  if (!newdata.is_merchant && newdata.objects){
    for (let j = 0, len = newdata.objects.goods.length; j < len; j++) {
      if (newdata.objects.goods[j].warning) {
        //有不可全选的商品
        is_check = 0;
        break;
      }
      if (newdata.objects.goods[j].disabled && newdata.objects.goods[j].disabled == 'true') {
        is_check = 2;
        break;
      }
    }
    page_ins.setData({
      is_check: is_check
    });
  }else{
    if (!newdata.objects) return;
    for (let i = 0; i < newdata.objects.length;i++){
      for (let j = 0, len = newdata.objects[i].objects.goods.length; j < len; j++) {
        if (newdata.objects[i].objects.goods[j].warning) {
          //有不可全选的商品
          is_check = 0;
          break;
        }
        if (newdata.objects[i].objects.goods[j].disabled && newdata.objects[i].objects.goods[j].disabled == 'true') {
          is_check = 2;
          break;
        }
      }
    }
    
    page_ins.setData({
      is_check: is_check
    });
  }
  
};
const update_cart = function(page_ins,action,method = 'GET',data = false) {
    //page_ins.data.hideLoading && wx.showNavigationBarLoading();
    let options = {
        url: action,
        method: method,
        success: function(res) {
            if (res.data.success) {
                let newdata = res.data.data;
                console.log(newdata);
                is_checkALl_fun(page_ins, newdata);
                page_ins.setData(form_cart_data(res.data.data));
                page_ins.setData({
                    cart_empty: 'false'
                });
            }
            if (res.data.redirect.match(/blank/)) {
                page_ins.setData({
                    cart_empty: 'true'
                });
            }
          if (page_ins.data.is_merchant){
            if (!page_ins.data.objects){
              page_ins.setData({
                cart_empty: 'true'
              });
            }
          }
        },complete:function(){
            wx.stopPullDownRefresh();
            //wx.hideNavigationBarLoading();
            page_ins.setData({
                hideLoading: true
            });
        }
    };
    if(data){
        options['data'] = data;
    }
    util.wxRequest(options);
}

const pageOptions = {
    data: {
        inputVal: '',
        cart_empty: 'false',
        coitem_transform_dis:{},
        img_url: config.BASE_HOST,
        is_check_sty: [{ type: 'circle', color: '#ccc' }, { type: 'success', color: '#FC4773' }, { type: 'circle', color: '#ccc' }], //0不可全选 1全选 2非全选
        is_check: 1,
        data_detail: {}
    },
    onPullDownRefresh: function() {
        this.onShow();
    },
    onLoad: function() {
        let _this = this; 
        focus_flag = true;
        this.setData({
          themecolor:app.globalData.themecolor
        })
        load_list.call(_this,current_page = 1);
    },
    onReady: function() {
        wx.setNavigationBarTitle({
            title: '购物车'
        });
    },
    onShow: function() {
        var _this = this;
        focus_flag = true;
        util.checkMember.call(this, function() {
            let action = config.BASE_URL + '/m/cart.html';
            update_cart(_this,action);
        });
        this.setData({
            coitem_transform_dis:{},
            win_width: wx.getSystemInfoSync().windowWidth
        });
        load_list.call(this, current_page = 1);
    },
    load_image: function(e) {
        util.loadImage(this, e.currentTarget.dataset.ident, 's');
    },
    /*events*/
    evt_cocheck: function(e) {
        var dataset = e.currentTarget.dataset;
        var ident = dataset.ident;
        var nextstatus = dataset.nextstatus;
        var _this = this;
        if (!ident) {
            return;
        }
        let action = config.BASE_URL + '/m/cart-' + nextstatus + '-' + ident + '.html';
        update_cart(this,action);
    },
    evt_focus:function(){
        focus_flag = false;
    },
    tapquantity: function(e) {
        var _this = this;
        if(!focus_flag) return;
        var dataset = e.currentTarget.dataset,
            ident = dataset.ident,
            cogindex = dataset.cogindex,
            quantity = parseInt(dataset.quantity),
            update_quantity = (parseInt(dataset.num) + quantity);
        if (update_quantity == 0){
            wx.showModal({
              title: '温馨提示',
              content: '确定要从购物车里删除',
              confirmColor:'#FC4773',
              success:function(res){
                if (res.confirm) {
                  let action = config.BASE_URL + '/m/cart-remove-' + ident + '.html';
                  update_cart(_this, action);
                }
              }
            })
            return;
        }
        if (isNaN(quantity) || update_quantity < 1 || !ident) {
            return;
        }
        let action = config.BASE_URL + '/m/cart-update-' + ident + '-' + update_quantity + '.html';
        update_cart(this,action);
    },
    event_co_trash: function(e) {
        var dataset = e.currentTarget.dataset,
            ident = dataset.ident,
            cogindex = dataset.cogindex;
        if (!ident) {
            return;
        }
        var _this = this;
        wx.showModal({
            title: '温馨提示',
            content: '确定要从购物车里删除',
            confirmColor: '#FC4773',
            success: function(res) {
                if (res.confirm) {
                    let action = config.BASE_URL + '/m/cart-remove-' + ident + '.html';
                    update_cart(_this,action);
                }
            }
        });
    },
    event_quantity_blur: function(e) {
        var quantity = parseInt(e.detail.value),
            cur = parseInt(e.currentTarget.dataset.cur),
            ident = e.currentTarget.dataset.ident,
            cogindex = e.currentTarget.dataset.cogindex;
        let _this = this;
        
        if (quantity == 0) {
            wx.showModal({
              title: '温馨提示',
              content: '确定要从购物车里删除',
              confirmColor: '#FC4773',
              success: function (res) {
                if (res.confirm) {
                  let action = config.BASE_URL + '/m/cart-remove-' + ident + '.html';
                  update_cart(_this, action);
                } else {
                  _this.setData({
                    objects: _this.data.objects
                  })
                }
                focus_flag = true;
              }
            })
            return;
        }
        if (isNaN(quantity) || quantity < 1 || quantity == cur) {
            return;
        }
        focus_flag = true;
        let action = config.BASE_URL + '/m/cart-update-' + e.currentTarget.dataset.ident + '-' + quantity + '.html';
        update_cart(this,action);
    },
    evt_tcoitem_start: function(e) {
        if(!e.touches.length)return;
        let clientX = e.touches[0].clientX;
        this.evt_tcoitem_start_clientx = clientX;
        let disX = 0;
        let _set = {};
        _set['coitem_transform_dis.' + e.currentTarget.dataset.ident] = disX;
        this.setData(_set);
    },
    evt_tcoitem_move: function(e) {
        if(!e.touches.length)return;
        let clientX = e.touches[0].clientX;
        let disX = this.evt_tcoitem_start_clientx - clientX;
        let trash_btn_width = 100;
        (disX < 0) && (disX = 0);
        (disX >= trash_btn_width) && (disX = trash_btn_width);
        let _set = {};
        _set[e.currentTarget.dataset.ident] = disX;
        Object.assign(this.data.coitem_transform_dis,_set);
        console.info(this.data);
        //this.setData(_set);
    },
    evt_tcoitem_end: function(e) {
        let trash_btn_width = 100;
        let disX = this.data.coitem_transform_dis[e.currentTarget.dataset.ident]||0;
        (disX >= trash_btn_width / 2) ? (disX = trash_btn_width) : (disX = 0);
        let _set = {};
        _set['coitem_transform_dis.' + e.currentTarget.dataset.ident] = disX;
        this.setData(_set);
    },
    go_index: function(e) {
        wx.switchTab({
            url: "/pages/index/index"
        });
    },
    check_all: function (e) {
      var str = e.currentTarget.dataset.status;
      var index  = e.currentTarget.dataset.index;
      var _this = this;
      var checkAllIdent = [];
      console.log(this.data)
      for (var k = 0; k < _this.data.objects[index].objects.goods.length; k++) {
        var item = _this.data.objects[index].objects.goods[k];
        checkAllIdent.push('ident[]=' + item.obj_ident);
      }
      
      let action;
      if (!checkAllIdent) {
        return;
      }
      console.log(checkAllIdent);
      action = config.BASE_URL + '/m/cart-' + str + '.html?'+ checkAllIdent.join('&');
      update_cart(_this, action);
    },
    //全选
    is_checkAll: function () {
      let _this = this, arr = [], nextstatus = 'enabled';
      if (!_this.data.is_check) {
        //不可全选
        return;
      }
      if(_this.data.is_merchant){
        _this.data.objects.forEach(function (val, ind) {
          val.objects.goods.forEach(function (item, index) {
            arr.push('ident[]=' + item.obj_ident);
          });
        });
      }else{
        _this.data.objects.goods.forEach(function (val, ind) {
          arr.push('ident[]=' + val.obj_ident);
        });
      }
      
      console.log(arr);
      switch (parseInt(_this.data.is_check)) {
        case 1:
          //非全选
          nextstatus = 'disabled';
          break;
        case 2:
          //全选
          break;
      }
      let action = config.BASE_URL + '/m/cart-' + nextstatus + '.html?' + arr.join('&');
      update_cart(this, action, 'POST');
    },
    //选择商品提示
    checkAll_msg: function () {
      wx.showModal({
        content: '请选择购买商品',
        showCancel: false,
        confirmColor: '#FC4773',
        confirmText: '确定',
      })
    },
    evt_remark:function(e){
      let id = e.currentTarget.dataset.id;
      let remark = e.currentTarget.dataset.remark;
      let first = e.currentTarget.dataset.first;
      let second = e.currentTarget.dataset.second;
      this.setData({
        remarkid:id,
        remarkContent: remark,
        remarkShow:true,
        remarkfirst: first,
        remarksecond:second
      })
    },
    closeMark:function(){
      this.setData({
        remarkid: '',
        remarkShow: false
      })
    },
    insertContent:function(e){
      let val = e.detail.value;
      let reg = /([^\u0020-\u007E\u00A0-\u00BE\u2E80-\uA4CF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u0080-\u009F\u2000-\u201f\u2026\u2022\u20ac\r\n])|(\s)/g
      if (val.match(reg)) {
        val = val.replace(reg, '');
      }
      this.setData({
        remarkContent: val
      })
    },
    submitMark: function () {
      let _this = this;
      util.wxRequest({
        url: config.BASE_URL + '/m/cart-update.html?ident=goods_' + this.data.remarkid + '&num=' + this.data.remarkContent+'&object_type=remark',
        success: function (res) {
            console.log(res);
            let objects = _this.data.objects;
            objects[_this.data.remarkfirst].objects.goods[_this.data.remarksecond].params.remark = _this.data.remarkContent;
            _this.setData({
                objects: objects,
                remarkShow: false
            })
        },
        complete: function () {
          _this.setData({ hideLoading: true });
        }
      });
    },
    onReachBottom: function (e) {
      if (loading_more || this.data.fav_pager.total == this.data.fav_pager.current) {
        return;
      }
      current_page += 1;
      load_list.call(this, current_page);
    },
    //取消收藏
    evt_fav: function (e) {
      let _this = this;
      let id = e.currentTarget.dataset.id;
      let index = e.currentTarget.dataset.index;
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
            console.log(_this.data.fav_list);
            console.log(index);
            let favs = _this.data.fav_list;
            favs.splice(index, 1);
            console.log(favs);
            if(favs.length==0){
              _this.setData({
                empty_fav: 'YES'
              });
            }
            _this.setData({
              fav_list: favs
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
    //显示弹窗
    addcart: function (e) {
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
        showSpec: false,
        data_detail: item
      })
    },
    evt_image: function () {
      this.setData({
        showImg: true,
        imgUrl: "http://yijiao.oss-cn-qingdao.aliyuncs.com/images/http://tmp/wx1b4e5e756cd48af1.o6zAJsws4grEQvYrWTjBigy-6QaU.0llhudiKSF2V955a1c48350d9328ef064b4d36d12746.jpg"
      })
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
};


Page(pageOptions);

module.exports = pageOptions;
