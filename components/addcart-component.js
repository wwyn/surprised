const util = require('../utils/util.js');
const config = require('../config/config');
const stock_confirm = function () {
  var _this = this;
  console.log(_this.data.goodsDetail,'hhh');
  if (!_this.data.goodsDetail || !_this.data.goodsDetail.product) return;
  console.log(_this.data.goodsDetail);
  let goodsDetail = _this.data.goodsDetail;
  let skuArr = [];
  if (goodsDetail.spec_desc.t){
    for (let idx = 0; idx < goodsDetail.spec_desc.t.length; idx++) {
      let spec = goodsDetail.spec_desc.v[idx];
      for (let j = 0; j < spec.length; j++) {
        skuArr.push(spec[j].sku_bn);
      }
      console.log(skuArr);
    }
  }else{
    skuArr.push(goodsDetail.product.bn);
  }
  
  util.wxRequest({
    url: config.BASE_URL + '/openapi/stock/confirm',
    method: 'POST',
    data: {
      sku: skuArr.join(',')
    },
    success: function (res) {
      var pagedata = res.data;
      _this.setData({
        'stock': pagedata.data
      });
      //切换规格之后商品库存是否发生变化
      
      if (_this.data.quantityVal >= parseInt(_this.data.stock[_this.data.goodsDetail.product.bn].num)) {
        _this.setData({
          quantityVal: parseInt(_this.data.stock[_this.data.goodsDetail.product.bn].num)
        });
      }
    }
  });
};
Component({

  behaviors: [],

  properties: {
    goodsDetail: { // 属性名
      type: Object, // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
      value: {}, // 属性初始值（可选），如果未指定则会根据类型选择一个
      observer: function(newVal,oldVal){
        //库存确认
        if (newVal) {
            stock_confirm.call(this);
        }
      } // 属性被改变时执行的函数（可选），也可以写成在methods段中定义的方法名字符串, 如：'_myPrivateMethod'
    },
    showSpec: {
      type:Boolean,
      value:false,
      observer:function(newVal,oldVal){
        if (newVal!=oldVal) {
          this.setData({
            quantityVal:1,
            remark:''
          })
        }
      }
    },
    isGb: {
      type: Boolean,
      value: false
    },
    showFastBuy:{
      type:Boolean,
      value:false,
    },
    current_product: Object,
    member_info:Object,
    activity: Object,
    main_order: Object
  },
  data: {
    quantityVal:1,
    img_url:config.BASE_HOST,
    remark:''
  }, // 私有数据，可用于模版渲染

  // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
  attached: function () { 
      // this.setData({
      //   data_detail:
      // })
  },
  moved: function () { },
  detached: function () { },

  methods: {
    onMyButtonTap: function () {
      this.setData({
        // 更新属性和数据的方法与更新页面数据的方法类似
      })
    },
    closeSpec:function(){
        this.setData({
            showSpec:false
        })
    },
    tapspecitem: function(e) {
        var product_id = e.currentTarget.dataset.productid;
        const _this = this;
        if (product_id && product_id != this.data.goodsDetail.product.product_id) {
          if(this.data.isGb){
            util.wxRequest({
              url: config.BASE_URL + '/m/gbitem-' + this.data.activity.activity_id+'-' + product_id + '.html',
              success: function (res) {
                _this.setData({
                  goodsDetail: res.data.data_detail,
                  current_product: res.data.current_product
                });
                
                //切换规格之后商品库存是否发生变化
                if (_this.data.quantityVal >= parseInt(res.data.data_detail.product.stock_quantity)) {
                  _this.setData({
                    quantityVal: parseInt(res.data.data_detail.product.stock_quantity)
                  });
                }
                if (_this.data.quantityVal >= parseInt(res.data.current_product.member_restrict_number)){
                  _this.setData({
                    quantityVal: parseInt(res.data.current_product.member_restrict_number)
                  });
                }
              }
            })
          }else{
            util.wxRequest({
              url: config.BASE_URL + '/m/item-' + product_id + '.html',
              success: function (res) {
                _this.setData({
                  goodsDetail: res.data.data_detail
                });
                stock_confirm.call(_this);
                //切换规格之后商品库存是否发生变化
                // if (_this.data.quantityVal >= parseInt(res.data.data_detail.product.stock_quantity)) {
                //   _this.setData({
                //     quantityVal: parseInt(res.data.data_detail.product.stock_quantity)
                //   });
                // }
              }
            })
          }
            
        }
    },
    tappqminus: function(e) {
        this.setData({
            quantityVal: this.data.quantityVal - 1
        });
    },
    tappqplus: function(e) {
        this.setData({
            quantityVal: this.data.quantityVal + 1
        });
    },
    evt_remark: function (e) {
      let val = e.detail.value;
      let reg = /([^\u0020-\u007E\u00A0-\u00BE\u2E80-\uA4CF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u0080-\u009F\u2000-\u201f\u2026\u2022\u20ac\r\n])|(\s)/g
      if (val.match(reg)) {
        val = val.replace(reg, '');
      }
      console.log(val);
      this.setData({
        remark: val
      })
    },
    evt_quantityval:function (e) {
        if(e.detail.value <= 0){
            e.detail.value = 1;
        }
      
        if (e.detail.value >= parseInt(this.data.stock[this.data.goodsDetail.product.bn].num)){
            e.detail.value = parseInt(this.data.stock[this.data.goodsDetail.product.bn].num);
        }
        if(this.data.isGb){
          if (e.detail.value >= parseInt(this.data.current_product.member_restrict_number)) {
            e.detail.value = parseInt(this.data.current_product.member_restrict_number);
          }
        }
        this.setData({
          quantityVal: Number(e.detail.value)
        });
    },
    
    linkTo:function(){
      wx.navigateTo({
        url: '/pages/groupbooking/checkout/checkout?activity_id=' + this.data.activity.activity_id + '&main_id=' + this.data.main_order.gb_id + '&product_id=' + this.data.goodsDetail.product.product_id + '&quantity=' + this.data.quantityVal,
      })
    },
    addcart: function(e) {
        var _this = this;
        util.checkMember.call(this, function() {
            
            wx.showToast({
                title: '正在加入..',
                icon: 'loading',
                duration: 5000
            });
            var product_id = _this.data.goodsDetail.product.product_id;
            var quantity = _this.data.quantityVal;
            util.wxRequest({
                url: config.BASE_URL + '/m/cart-' + (e.currentTarget.dataset.fastbuy ? 'fastbuy' : 'add') + '-' + product_id + '-' + quantity + '.html?remark='+_this.data.remark,
                success: function(res) {
                    var res_data = res.data;

                    wx.hideToast();
                    if (res_data.error) {
                        wx.showModal({
                            title: '购买失败',
                            content: res_data.error
                        });
                    } else if (res_data.result=="failure"){
                      wx.showModal({
                        title: '购买失败',
                        content: res_data.msg
                      });
                    } else {
                        if (e.currentTarget.dataset.fastbuy) {
                          if (Number(e.currentTarget.dataset.stock) < _this.data.quantityVal || Number(e.currentTarget.dataset.stock)==0){
                              wx.showModal({
                                content: '库存不足',
                                showCancel:false
                              })
                              return;
                          }
                            //立即购买
                            if(getCurrentPages().length>2){
                                wx.redirectTo({
                                    url: '/pages/checkout/checkout?is_fastbuy=true'
                                });
                                return;
                            }else{
                                wx.navigateTo({
                                    url: '/pages/checkout/checkout?is_fastbuy=true'
                                });
                                return;
                            }
                        }else{
                          if (Number(e.currentTarget.dataset.stock) < _this.data.quantityVal || Number(e.currentTarget.dataset.stock) == 0) {
                            wx.showModal({
                              content: '库存不足',
                              showCancel: false
                            })
                            return;
                          }
                        }
                        // _this.setData({
                        //     'cartCount': res_data.data.goods_count
                        // });
                        wx.showToast({
                            title: '加入购物车成功',
                            icon: 'success',
                            duration: 1200
                        });
                        _this.triggerEvent('addCart',{}, { bubbles: true, composed: true })
                        _this.setData({
                            showSpec:false
                        })
                    }
                },
                fail:function(){
                    wx.hideToast();
                },
                complete: function(e) {
                    // clearTimeout(_timer);
                }
            });
        });
    },
    
    load_image: function(e) {
        util.loadImage(this,e.currentTarget.dataset.ident,'xs');
    },

  }

})