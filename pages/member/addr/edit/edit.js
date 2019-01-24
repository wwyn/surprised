const config = require('../../../../config/config.js');
const util = require('../../../../utils/util.js');
const app = getApp();

var fill_fromwx = function(){
    var _this = this;
    if(!wx.canIUse('chooseAddress')){
        return false;
    }
    // _this.setData({
    //     'choose':true
    // });
    wx.showModal({
        title:'是否复制微信地址',
        content:' ',
        cancelText:'否',
        confirmText:'是',
        confirmColor:'#333',
        success:function(res){
            if(res.confirm){
                // _this.setData({
                //     'choose':false
                // });
                wx.chooseAddress({
                    success:function(addr_obj){
                        _this.setData({
                            'maddr.name':addr_obj.userName,
                            'maddr.zip':addr_obj.postalCode,
                            'maddr.mobile':addr_obj.telNumber,
                            'maddr.addr':addr_obj.detailInfo
                        });
                        var region_str = ':'+[addr_obj.provinceName,addr_obj.cityName,addr_obj.countyName]
                        .join('/')+':';
                        set_region_val.call(_this,region_str);
                        _this.data.maddr.area = get_region_val.call(_this);
                        _this.setData({
                          'displayArea': util.formatArea(_this.data.maddr.area),
                          'editarea': _this.data.maddr.area
                        })
                    }
                });
            }
        }
    });
}

var format_region_data = function(region_data) {
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

var init_region = function(path = [0, 0, 0]) {
    var _this = this;

    util.getRegionData([1, path[0]], function(data) {
        let _data = format_region_data(data);
        _this.setData({
            'region_data.second': _data,
        });
        try {
            var child_index = _data[path[1]]['c_idx'];
        } catch (e) {
            child_index = _data[0]['c_idx'];
        }
        util.getRegionData([2, child_index], function(data) {
            _this.setData({
                'region_data.third': format_region_data(data),
            });
        });
    });
};


var get_region_val = function() {
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

var set_region_val = function(val) {
    if(!val)return;
    console.info(val);
    var val = val.split(':'),
        text_path = val[1].split('/'),
        rl = ['first', 'second', 'third'],
        sr = [0, 0, 0];
    for (var i = 0; i < text_path.length; i++) {
        if(!rl[i]){
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
        "selected_region": sr
    });

}

Page({
    data: {
        selected_region: [0, 0, 0],
        maddr: {},
        choose:true,
        themecolor: app.globalData.themecolor,
        img_url:config.BASE_HOST
    },
    onLoad: function(options) {
        let _this = this;
        if (options) {
            _this.setData(options);
            // if(options.addrid){
            //     _this.setData({
            //         choose:false
            //     })
            // }
        }
        util.checkMember.call(this, function(member) {
            util.wxRequest({
                url: config.BASE_URL + '/m/my-receiver-edit-' + options.addrid + '.html',
                success: function(res) {
                    var pagedata = res.data;
                    if (!pagedata.maddr) {
                        delete(pagedata['maddr']);
                    }
                    if (pagedata.maddr) {
                      _this.setData({
                        displayArea: util.formatArea(pagedata.maddr.area),
                        editarea: pagedata.maddr.area
                      })
                    }
                    _this.setData(pagedata);
                    util.getRegionData([0, 0], function(data) {
                        var region_dataset = format_region_data(data);
                        _this.setData({
                            'region_data.first': region_dataset
                        });
                        if (_this.data.maddr && _this.data.maddr.area) {
                            set_region_val.call(_this, _this.data.maddr.area);
                        } else {
                            init_region.call(_this);
                            fill_fromwx.call(_this);
                        }
                    });
                },
                complete:function(){
                    _this.setData({
                        hideLoading: true
                    });
                }
            });
        });

    },
    evt_regionchange: function(e) {
        if(!this.data.region_data || !this.data.region_data.first || !this.data.region_data.first.length || e.timeStamp<700){
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
        this.data.maddr.area = get_region_val.call(this);

    },
    evt_editaddrsubmit: function(e) {
        var maddr = this.data.maddr;
        
        var form_data = e.detail.value;
        var post_data = {};
        var is_fromcheckout = this.data.fromcheckout;
        var _this = this;
        for (var n in form_data) {
            switch (n) {
                case 'name':
                case 'address':
                case 'mobile':
                    if (!form_data[n]) {
                        wx.showModal({
                            title: '提交失败',
                            content: '必填信息不完善',
                        });
                        return false;
                    }
                    break;
            }
            post_data['maddr[' + n + ']'] = form_data[n];
        }
        // if(_this.data.choose){
        //     //新增地址时  是否选择了地址
        //     wx.showModal({
        //         title: '提交失败',
        //         content: '请选择收货地址',
        //     });
        //     return false;
        // }

        if (maddr && maddr.addr_id) {
            post_data['maddr[addr_id]'] = maddr.addr_id;
        }
        if (!this.data.maddr.area || this.data.maddr.area == '') {
            this.data.maddr.area = get_region_val.call(this);
            
        }
        if (this.data.maddr.area.split('/')[1] == '请选择') {
          wx.showModal({
            title: '提交失败',
            content: '请选择收货地址',
          });
          return;
        }
        post_data['maddr[area]'] = this.data.maddr.area;
        wx.showLoading({
            title:'加载中..'
        })
        util.wxRequest({
            url: config.BASE_URL + '/m/my-receiver-save.html',
            method: 'POST',
            data: post_data,
            success: function(res) {
                if (!res.data.data || res.data.error) {
                    return wx.showModal({
                        title: '保存失败',
                        content: (res.data.error || '保存出现异常')
                    });
                }

                wx.showToast({
                    title: '保存成功',
                    icon: 'success',
                    duration: 1500,
                    success: function(e) {
                        if (is_fromcheckout) {
                            //从订单确认页首次新增地址
                            wx.setStorageSync('member_addr_selected', {
                                'member_id': res.data.data.member_id,
                                'addr_id': res.data.data.addr_id
                            });
                            wx.navigateBack();
                            return;
                        }
                        wx.navigateBack();
                    }
                });
            },
            complete:function(){
              wx.hideLoading();
            }
        });
    },
    // chooseFun:function () {
    //     this.setData({
    //         'choose':false
    //     })
    // },
    //显示地区
    evt_showPopup: function (e) {
      let type = e.currentTarget.dataset.type;
      console.log('显示地区');
      if (type == 'area') {
        this.setData({
          showArea: true
        })
      }

    },
    //切换区域
    evt_chooseArea: function (event) {
      console.log(event);
      let displayArea = util.formatArea(event.detail.area);
      this.data.maddr.area = event.detail.area;
      this.setData({
        editarea: event.detail.area,
        displayArea: displayArea,
        showArea: false
      })
    },
    evt_input_addr:function(e){
      this.setData({
        addrdesc:e.detail.value
      })
    },
    descAddr:function(){
      if (!this.data.addrdesc) return;
      let _this = this;
      //let address = '嵇菁菁,13218062632,江苏宝应县世纪园清荷园12栋';
      let address = this.data.addrdesc;
      address = address.trim();
      //address = address.replace(/[\n]/g, ""); //去掉换行
      util.wxRequest({
        url: config.BASE_URL + '/openapi/cart/parse_addr',
        method: 'POST',
        data: {
          addr:address
        },
        success: function (res) {
          console.log(res);
            if(res.data.result == 'success'){
              _this.setData({
                'maddr.name': res.data.data.name,
                'maddr.zip': res.data.data.zip,
                'maddr.mobile': res.data.data.mobile,
                'maddr.addr': res.data.data.addr
              });
              if (res.data.data.area[1]) {
                var region_str = 'mainland:' + [res.data.data.area[1].local_name, res.data.data.area[2].local_name, res.data.data.area[3].local_name].join('/') + ':' + res.data.data.area[3].region_id;
                // set_region_val.call(_this, region_str);
                // console.log(get_region_val.call(_this));
                console.log(region_str);
                _this.data.maddr.area = region_str;
                _this.setData({
                  'displayArea': util.formatArea(_this.data.maddr.area),
                  'editarea': _this.data.maddr.area
                })
              }
            }
        },
        fail:function(){

        },
        complete:function(){

        }
      })

    }
});
