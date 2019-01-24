/**
 * 最终上传到cos的URL
 * 把以下字段配置成自己的cos相关信息，详情可看API文档 https://www.qcloud.com/document/product/436/6066
 * REGION: cos上传的地区
 * APPID: 账号的appid
 * BUCKET_NAME: cos bucket的名字
 * DIR_NAME: 上传的文件目录
 */
const config = require('../config/config.js');
const util = require('util.js');
const md5 = require('md5.js');
/**
 * 上传方法
 * filePath: 上传的文件路径
 * cos_path: 上传到cos后的文件名
 */

const buildcospath = function(filePath){
    let patharr = filePath.split('.');
    let postfix = patharr[patharr.length-1];
    // switch (postfix) {
    //     case expression:
    //     default:
    // } //TODO
    let ident = md5(filePath);
    let cos_path = [postfix,ident[0].concat(ident[1]),ident[5].concat(ident[7]),ident.substr(-9)+'.'+postfix].join('/');
    return cos_path;
}

function cos_upload(filePath,callback,upload_ins_callback) {
    var cos_path = buildcospath(filePath);
    // 鉴权获取签名
    util.wxRequest({
        url: config.BASE_URL+'/openapi/qcloud_cos/auth',
        data:{
            path:cos_path
        },
        method:'POST',
        success: function(res) {
            var resdata = res.data;
            if(!resdata ||!resdata.result || resdata.result!='success'){
                typeof callback == 'function' && callback(false,'无上传权限');
                return;
            }
            let signature = resdata.data.signature;// 签名
            let region = resdata.data.region;
            let appid = resdata.data.appid;
            let bucket_name = resdata.data.bucket_name;

            // 头部带上签名，上传文件至COS
            var upload_url = "https://" + region + ".file.myqcloud.com/files/v2/" + appid + "/" + bucket_name  + '/' + cos_path;
            console.info(upload_url);
            let uploadTask = wx.uploadFile({
                url: upload_url,
                filePath: filePath,
                header: {
                    'Authorization': signature
                },
                name: 'filecontent',
                formData: {
                    op: 'upload'
                },
                success: function(uploadRes){
                    let resdata = uploadRes.data;
                    let data = false;
                    try{
                        console.info(resdata);
                        resdata = JSON.parse(resdata);
                        data = resdata.data;
                    }catch(e){
                        console.info(e);
                    }
                    if(!data||!data.access_url){
                        typeof callback == 'function' && callback(false,'上传失败');
                        return;
                    }
                    console.info(data);
                    let host_mirror = data.access_url.match(/http[^:]*:\/\/([^\/]+)/i);
                    host_mirror = 'https://'+host_mirror[1];
                    let url_path =  cos_path;
                    let storage_ident = cos_path+'@'+bucket_name+'@'+appid;
                    let callbackdata = {
                        'host_mirror':host_mirror,
                        'url_path':'/'+cos_path,
                        'ident':storage_ident,
                        'storage':'cos'
                    };
                    typeof callback == 'function' && callback(callbackdata);
                },
                fail: function(e) {
                    console.log('e', e)
                }
            });
            typeof upload_ins_callback =='function' && upload_ins_callback(uploadTask);
        }
    })
}

module.exports = {
    cos_upload:cos_upload
}
