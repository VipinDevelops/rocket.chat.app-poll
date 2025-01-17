import { IVoter } from '../definition';

const votersNames = (voters: IVoter['voters'], showNames: boolean) =>
    voters.map(({ name, username }) => showNames ? name : username).join(' ');

export function buildVoters(votes: IVoter, showNames: boolean, anonymous: boolean) {
    if (!votes) {
        return '';
    }

    if (votes.quantity === 0) {
        return '';
    }

    const votesStr = votes.quantity === 1 ? 'vote' : 'votes';

    return `${ votes.quantity } ${ votesStr } - ${ anonymous ? 'Anonymous' : votersNames(votes.voters, showNames) }`;
}
