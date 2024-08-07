/**
 * @file        sendCard.js
 * @description Sends an Adaptive Card via Webex
 * @version     1.0.0
 * @license     MIT
 * 
 * @author      Doron Chosnek
 * @date        2024-06-22
 */

const fs = require('fs');
const axios = require('axios');

/* 
 * Returns a list of the X most recent GROUP spaces the user belongs to.
 * The format of each item in the list is { name: room.title, value: room.id }
 * @param {string} token - Webex token for accessing API
 */
function findGroups(token) {
    return new Promise((resolve, reject) => {

        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://webexapis.com/v1/rooms?type=group&max=20&sortBy=lastactivity',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        axios.request(config)
            .then(response => {
                // create the return map of title=>id
                const rooms = new Array();
                response.data.items.forEach(element => {
                    rooms.push({ name: element.title, value: element.id });
                })
                resolve(rooms);
            })
            .catch(error => {
                // in the event of an error return the HTTP code and status
                reject(`${error.response.status}: ${error.response.statusText}`);
            })
    });
}

/* 
 * Sends an adaptive card to the specified Webex space.
 * The return value is the status message of the operation.
 * @param {string} token - Webex token for accessing API
 * @param {string} roomId - the id of the target space
 * @param {object} card - JSON representation of the adapative card
 */
function sendAttachment(token, roomId, card) {
    return new Promise((resolve, reject) => {
        const cardText = JSON.stringify(card);
        const data = JSON.stringify({
            "roomId": `${roomId}`,
            "markdown": "Card could not render",
            "attachments": [
                {
                    "contentType": "application/vnd.microsoft.card.adaptive",
                    "content": card
                }
            ]
        });

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://webexapis.com/v1/messages',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: data
        };

        axios.request(config)
            .then(response => {
                resolve(response.statusText);
            })
            .catch(error => {
                reject(`${error.response.status}: ${error.response.statusText}`)
            });
    });
}

/* 
 * Return the JSON contents of the specified file.
 * The return value is an object, and not a string.
 * @param {string} filePath - path the file to read
 */
function readJsonFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            try {
                const jsonData = JSON.parse(data);
                resolve(jsonData);
            } catch (err) {
                // if JSON parsing failed, return gracefully and let the
                // calling function handle the error
                resolve(null);
            }
        });
    })
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

/* 
 * Allow users to pick both room and card from a list.
 * The return value is a list of the values the user picked.
 * @param {array} faveList - list of maps of favorite rooms
 * @param {array} roomList - list of maps of rooms
 * @param {array} fileList - list of maps of filenames for cards
 */
async function askQuestions(faveList, roomList, fileList) {
    const inquirer = await import('inquirer').then(module => module.default);

    // if there are favorites, put them at the top of the list of choices
    // with a separator between them and the other rooms listed
    let roomChoices;
    if (faveList.length) {
        roomChoices = [...faveList, new inquirer.Separator(), ...roomList];
    } else {
        roomChoices = roomList
    }

    const answers = await inquirer.prompt([
        {
            type: "list",
            name: "file",
            message: "Which card do you want to send?",
            loop: false,
            choices: fileList
        },
        {
            type: "list",
            name: "room",
            message: "Where do you want to send the card?",
            loop: false,
            choices: roomChoices
        },
    ]);

    return [answers.room, answers.file];
}

/* 
 * The main function for this script
 * @param {string} token - Webex token used for all API interactions
 */
async function main() {

    // get the user token either from EV or by prompting user
    const token = await getToken();

    // check for favorites
    let favorites;
    try {
        const contents = fs.readFileSync('favorites.json', 'utf8');
        favorites = JSON.parse(contents);
    } catch {
        // if the favorites file did not exist, create an empty list of favorites
        favorites = new Array();
    }

    try {
        // get list of recent active rooms for the user
        const roomList = await findGroups(token);

        // get a list of local JSON files
        const files = fs.readdirSync('cards/')
            .filter(fn => fn.endsWith('.json') || fn.endsWith('.txt'))
            .map(fn => ({
                name: fn,
                value: `cards/${fn}`
            }));

        // ask the user which card to send and which room to send it to
        const [roomId, filename] = await askQuestions(favorites, roomList, files);

        // retrieve the actual card contents
        const card = await readJsonFile(filename);

        // send the requested card to the requested room
        if (card) {
            const status = await sendAttachment(token, roomId, card);
            console.log(status);
        } else {
            console.log('\nCannot send. The file does not contain valid JSON.\n')
        }

        // udpate the favorites if we used a roomId that was not already in
        // the list of favorites
        if (!favorites.find(map => map.value === roomId)) {
            const roomName = roomList.find(map => map.value === roomId).name;
            favorites.unshift({ name: roomName, value: roomId });

            // write out the favorites to a file (async)
            fs.writeFile('favorites.json', JSON.stringify(favorites, null, 2), (err) => {
                if (err) throw err;
            });
        }

    } catch (error) {
        console.log(error);
    }

}


// Run the main function, and catch/display any errors
main().catch(error => {
    console.log(error.message);
});
