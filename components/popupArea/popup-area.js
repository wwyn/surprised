const util = require('../../utils/util.js');
const config = require('../../config/config');
var format_region_data = function (region_data) {
  if (!region_data || region_data.length < 1) {
    return [];
  }
  var _return = [];
  for (var i = 0; i < region_data.length; i++) {
    var rd = region_data[i],
      rd = rd.split(':');
    _return.push({
      'text': rd[0],
      'value': rd[1],
      'c_idx': rd[2]
    });
  }
  return _return;
}

var init_region = function (path = [0, 0, 0],is_set) {
  var _this = this;

  util.getRegionData([1, path[0]], function (data) {
    // console.info(data);
    let _data = format_region_data(data);
    _this.setData({
      'region_data.second': _data,
    });
    try {
      var child_index = _data[path[1]]['c_idx'];
    } catch (e) {
      child_index = _data[0]['c_idx'];
    }
    util.getRegionData([2, child_index], function (data) {
      _this.setData({
        'region_data.third': format_region_data(data),
      });
      console.log(_this.data.region_data);
      //初始化区域
      _this.setData({
        storage_area: get_region_val.call(_this)
      })
      _this.setData({
        city_area: get_city_region_val.call(_this)
      })
      if (_this.data.area == '') {
        //setTimeout(function(){
          //let area = _this.data.storage_area;
          //let cityarea = _this.data.city_area;
          //_this.triggerEvent('chooseArea', { area, cityarea }, { bubbles: true, composed: true })
        //},1000)
        
      }

      if(is_set){
        set_region_val.call(_this, _this.data.area);
      }
    });
  });
  
  
};


var get_region_val = function () {
  var region_val = 'mainland:',
    region_val_arr = [],
    rl = ['first', 'second', 'third'],
    region_data = this.data.region_data,
    selected_region = this.data.selected_region;
  //filter
  for (var i = 0; i < rl.length; i++) {
    if (region_data[rl[i]].length && region_data[rl[i]][selected_region[i]]) {
      region_val_arr.push(region_data[rl[i]][selected_region[i]]);
    }
  }
  for (var i = 0; i < region_val_arr.length; i++) {
    var loop = region_val_arr[i];
    if (i == region_val_arr.length - 1) {
      region_val += loop['text'] + ':' + loop['value'];
    } else {
      region_val += loop['text'] + '/';
    }
  }
  return region_val;
}


var get_city_region_val = function () {
  var region_val = 'mainland:',
    region_val_arr = [],
    rl = ['first', 'second', 'third'],
    region_data = this.data.region_data,
    selected_region = this.data.selected_region;
  //filter
  for (var i = 0; i < rl.length; i++) {
    if (region_data[rl[i]].length && region_data[rl[i]][selected_region[i]]) {
      region_val_arr.push(region_data[rl[i]][selected_region[i]]);
    }
  }
  for (var i = 0; i < region_val_arr.length; i++) {
    var loop = region_val_arr[i];
    if (i == region_val_arr.length - 2) {
      region_val += loop['text'] + ':' + loop['value'];
    } else if(i==0){
      region_val += loop['text'] + '/';
    }
  }
  return region_val;
}


var set_region_val = function (val) {
  if (!val) return;
  var val = val.split(':'),
    text_path = val[1].split('/'),
    rl = ['first', 'second', 'third'],
    sr = [0, 0, 0];
  for (var i = 0; i < text_path.length; i++) {
    if (!rl[i]) {
      continue;
    }
    var lv = this.data.region_data[rl[i]];
    for (var j = 0; j < lv.length; j++) {
      if (lv[j].text == text_path[i]) {
        sr[i] = j;
        //console.info(sr);
        init_region.call(this, sr);
        break;
      }
    }
  };

  this.setData({
    "selected_region": sr,
  });
  this.setData({
    'storage_area': get_region_val.call(this)
  })
  this.setData({
    'city_area': get_city_region_val.call(this)
  })
}
Component({

  behaviors: [],

  properties: {
    showArea: {
      type:Boolean,
      value:false,
      observer:function(newVal,oldVal){
        console.log('弹窗显示隐藏发生变化');
        console.log(this.data.area);
        console.log(this.data.storage_area);
        //重置地区
        // if (newVal != oldVal) {
        if (this.data.area == '') {
          this.setData({
            storage_area: '',
            selected_region: [0, 0, 0]
          })
          this.init_area();
        }else if (this.data.area != this.data.storage_area) {
          this.init_area();
        }
        // }
      }
    },
    isAddress: {
      type: Boolean,
      value: false
    },
    area: {
      type: String,
      value: '',
      observer: function (newVal, oldVal) {
        this.init_area();
      }
    }
  },
  data: {
    selected_region: [0, 0, 0],
    storage_area:''
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
    closeArea:function(){
        this.setData({
            showArea:false
        })
    },
    sureArea:function(){
        //console.log(this.data.area);
      //this.data.area = get_region_val.call(this);
      let area = this.data.storage_area;
      let cityarea = this.data.city_area;
      this.triggerEvent('chooseArea', { area, cityarea }, { bubbles: true, composed: true })
    },
    evt_regionchange: function (e) {
      if (!this.data.region_data || !this.data.region_data.first || !this.data.region_data.first.length || e.timeStamp < 700) {
        return;
      }
      var path = e.detail.value;
      if (path[0] != this.data.selected_region[0]) {
        path[1] = 0;
        path[2] = 0;
      }
      if (path[1] != this.data.selected_region[1]) {
        path[2] = 0;
      }
      init_region.call(this, path);
      this.setData({
        selected_region: path
      });
      this.setData({
        storage_area: get_region_val.call(this)
      })
      this.setData({
        city_area: get_city_region_val.call(this)
      })
    },
    init_area:function(){
      console.log('创建地区');
      console.log(this.data.area);
      let _this = this;
      util.getRegionData([0, 0], function (data) {
        var region_dataset = format_region_data(data);
        _this.setData({
          'region_data.first': region_dataset
        });
        if (_this.data.area) {
          console.log('有地址');
          if (_this.data.region_data && _this.data.region_data.first.length > 0) {
            set_region_val.call(_this, _this.data.area);

          }else{
            console.log('还未请求地址数据');
            init_region.call(_this,true);
          }
          
        } else {
          console.log('无地址时加载');
          init_region.call(_this);
          //fill_fromwx.call(_this);
        }
      });
    }
  },
  ready() {
    this.init_area();
  }
})