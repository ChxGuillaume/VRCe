import formatFriendData from "../utils/formatFriendData";

const state = () => ({
    friendsArray: [],
    friendsObject: {},
    favorite_friends: [],
    user_details: {},
})

const getters = {}

const actions = {
    fetchData({commit, dispatch, state, rootState: { user: { data: user } }}, data) {
        const {offline = false, offset = 0} = data || {};
        const count = 100;

        fetch(`https://vrchat.com/api/1/auth/user/friends?offline=${offline}&n=${count}&offset=${offset}`)
            .then(res => res.json())
            .then(data => {
                data.forEach(friend => formatFriendData(friend, state.favorite_friends, user.activeFriends, user.friends));

                data.forEach(friend => {
                    const splicedLocation = friend.location.split(':');

                    if (splicedLocation && splicedLocation[0].startsWith('wrld_'))
                        dispatch('worlds/fetchWorld', splicedLocation[0], {root: true});
                });

                commit('addFriends', data);

                if (data.length === count)
                    dispatch('fetchData', {offline, offset: offset + count});
                else if (!offline && data.length !== count)
                    dispatch('fetchData', {offline: true, offset: 0});
            })
    },
    fetchUserDetails({commit, dispatch, state, rootState: { user: { data: user } }}, friend_id) {
        commit('setUserDetails', {});

        fetch(`https://vrchat.com/api/1/users/${friend_id}`)
            .then(response => response.json())
            .then(data => {
                formatFriendData(data, state.favorite_friends, user.activeFriends, user.friends);
                commit('setUserDetails', data);

                if (data.worldId && !['offline'].includes(data.worldId))
                    dispatch('worlds/fetchWorld', data.worldId, {root: true});
            })
    },
}

const mutations = {
    addFriends(state, friends) {
        friends.forEach(friend => {
            if (!state.friendsObject[friend.id]) {
                state.friendsArray.push(friend);
                state.friendsObject[friend.id] = friend;
            }
        });
    },
    setFavoriteFriends(state, favoriteFriends) {
        state.favorite_friends = favoriteFriends;
    },
    setUserDetails(state, userDetails) {
        state.user_details = userDetails;
    },
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
