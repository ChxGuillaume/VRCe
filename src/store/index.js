import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import friends from './modules/friends';

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    user: user,
    friends: friends
  }
})
