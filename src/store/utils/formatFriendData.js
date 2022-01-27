import * as moment from "moment";

const formatFriendData = (user, favorite_friends = [], active_friends = []) => {
    if (active_friends.includes(user.id))
        user.location = '';

    setRank(user);
    setStatus(user);
    setBioLinks(user);
    setLastLogin(user);
    setWorldIcon(user);
    setWorldLink(user);
    setLastPlatform(user);

    user.favorited = favorite_friends.includes(user.id);
    user.location_type = getLocationType(user.location);
    user.location_region = getLocationRegion(user.location);
}

const setRank = (user) => {
    const tags = user.tags

    if (tags.includes('system_legend') && tags.includes('system_trust_legend') && tags.includes('system_trust_trusted')) {
        user.rank = {color: '#FF69B4', name: 'Legend', power: 0}
    } else if (tags.includes('system_trust_legend') && tags.includes('system_trust_trusted')) {
        user.rank = {color: '#5D88BB', name: 'Veteran', power: 1}
    } else if (tags.includes('system_trust_veteran') && tags.includes('system_trust_trusted')) {
        user.rank = {color: '#8143E6', name: 'Trusted', power: 2}
    } else if (tags.includes('system_trust_trusted')) {
        user.rank = {color: '#FF7B42', name: 'Known', power: 3}
    } else if (tags.includes('system_trust_known')) {
        user.rank = {color: '#2BCF5C', name: 'User', power: 4}
    } else if (tags.includes('system_trust_basic')) {
        user.rank = {color: '#1778FF', name: 'New User', power: 5}
    } else {
        user.rank = {color: '#CCCCCC', name: 'Visitor', power: 6, light: true}
    }
};
const setStatus = (user) => {
    if (!user.location)
        user.status = {color: '#ebd23b', name: 'Active', power: 1, light: true};
    else if (user.state && user.state === 'offline')
        user.status = {color: '#CCCCCC', name: 'Offline', power: 0, light: true};
    else
        switch (user.status) {
            case 'join me':
                user.status = {color: '#42caff', name: 'Join Me', power: 5};
                break;
            case 'active':
                user.status = {color: '#60ad5e', name: 'Online', power: 4};
                break;
            case 'ask me':
                user.status = {color: '#e88134', name: 'Ask Me', power: 3};
                break;
            case 'busy':
                user.status = {color: '#5b0b0b', name: 'Busy', power: 2};
                break;
            case 'offline':
                user.status = {color: '#CCCCCC', name: 'Offline', power: 0, light: true};
                break;
            default:
                user.status = {color: '#CCCCCC', name: user.status, power: -1, light: true};
        }
};
const setBioLinks = (user) => {
    user.bioLinks = user.bioLinks ? user.bioLinks.filter(e => e) : [];
};
const setLastLogin = (user) => {
    user.last_login = moment(user.last_login).format('YYYY-MM-DD HH:mm:ss');
};
const setWorldIcon = (user) => {
    if (user.location && user.location !== 'offline') {
        switch (user.location) {
            case 'private':
                user.world_icon = 'public_off';
                break;
            default:
                user.world_icon = 'public';
        }
    } else user.world_icon = '';
};
const setWorldLink = (user) => {
    if (user.location.startsWith('wrld')) {
        user.world_link = `vrchat://launch?ref=vrchat.com&id=${user.location}`;
    }
};
const setLastPlatform = (user) => {
    switch (user.last_platform) {
        case 'standalonewindows':
            user.last_platform = 'PC/VR';
            break;
        case 'android':
            user.last_platform = 'Quest';
            break;
    }
};
const getLocationType = (location) => {
    const splicedLocation = location.split(':');

    if (location && !['private', 'offline'].includes(location)) {
        if (splicedLocation[1].includes('~private'))
            return 'invite/invite+';
        if (splicedLocation[1].includes('~hidden'))
            return 'friends+';
        else if (splicedLocation[1].includes('~friends'))
            return 'friends';
        else
            return 'public';
    } else return location;
};
const getLocationRegion = (location) => {
    const splicedLocation = location.split(':');

    if (location && !['private', 'offline'].includes(location)) {
        if (splicedLocation[1].includes('~region(eu)'))
            return 'eu';
        else if (splicedLocation[1].includes('~region(jp)'))
            return 'jp';
        else
            return 'us';
    } else return null;
};

export default formatFriendData;
