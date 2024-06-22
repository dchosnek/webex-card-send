const fs = require('fs');
const axios = require('axios');

/* 
 * Returns a map of the X most recent GROUP spaces the user belongs to.
 * The format is Map(X) { id1 => title1, id2 => title2 }
 * @param {string} token - Webex token for accessing API
 */
function findGroups(token) {
    return new Promise((resolve, reject) => {

        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://webexapis.com/v1/rooms?type=group&max=10',
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
                reject(err);
            }
        });
    })
}

/* 
 * Ask user to supply their Webex token
 * The return value is an object, and not a string.
 * @param {string} filePath - path the file to read
 */
async function askPassword() {
    const inquirer = await import('inquirer').then(module => module.default);

    const answers = await inquirer.prompt([
        {
            type: 'password',
            name: 'password',
            message: 'Enter your Webex token:',
            mask: '*', // This will mask the input with asterisks
        },
    ]);

    return answers.password;
}

/* 
 * Allow user to pick one item from a list.
 * The return value is the value of the name the user picked.
 * @param {string} message - prompt used to ask the user for input
 * @param {array} choices - list of maps with keys 'name' and 'value' for the choices presented to the user
 */
async function askFromList(message, choices) {
    const inquirer = await import('inquirer').then(module => module.default);

    const answer = await inquirer.prompt([
        {
            type: "list",
            name: "userSelection",
            message: message,
            choices: choices
        }
    ]);
    return answer.userSelection;
}

/* 
 * The main function for this script
 * @param {string} token - Webex token used for all API interactions
 */
async function mainFunc(token) {
    try {
        // ask user where to send the message
        const roomList = await findGroups(token);
        const roomId = await askFromList("Where do you want to send the card?", roomList);
        
        // ask user which JSON file to send
        const files = fs.readdirSync('./').filter(fn => fn.endsWith('.json')).map(fn => ({
            name: fn, 
            value: fn
        }));
        const filename = await askFromList("Which card do you want to send?", files)
        const card = await readJsonFile(filename);

        // send the requested card to the requested room
        const status = await sendAttachment(token, roomId, card);
        console.log(status);
    } catch (error) {
        console.log(error);
    }
}


// retrieve token from environment variable
const tokenEnv = process.env.TOKEN;

// if the token is defined, use it
if (tokenEnv) {
    mainFunc(tokenEnv);

    // if the token is not defined, ask the user for the token
} else {
    askPassword().then(password => {
        mainFunc(password);
    });
}