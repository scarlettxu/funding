/**
 * Created by scarlettxu on 2018/5/25.
 * 这是一个智能合约的模版
 */
'use strict'

var Entity = function (args) {
  if(args){
    this.string = args.string;
    this.number = new BigNumber(args.number);
    this.bool = args.bool;
    this.timestamp = args.timestamp;
  } else {
    this.string = '';
    this.number = new BigNumber(0);
    this.bool = false;
    this.timestamp = Number(new Date());
  }
}

Entity.prototype = {
  toString: function () {
    return JSON.stringify(this);
  }
}

var SmartContract = function () {
  LocalContractStorage.defineMapProperty(this, "map", {
    parse: function (str) { // 读取
      return new Entity(JSON.parse(str)); // 读取时，从字符串反序列化为对象，需要先parse成对象
    },
    stringify: function (obj) {// 存储, 序列化为字符串
      return obj.toString();
    }
  });
}

SmartContract.prototype = {
  init: function () {
    // TODO
  },

  set: function (key,param) {
    var from = Blockchain.transaction.from; // 把发起交易的钱包地址作为主键，避免重复
    var entity = new Entity(param);
    if(!key){
      key = from;
    }
    this.map.put(key,entity);
  },

  get: function (key) {
    if(!key){
      var from = Blockchain.transaction.from;
      key = from;
    }
    return this.map.get(key);
  },

  del: function (key) {

  },

}

module.exports = SmartContract;
