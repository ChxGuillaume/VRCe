import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import friends from './modules/friends';
import worlds from './modules/worlds';

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    user: user,
    friends: friends,
    worlds: worlds
  }
})
