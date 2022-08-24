import * as moment from "moment";

const state = () => ({
    worldsArray: [],
    worldsObject: {},
    privateWorld: {
        name: 'Private World',
        thumbnailImageUrl: 'https://assets.vrchat.com/www/images/default_private_image.png'
    },
    travelingWorld: {
        name: 'Traveling Worlds',
        thumbnailImageUrl: 'https://assets.vrchat.com/www/images/default_between_image.png'
    }
})

const getters = {
    getWorld: (state) => (worldId) => {
        return state.worldsObject[worldId]
    },
}

const actions = {
    fetchWorld({commit}, worldId) {
        if (worldId !== 'private') {
            fetch(`https://vrchat.com/api/1/worlds/${worldId}`)
                .then(response => response.json())
                .then(data => {
                    data.created_at = moment(data.created_at).format('YYYY-MM-DD HH:mm:ss');
                    data.updated_at = moment(data.updated_at).format('YYYY-MM-DD HH:mm:ss');

                    data.publicationDate = data.publicationDate !== 'none'
                        ? moment(data.publicationDate).format('YYYY-MM-DD HH:mm:ss')
                        : data.publicationDate;

                    data.labsPublicationDate = data.labsPublicationDate !== 'none'
                        ? moment(data.labsPublicationDate).format('YYYY-MM-DD HH:mm:ss')
                        : data.labsPublicationDate;

                    data.author_tags = data.tags.filter(e => e.includes('author_tag')).map(e => e.replace('author_tag_', '')) || [];

                    commit('addWorld', data);
                })
        }
    },
}

const mutations = {
    addWorld(state, world) {
        if (!state.worldsObject[world.id]) {
            state.worldsArray.push(world);
            state.worldsObject[world.id] = world;
        }
    },
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
