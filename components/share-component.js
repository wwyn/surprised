const util = require('../utils/util.js');
const config = require('../config/config');
const mul = function (a, b) {
  var c = 0,
    d = a.toString(),
    e = b.toString();
  try {
    c += d.split(".")[1].length;
  } catch (f) { }
  try {
    c += e.split(".")[1].length;
  } catch (f) { }
  return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c);
}
const add = function (a, b) {
  console.log(a+','+b)
  var c, d, e;
  try {
    c = a.toString().split(".")[1].length;
  } catch (f) {
    c = 0;
  }
  try {
    d = b.toString().split(".")[1].length;
  } catch (f) {
    d = 0;
  }
  return e = Math.pow(10, Math.max(c, d)), (mul(a, e) + mul(b, e)) / e;
}
Component({

  behaviors: [],

  properties: {
    goodsDetail: { // 属性名
      type: Object, // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
      value: {}, // 属性初始值（可选），如果未指定则会根据类型选择一个
      observer: function (newVal, oldVal) {
    //     //fmt.num(goodsDetail.product.buy_price) + fmt.num(goodsDetail.product.purchase_fee) + fmt.num(quantityVal)
    //   }
    // }
        if (newVal && newVal.product){
          this.setData({
            origin_price: add(Number(newVal.product.buy_price), Number(newVal.product.purchase_fee)),
            quantityVal: 0,
            last_price: add(Number(newVal.product.buy_price), Number(newVal.product.purchase_fee))
          })
        }
        if (wx.getStorageSync('addprice')) {
          this.setData({
            quantityVal: wx.getStorageSync('addprice')
          })
          console.log(this.data.quantityVal);
          if (newVal) {
            this.setData({
              last_price: add(Number(this.data.origin_price), Number(this.data.quantityVal))
            })
          }
        }
        
          
      } // 属性被改变时执行的函数（可选），也可以写成在methods段中定义的方法名字符串, 如：'_myPrivateMethod'
    },
    showShare: {
      type: Boolean,
      value: false,
      observer: function (newVal, oldVal) {
        console.log(newVal);
        if (newVal != oldVal) {
          this.setData({
            quantityVal: 0
          })
          if (wx.getStorageSync('addprice')) {
            this.setData({
              quantityVal: wx.getStorageSync('addprice')
            })
            console.log(this.data.quantityVal);
          }
        }
      }
    }
  },
  data: {
    quantityVal: 0,
    img_url:config.BASE_HOST,
    way:'first',
    last_price:'',
    origin_price:''
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
    closeShare: function () {
      this.setData({
        showShare: false
      })
    },
    evt_image:function(){
      let _this = this;
      let url = config.BASE_HOST + '/m/share-forward.html?product_id=' + _this.data.goodsDetail.product.product_id + '&type=' + (_this.data.way == 'second' ? 'two' : 'one') + '&fee=' + (_this.data.goodsDetail.product.purchase_fee) + '&add=' + (_this.data.quantityVal ? _this.data.quantityVal : 0) + '&date=' + (_this.data.goodsDetail.product.uptime ? _this.data.goodsDetail.product.uptime:0);
      let imgUrl = 'https://jxk.linlangec.com' + '/pageres?url=' + encodeURIComponent(url) + '&size=' + 375 + 'x375';
      _this.triggerEvent('shareImg', { imgUrl }, { bubbles: true, composed: true })
      
    },
    tappqminus: function (e) {
      this.setData({
        quantityVal: this.data.quantityVal - 1
      });
    },
    evt_focus:function(){
      if (this.data.quantityVal==0){
        this.setData({
          quantityVal: ""
        })
      }
    },
    tappqplus: function (e) {
      this.setData({
        quantityVal: this.data.quantityVal + 1
      });
    },
    evt_quantityval: function (e) {
      
      this.setData({
        quantityVal: e.detail.value,
        last_price: add(Number(this.data.origin_price), Number(e.detail.value))
      });
      
    },
    //切换方式
    changeway:function(e){
        let way = e.currentTarget.dataset.way;
        this.setData({
          way
        })
    }
  },
  ready() {
      // this.init_area();
      var _this = this;
      wx.getSystemInfo({
        success: function (res) {
          _this.setData({
            sv_width: res.windowWidth,
            sv_height: res.windowHeight,
          });
        }
      });
      if (wx.getStorageSync('addprice')) {
        this.setData({
          quantityVal: wx.getStorageSync('addprice')
        })
      }
      console.log(this.data.quantityVal);
  }
})
