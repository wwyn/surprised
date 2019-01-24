var conf = {
  // 神策分析注册在APP全局函数中的变量名，在非app.js中可以通过getApp().sensors(你这里定义的名字来使用)
  name: 'sensors',
  // 如果要通过sdk自动获取openid，需要在神策分析中配置appid和appsercret，并在这里标志appid,不需要的话，不用填。
  appid: 'wxcc5dc377979131f3',
  // 神策分析数据接收地址
  // server_url: 'https://xxxxx.datasink.xxxx/sa.gif?project=default&token=27eeee',
  server_url: 'https://xcx.vmcocean.com/debug?project=vmcdemo',
  //请求发送超时时间
  send_timeout: 1000,
  // 传入的字符串最大长度限制，防止未知字符串超长
  max_string_length: 300,
  // 发送事件的时间使用客户端时间还是服务端时间
  use_client_time: false,
  // 是否允许控制台打印查看埋点数据（建议开启查看）
  show_log: true,
  // 是否允许修改onShareMessage里return的path，用来增加（用户id，分享层级，当前的path），在app onshow中自动获取这些参数来查看具体分享来源，层级等
  allow_amend_share_path : true,
  // 是否自动采集如下事件（建议开启）
  autoTrack:{  
    appLaunch:true, //是否采集 $MPLaunch 事件，true 代表开启。
    appShow:true, //是否采集 $MPShow 事件，true 代表开启。
    appHide:true, //是否采集 $MPHide 事件，true 代表开启。
    pageShow:true, //是否采集 $MPViewScreen 事件，true 代表开启。
    pageShare:true //是否采集 $MPShare 事件，true 代表开启。
  }
};

module.exports = conf;