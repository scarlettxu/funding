/**
 * Created by scarlettxu on 2018/5/24.
 */
'use strict'

/**
 * 众筹信息
 * */
var CrowdInfo = function (option) {
  if(option){
    this.beneficiary = option.beneficiary; //募集成功后的收款方，通常是发起人
    this.fundingGoal = new BigNumber(option.fundingGoal); //募资额度
    this.startTime = option.startTime; //募集开始日期
    this.deadline = option.deadline; //募集截止日期
    this.price = new BigNumber(option.price); //token与星云链的汇率
    this.tokenReward = option.tokenAddress ? token(option.tokenAddress) : ''; //根据已发布token合约的地址创建token合约实例，星云链暂不支持
    this.amountRaised = option.amountRaised ? new BigNumber(option.amountRaised) : new BigNumber(0); //参与数量
    this.fundingGoalReached = option.fundingGoalReached ? option.fundingGoalReached : false; //众筹是否达到目标
    this.crowdsaleClosed = option.crowdsaleClosed ? option.crowdsaleClosed : false; //众筹是否结束
  } else {
    this.beneficiary = ''; //募集成功后的收款方
    this.fundingGoal = new BigNumber(0); //募资额度
    this.startTime = Number(new Date()); //募集开始日期
    this.deadline = Number(new Date()); //募集截止日期
    this.price = new BigNumber(0); //token与星云链的汇率
    this.tokenReward = ''; // token合约实例
    this.amountRaised = new BigNumber(0); //参与数量
    this.fundingGoalReached = false; //众筹是否达到目标
    this.crowdsaleClosed = false; //众筹是否结束
  }
}

CrowdInfo.prototype = {
  toString: function () {
    return JSON.stringify(this);
  }
}

/**
 * 投资人信息
 * */
var Investment = function (invests) {
  if(invests) {
    this.investment = invests.investment;
  } else {
    this.investment = [];
  }
}

Investment.prototype = {
  toString: function () {
    return JSON.stringify(this);
  }
}

/**
 * 众筹合约
 * */
var CrowdsaleContract = function () {
  LocalContractStorage.defineMapProperty(this, "crowdsale", {
    parse: function (text) { // 读取
      return new CrowdInfo(JSON.parse(text)); // 读取时，从字符串反序列化为对象，需要先parse成对象
    },
    stringify: function (o) {// 存储
      return o.toString();
    }
  });
  LocalContractStorage.defineMapProperty(this, "investinfo", {
    parse: function (param) { // 读取
      return new Investment(JSON.parse(param)); // 读取时，从字符串反序列化为对象，需要先parse成对象
    },
    stringify: function (o) {// 存储
      return o.toString();
    }
  });
}

CrowdsaleContract.prototype = {
  init: function () {

  },

  /**
   * 发起众筹
   * */
  initCrowd: function (info) {
    var from = Blockchain.transaction.from; // 发起人信息，通常是收款方
    var crowdInfo = new CrowdInfo(info); // 初始化众筹信息
    console.log('初始化众筹，crowdInfo: ',crowdInfo)
    this.crowdsale.put(from,crowdInfo); // 每一个发起人的钱包地址作为众筹的key

    var investment = new Investment(); // 初始化投资人信息
    console.log('初始化众筹，investment: ',investment)
    this.investinfo.put(from,investment);
  },

  /**
   * 查询众筹信息
   * */
  getCrowdInfo: function (crowdKey) {
    var from = Blockchain.transaction.from;
    if(!crowdKey) crowdKey = from;
    return this.crowdsale.get(crowdKey);
  },

  /**
   * 查询投资人信息
   * */
  getInvestInfo: function (crowdKey) {
    var from = Blockchain.transaction.from;
    if(!crowdKey) crowdKey = from;
    return this.investinfo.get(crowdKey);
  },

  /**
   * 私有方法
   * 检查众筹时间是否截止
   * */
  _checkDeadlineReached: function (crowdInfo) {
    var deadline = crowdInfo.deadline;
    var currentTime = Number(new Date());
    return currentTime >= deadline;
  },

  /**
   * 私有方法
   * 检查众筹目标是否达成
   * */
  _checkGoalReached: function (crowdInfo) {
    if(this._checkDeadlineReached(crowdInfo)) {
      var fundingGoal = crowdInfo.fundingGoal;
      var amountRaised = crowdInfo.amountRaised;
      if(amountRaised >= fundingGoal)
        crowdInfo.fundingGoalReached = true; // 众筹目标达成

      crowdInfo.crowdsaleClosed = true; // 众筹时间截止，无论成功与否众筹都关闭
    } else {
      throw new Error('funding not finished');
    }
  },

  /**
   *  投资人投资，获取代币
   * */
  invest: function (crowdKey) {
    // 投资人钱包地址
    var from = Blockchain.transaction.from;
    // 投资额度
    var value = Blockchain.transaction.value;

    var crowdInfo = this.crowdsale.get(crowdKey);
    if(!crowdInfo) throw new Error('funding not initial');
    // 众筹时间截止，无法投资
    if(this._checkDeadlineReached(crowdInfo))
      throw new Error('funding is closed');

    // 投资额增加
    crowdInfo.amountRaised += new BigNumber(value);
    console.log('新增投资人，crowdInfo: ',crowdInfo)
    this.crowdsale.set(crowdKey,crowdInfo);

    // 记录投资人信息
    var invest = {
      investor: from, // 投资人钱包
      amount: value, // 投资金额
      time: Number(new Date()), // 投资时间
      token: new BigNumber(0) // 获得的代币数
    }
    var invests = this.investinfo.get(crowdKey);
    invests.investment.push(invest);
    console.log('新增投资人，invests: ',invests)
    this.investinfo.set(crowdKey,invests);
  },

  /**
   * 众筹时间到
   * 完成众筹目标，融资款发送到收款方，发放给投资人代币
   * 未完成融资目标，执行退款，投资人获得退款
   * */
  safeWithdrawal: function (crowdKey) {
    // 发起人钱包地址，正常也是收款人钱包地址
    var from = Blockchain.transaction.from;
    if(from != crowdKey)
      throw new Error('only funding sponsor has the permission')

    var crowdInfo = this.crowdsale.get(crowdKey);
    if (!this._checkDeadlineReached(crowdInfo))
      throw new Error('funding is not closed')

    this._checkGoalReached(crowdInfo);

    // 获取投资人信息
    var invests = this.investinfo.get(crowdKey);

    if(crowdInfo.fundingGoalReached) { // 众筹目标达成
      if(from == crowdInfo.beneficiary){ // 权限认证通过
        // 募集资金打给募集方
        var amountRaised = crowdInfo.amountRaised;
        this._transfer(from, amountRaised);

        for(item of invests) {
          // 给投资人发代币
          // 星云链暂不支持合约间调用，请在业务代码调用代币合约，并调用发行代币接口记录代币数
        }
      }
      else {
        crowdInfo.fundingGoalReached = false;
        this.crowdsale.set(crowdKey,crowdInfo);
      }
    }
    else { // 众筹目标未达成
      for(item of invests) {
        if(item.amount >0) {
          // 募集资金打回投资人账户
          this._transfer(item.investor,item.amount);
          item.amount = 0; // 清空链上投资金额
        }
      }
      this.investinfo.set(crowdKey,invests);

      crowdInfo.amountRaised = 0; // 清空链上投资总额度
      this.crowdsale.set(crowdKey,crowdInfo);
    }
  },

  /**
   * 私有方法
   * 转账
   * */
  _transfer: function (address, value) {
    var result = Blockchain.transfer(address, value);
    console.log("transfer result:", result);
    Event.Trigger("transfer", {
      Transfer: {
        from: Blockchain.transaction.to,
        to: address,
        value: value
      }
    });
  },

}

module.exports = CrowdsaleContract;
