/**
 * Created by scarlettxu on 2018/5/25.
 * 调用智能合约的接口封装
 */

import Nebulas from "nebulas";
import NebPay from "nebpay";

var net_address = "https://testnet.nebulas.io"; // 测试网地址
// var net_address = "https://mainnet.nebulas.io"; // 主网地址

var HttpRequest = Nebulas.HttpRequest;
var Neb = Nebulas.Neb;
var neb = new Neb();
neb.setRequest(new HttpRequest(net_address));

var nebPay = new NebPay();

var gas_price = '1000000';
var gas_limit = '200000';
var wallet_addr = '';


/**
 * 从浏览器钱包插件获取钱包地址
 * */
var getWallet = function (){
  // 判断浏览器钱包插件是否安装，只能在pc chrome浏览器，移动端暂不支持
  if(typeof(webExtensionWallet) === "undefined"){
    alert ("webExtensionWallet is not installed, please install it first or you cannot use the function on this page.")
  }

  window.postMessage({
    "target": "contentscript",
    "data":{
    },
    "method": "getAccount",
  }, "*");

// listen message from contentscript
  window.addEventListener('message', function(e) {
    if(e.data.data && e.data.data.account){
      console.log("getWallet:" + e + ", e.data:"+ JSON.stringify(e.data));
      // 通过插件获取钱包地址, 钱包地址可能登录的不正确，需要用户注意
      wallet_addr = e.data.data.account;
    }
  });
}

// 从浏览器插件获取钱包地址
getWallet();

export default {
  /**
   * 调用合约查询接口查询数据
   * @param {object} option - 查询参数
   * @param {HexString} option.contract_addr - 必填项，要调用的合约地址
   * @param {number} option.value - 可选项，交易金额，单位Wei = 1/(10^18) nas
   * @param {string} option.callFunction - 必填项，要调用的合约方法名
   * @param {array} option.callArgs - 可选项，调用合约方法的参数，如["key"]
   * @param {function} onSuccess - 调用成功的回调
   * @param {function} onError - 调用失败的回调
   * @return {string} result - 查询结果字符串，需要转成对象
   * @return {string} estimate_gas - 估计消耗的gas
   * @return {string} execute_err - 错误消息，如果调用合约出错，错误信息显示在这里
   * */
  get: function (option, onSuccess, onError) {
    if(!option.contract_addr) throw new Error("empty contract address");
    if(!option.callFunction) throw new Error("empty callFunction");
    if(!wallet_addr) throw new Error("empty wallet address, Pls fill in wallet info in webExtensionWallet");

    var value = option.value ? option.value : 0;
    var contract = {
      "function": option.callFunction,
      "args": option.callArgs ? JSON.stringify(option.callArgs) : "",
    };

    var nonce = 0;
    this.getAccountState(wallet_addr,function (resp) {
      nonce = Number(resp.nonce)+1;
      neb.api.call(wallet_addr,option.contract_addr,value,nonce,gas_price,gas_limit,contract)
        .then(function (resp) {
          console.log('get resp: ',resp);
          if(onSuccess && typeof onSuccess == 'function')
            onSuccess(resp);
        })
        .catch(function (err) {
          console.log('get Error: ',err);
          if(onError && typeof onError == 'function')
            onError(err);
        });
    });
  },

  /**
   * 通过nebpay调用合约的查询接口，会产生交易消耗NAS
   * @param {object} option - 查询参数
   * @param {HexString} option.contract_addr - 必填项，合约地址
   * @param {number} option.value - 可选项，交易金额，单位Wei = 1/(10^18) nas
   * @param {string} option.callFunction - 必填项，要调用的合约方法名
   * @param {array} option.callArgs - 可选项，调用合约方法的参数，如[{name:"ss",sex:"male"}]
   * @param {boolean} option.listener - 可选项，是否要监听结果，默认为true，如果不监听需要显式设置为false
   * @param {function} onSuccess - 交易成功的回调
   * @param {function} onError - 交易失败的回调
   * @return {number} txhash - 交易哈希
   * */
   set: function (option, onSuccess, onError) {
    if(!option.contract_addr) throw new Error("empty contract address");
    if(!option.callFunction) throw new Error("empty callFunction");

    var value = option.value ? option.value : 0;
    var callArgs = option.callArgs ? JSON.stringify(option.callArgs) : "";
    var $this = this;
    var options = {};
    if(!option.hasOwnProperty('listener') || option.listener) {
      options = {
        listener: function (resp) {
          console.log('set resp:',resp);
          $this.intervalQuery(resp.txhash, onSuccess, onError);
        }
      };
    }

    nebPay.call(option.contract_addr, value, option.callFunction, callArgs, options);
  },

  /**
   * 查询钱包状态, 余额，交易次数
   * @param {HexString} wallet_addr - 必填项，钱包地址
   * @param {function} onSuccess - 可选项，调用成功的回调
   * @param {function} onError - 可选项，调用失败的回调
   * @return {string} resp.balance - 钱包余额，单位Wei = 1/(10^18) nas
   * @return {string} resp.nonce - 当前交易次数
   * @return {number} resp.type - 地址类型，87表示普通钱包地址，88表示合约地址
   * */
  getAccountState: function (wallet_addr, onSuccess, onError) {
    if(!wallet_addr) throw new Error("empty wallet address");

    neb.api.getAccountState(wallet_addr)
      .then(function (resp) {
        console.log('getAccountState resp: ',resp);
        if(onSuccess && typeof onSuccess == 'function')
          onSuccess(resp);
      })
      .catch(function (err) {
        console.log('getAccountState Error: ',err);
        if(onError && typeof onError == 'function')
          onError(err);
      });
  },

  /**
   * 获取交易状态
   * @param {HexString} txhash - 必填项，交易哈希
   * @param {function} onSuccess - 可选项，调用成功的回调
   * @param {function} onError - 可选项，调用失败的回调
   * @return {number} resp.status - 交易状态，0 failed, 1 success, 2 pending
   * @return {...} resp.xxx其他返回信息略
   */
  getTxReceipt: function (txhash, onSuccess, onError) {
    if(!txhash) throw new Error("empty txhash");

    neb.api.getTransactionReceipt(txhash)
      .then(function (resp) {
        console.log('getTxReceipt resp: ',resp);
        if(onSuccess && typeof onSuccess == 'function')
          onSuccess(resp);
    }).catch(function (err) {
        console.log('getTxReceipt err: ',err);
        if(onError && typeof onError == 'function')
          onError(err);
    });
  },

  /**
   * 定时查询交易状态，如果成功执行成功方法，如果失败，执行失败方法
   * @param {HexString} txhash - 必填项，交易哈希
   * @param {function} onSuccess - 可选项，交易成功回调
   * @param {function} onError - 可选项，交易失败回调
   * */
  intervalQuery: function (txhash, onSuccess, onError) {
    var $this = this;
    var interval = setInterval(function () {
      $this.getTxReceipt(txhash,function (resp) {
        switch (resp.status) {
          case 2: // pending
            break;
          case 0: // fail
            if(onError && typeof onError == 'function') {
              onError(resp);
            }
            clearInterval(interval);
            break;
          case 1: // success
            if(onSuccess && typeof onSuccess == 'function') {
              onSuccess(resp);
            }
            clearInterval(interval);
            break;
          default:
            clearInterval(interval);
            break;
        }
      })
    },10000);
  },

}
