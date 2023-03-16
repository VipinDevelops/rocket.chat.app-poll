import { BlockBuilder, BlockElementType } from '@rocket.chat/apps-engine/definition/uikit';

import { IPoll, pollVisibility } from '../definition';
import { buildVoteGraph } from './buildVoteGraph';
import { buildVoters } from './buildVoters';

//function to calculate total voters 
function getUniqueVoters(poll: IPoll): number {
    const uniqueVoters = new Set();
    poll.votes.forEach((vote) => {
        vote.voters.forEach((voter) => {
            uniqueVoters.add(voter.id);
        });
    });
    return uniqueVoters.size;
}

export function createPollBlocks(block: BlockBuilder, question: string, options: Array<any>, poll: IPoll, showNames: boolean, timeZone: string, anonymousOptions: Array<string>, wordCloud: boolean) {
    block.addSectionBlock({
        text: block.newMarkdownTextObject(`${question}`),
        ...!poll.finished && {
            accessory: {
                type: BlockElementType.OVERFLOW_MENU,
                actionId: 'finish',
                options: [
                    {
                        text: block.newPlainTextObject('Finish poll'),
                        value: 'finish',
                    },
                ],
            },
        },
    });

    if (poll.activeLivePoll && !poll.finished) {
        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(`The poll will finish at *${poll.livePollEndTime}*`),
            ],
        });
    }

    if (poll.finished) {
        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(`The poll has been finished at *${new Intl.DateTimeFormat('en-GB', {
                    timeZone,
                    weekday: 'long',
                    month: 'long',
                    year: 'numeric',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'long',
                }).format(new Date())}*`),
            ],
        });
    }


    const maxVoteQuantity = Math.max(...poll.votes.map((vote) => vote.quantity));
    // Forms array of option indices with maximum votes (more than 1 option can be max-voted)
    const maxVoteIndices = poll.votes
        .map((vote) => vote.quantity)
        .reduce((ind: Array<number>, el, i) => {
            if (el === maxVoteQuantity) {
                ind.push(i);
            }
            return ind;
        }, []);
    options.forEach((option, index) => {
        block.addDividerBlock();
        block.addSectionBlock({
            text: block.newPlainTextObject(option),
            ...!poll.finished && {
                    accessory: {
                    type: BlockElementType.BUTTON,
                    actionId: 'vote',
                    text: block.newPlainTextObject('Vote'),
                    value: String(index),
                },
            },
        });

        if (!poll.votes[index]) {
            return;
        }

        const graph = buildVoteGraph(poll.votes[index], poll.totalVotes, maxVoteIndices.includes(index));
        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(graph),
            ],
        });

        if (poll.visibility === pollVisibility.confidential) {
            return;
        }
        const voters = buildVoters(poll.votes[index], showNames, anonymousOptions.includes(poll.options[index]));
        if (!voters) {
            return;
        }

        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(voters),
            ],
        });
    });

    // Next Poll Button if live poll
    if (poll.pollIndex !== undefined && poll.totalLivePolls && (poll.pollIndex < poll.totalLivePolls - 1) && poll.activeLivePoll) {
        block
        .addActionsBlock({
            elements: [
                block.newButtonElement({
                    actionId: 'nextPoll',
                    text: block.newPlainTextObject('Next Poll'),
                }),
            ],
        });
    }

    // Add Option button
    if (!poll.finished && poll.allowAddingOptions) {
        block
        .addActionsBlock({
            elements: [
                block.newButtonElement({
                    actionId: 'addUserChoice',
                    text: block.newPlainTextObject('Add option'),
                }),
            ],
        });
    }

    // Add text block for total votes
    block.addDividerBlock();

    // Word cloud when Internet access disabled
    if (poll.finished && poll.wordCloud && !wordCloud) {
        const responseSummary = poll.votes.map((vote, index) => {
            return `${poll.options[index]}(${vote.quantity})`;
        }).join(' ');
        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(`*Poll summary*: ${responseSummary}`),
            ],
        });
    }

    block.addContextBlock({
        elements: [
            block.newMarkdownTextObject(`*${poll.totalVotes}* total votes | *${getUniqueVoters(poll)}* users voted ${poll.finished ? '| *Final Results*' : ''}`),
        ],
    });
}