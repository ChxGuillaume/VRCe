const state = () => ({
    data: {
        acceptedTOSVersion: 7,
        accountDeletionDate: null,
        allowAvatarCopying: false,
        bio: "",
        bioLinks: [],
        currentAvatar: "",
        currentAvatarAssetUrl: "",
        currentAvatarImageUrl: "",
        currentAvatarThumbnailImageUrl: "",
        date_joined: "",
        developerType: "",
        displayName: "",
        emailVerified: true,
        fallbackAvatar: "",
        friendGroupNames: [],
        friendKey: "",
        friends: [],
        hasBirthday: true,
        hasEmail: true,
        hasLoggedInFromClient: true,
        hasPendingEmail: false,
        homeLocation: "",
        id: "",
        isFriend: false,
        last_activity: "",
        last_login: "",
        last_platform: "",
        obfuscatedEmail: "",
        obfuscatedPendingEmail: "",
        oculusId: "",
        pastDisplayNames: [],
        profilePicOverride: "",
        state: "",
        status: "",
        statusDescription: "",
        statusFirstTime: false,
        statusHistory: [],
        steamDetails: {},
        steamId: "",
        tags: [],
        twoFactorAuthEnabled: true,
        twoFactorAuthEnabledDate: "",
        unsubscribe: false,
        userIcon: "",
        username: "",
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
                            commit('setData', data);
                            resolve();
                        } else reject();
                    });
            else resolve();
        })
    }
}

const mutations = {
    setData(state, data) {
        state.data = data;
        console.log(data)
    },
    setLoggedIn(state, logged_in) {
        state.logged_in = logged_in;
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
