/**
 * @file        sendCard.js
 * @description Sends an Adaptive Card via Webex
 * @version     1.0.0
 * @license     MIT
 * 
 * @author      Doron Chosnek
 * @date        2025-02-14
 */

const axios = require('axios');

/* 
 * Returns a list of IDs of the num most recent spaces the user belongs to.
 * @param {string} token - Webex token for accessing API
 * @param {integer} num - number of rooms to return
 */
function findRooms(token, num) {
    return new Promise((resolve, reject) => {

        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://webexapis.com/v1/rooms?type=group&sortBy=lastactivity&max=${num}`,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        axios.request(config)
            .then(response => {
                // retrieve the IDs from the JSON payload
                const rooms = response.data.items.map(x => ({id: x.id, title:x.title}));
                resolve(rooms);
            })
            .catch(error => {
                // in the event of an error return the HTTP code and status
                reject(`${error.response.status}: ${error.response.statusText}`);
            })
    });
}

/* 
 * Returns the entire contents of any messages that contain "attachments" (cards).
 * @param {string} token - Webex token for accessing API
 * @param {string} roomId - the ID of the room to search
 */
function findCards(token, roomId, roomTitle) {
    return new Promise((resolve, reject) => {

        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://webexapis.com/v1/messages?roomId=${roomId}`,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        axios.request(config)
            .then(response => {
                // save only messages that have attachments and add roomTitle
                // to each message
                const messages = response.data.items
                    .filter(msg => msg.hasOwnProperty('attachments'))
                    .map(msg => ({...msg, roomTitle: roomTitle}));
                resolve(messages);
            })
            .catch(error => {
                reject(error);
            })
    });
}

/*
 * Get the user's Webex token from environment variable or by prompt
 * The return value is a string
 */
async function getToken() {
    // retrieve token from environment variable
    const tokenEnv = process.env.TOKEN;

    // if the token exists as an EV, return it
    if (tokenEnv) {
        return tokenEnv;
    
    // if the token does not exist as an EV, prompt user for it
    } else {
        const inquirer = await import('inquirer').then(module => module.default);

        const answers = await inquirer.prompt([
            {
                type: 'password',
                name: 'token',
                message: 'Enter your Webex token:',
                mask: '*', // This will mask the input with asterisks
            },
        ]);

        return answers.token;
    }
}

async function main(max) {
    const inquirer = await import('inquirer').then(module => module.default);
    const clipboardy = await import('clipboardy').then(module => module.default);

    // get the user token either from EV or by prompting user
    const token = await getToken();

    // retrieve a list of most recently used group rooms
    const rooms = await findRooms(token, max);
    
    // look for messages inside each of these rooms
    const unresolved = rooms.map(x => findCards(token, x.id, x.title));
    const results = await Promise.all(unresolved);

    // combine the list of lists into a single list
    const cardList = new Array();
    results.forEach(x => cardList.push(...x));
    cardList.sort((a,b) => a.created - b.created);
    const choices = cardList.map(x =>
        ({
            name: `${x.created} by ${x.personEmail} in ${x.roomTitle}`,
            value: x.id,
        })
    );

    const { messageId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'messageId',  // This must match the destructured variable name
            message: 'Choose the card to copy:',
            choices: choices,
            loop: false,
        },
    ]);

    const selectedMessage = cardList.find(x => x.id === messageId)
    const card = selectedMessage.attachments[0].content;

    clipboardy.writeSync(JSON.stringify(card,null,2));
    console.log("Card payload copied to clipboard");
}


// Run the main function, and catch/display any errors
main(40).catch(error => {
    console.log(error.message);
});
