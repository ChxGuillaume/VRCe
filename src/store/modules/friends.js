import formatFriendData from "../utils/formatFriendData";

const state = () => ({
    friends: [],
    favorite_friends: [],
})

const getters = {}

const actions = {
    fetchData({commit, dispatch, state}, data) {
        const {offline = false, offset = 0} = data || {};
        const count = 100;

        fetch(`https://vrchat.com/api/1/auth/user/friends?offline=${offline}&n=${count}&offset=${offset}`)
            .then(res => res.json())
            .then(data => {
                data.forEach(friend => formatFriendData(friend, state.favorite_friends));

                // data.forEach(friend => {
                //     const splicedLocation = friend.location.split(':');
                //
                //     if (splicedLocation && splicedLocation[0].startsWith('wrld_'))
                //         this.fetchWorld(splicedLocation[0]);
                // });

                commit('addFriends', data);

                if (data.length === count)
                    dispatch('fetchData', {offline, offset: offset + count});
                else if (!offline && data.length !== count)
                    dispatch('fetchData', {offline: true, offset: 0});
            })
    },
}

const mutations = {
    addFriends(state, friends) {
        state.friends.push(...friends);
        console.log(state.friends);
    },
    setFavoriteFriends(state, favoriteFriends) {
        state.favorite_friends = favoriteFriends;
    },
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
