// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import './css/main.css'
// import './js/bank-contract'
import { Row, Col, Select, Option, Input, Button,Tag,Modal } from 'iview';
import 'iview/dist/styles/iview.css';
Vue.component('Row', Row);
Vue.component('Col', Col);
Vue.component('Select', Select);
Vue.component('Option', Option);
Vue.component('Input', Input);
Vue.component('Button', Button);
Vue.component('Tag', Tag);
// Vue.component('Modal', Modal);
Vue.prototype.$Modal = Modal

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
