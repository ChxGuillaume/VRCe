import formatFriendData from "@/store/utils/formatFriendData";

const state = () => ({
    data: {
        id: "",
        username: "",
        displayName: "",
        userIcon: "",
        bio: "",
        bioLinks: [],
        profilePicOverride: "",
        statusDescription: "",
        pastDisplayNames: [],
        hasEmail: true,
        hasPendingEmail: false,
        obfuscatedEmail: "",
        obfuscatedPendingEmail: "",
        emailVerified: true,
        hasBirthday: true,
        unsubscribe: false,
        statusHistory: [],
        statusFirstTime: false,
        friends: [],
        friendGroupNames: [],
        currentAvatarImageUrl: "",
        currentAvatarThumbnailImageUrl: "",
        currentAvatar: "",
        currentAvatarAssetUrl: "",
        fallbackAvatar: "",
        accountDeletionDate: null,
        acceptedTOSVersion: 7,
        steamId: "",
        steamDetails: {},
        oculusId: "",
        hasLoggedInFromClient: true,
        homeLocation: "",
        twoFactorAuthEnabled: true,
        twoFactorAuthEnabledDate: "",
        state: "",
        tags: [],
        developerType: "none",
        last_login: "",
        last_platform: "",
        allowAvatarCopying: false,
        status: "",
        date_joined: "",
        isFriend: false,
        friendKey: "",
        last_activity: "",
        onlineFriends: [],
        activeFriends: [],
        offlineFriends: []
    },
    logged_in: false,
})

const getters = {}

const actions = {
    fetchData({commit, state}) {
        return new Promise((resolve, reject) => {
            if (!state.logged_in)
                fetch('https://vrchat.com/api/1/auth/user')
                    .then(response => {
                        if (response.status !== 200)
                            commit('setLoggedIn', false);

                        return response.json();
                    })
                    .then(data => {
                        if (!data.error) {
                            formatFriendData(data);

                            commit('setData', data);
                            commit('setLoggedIn', true);
                            resolve();
                        } else reject(data.error);
                    })
                    .catch(error => reject(error));
            else resolve();
        })
    },
    logout({commit}) {
        return new Promise((resolve, reject) => {
            fetch('https://vrchat.com/api/1/logout', {
                method: 'PUT'
            }).then(() => {
                commit('logout');
                resolve();
            }).catch(error => reject(error));
        })
    },
}

const mutations = {
    setData(state, data) {
        state.data = data;
    },
    setLoggedIn(state, logged_in) {
        state.logged_in = logged_in;
    },
    logout(state) {
        state.logged_in = false;
        state.data = {};
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
