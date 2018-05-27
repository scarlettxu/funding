<template>
  <div>
    <Button @click="init">发起众筹</Button>
    <Button @click="queryCrowd">查询众筹</Button>
    <Button @click="invest">参与众筹</Button>
    <Button @click="queryInvestor">查询投资人</Button>
    <Button @click="finishCrowd">众筹结束</Button>
  </div>

</template>

<script type="text/javascript">
  import API from '../js/nebulas-api';
  const contract_addr = 'n1sW7YYeHfoAnnmH4Xdyipex1K4piPcBoC3';
  const wallet_addr = 'n1QxjStHRhbWUtRgUChQkJAwZYCExL2crAV';

  export default {
  name: 'Content',
  data () {
    return {

    }
  },
  mounted(){
  },
  watch: {
  },
  computed: {
  },
  methods: {
    /**
     * 调用合约set方法
     * */
    callSet: function () {
      var arg1 = {
        beneficiary: wallet_addr,
        fundingGoal: 1000000,
        startTime: Number(new Date()),
        deadline: Number(new Date('2018-06-24')),
        price: 100,
      }

      var option = {
        contract_addr: contract_addr,
        callFunction: "initCrowd",
        callArgs: [arg1],
      }
      API.set(option,this.callGet);
    },

    /**
     * 调用合约get方法
     * */
    callGet: function () {
      var option = {
        callFunction: "getCrowdInfo",
        contract_addr: contract_addr,
      };
      API.get(option);
    },

    init: function () {
      var arg1 = {
        beneficiary: wallet_addr,
        fundingGoal: 1000000,
        startTime: Number(new Date()),
        deadline: Number(new Date('2018-06-24')),
        price: 100,
      }

      var option = {
        contract_addr: contract_addr,
        callFunction: "initCrowd",
        callArgs: [arg1],
        listener: false,
      }
      API.set(option);
    },
    invest: function () {
      var arg1 = wallet_addr;

      var option = {
        contract_addr: contract_addr,
        callFunction: "invest",
        callArgs: [arg1],
        listener: true,
      }
      API.set(option);
    },
    finishCrowd: function () {
      var arg1 = wallet_addr;

      var option = {
        contract_addr: contract_addr,
        callFunction: "safeWithdrawal",
        callArgs: [arg1],
        listener: false,
      }
      API.set(option);
    },

    queryCrowd: function () {
      var option = {
        callFunction: "getCrowdInfo",
        contract_addr: contract_addr,
      };
      API.get(option);
    },

    queryInvestor: function () {
      var option = {
        callFunction: "getInvestInfo",
        contract_addr: contract_addr,
      };
      API.get(option);
    },

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

  .bank{
    padding: .5rem;
    width: 100%;
    height: 100%;
    font-size: .25rem;
    z-index: 998;
  }
  .select,.ivu-input-type{
    width: 2rem;
    margin-left: .1rem;
  }
  .option{
    padding-left: .1rem;
  }
  .ivu-col-span-4{
    text-align: center;
    line-height: .64rem;
  }
  .ivu-col-span-6{
    text-align: left;
  }
  .ivu-input-disabled{
    color: black;
  }
  .space-between{
    margin-left: .5rem;
  }
  .tag{
    height: .6rem;
    font-size: .32rem;
    line-height: .6rem;
    margin: 0 0 .4rem .2rem;
  }
  .ivu-btn-ghost {
    background-color: indianred;
    margin-left: .1rem;
    opacity: .7;
  }
</style>
