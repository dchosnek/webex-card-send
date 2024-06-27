/**
 * @file        findSpaces.js
 * @description Searches for Webex spaces by name
 * @version     1.0.0
 * @license     MIT
 * 
 * @author      Doron Chosnek
 * @date        2024-06-22
 */

const axios = require('axios');
const fs = require('fs');

/* 
 * Ask user to supply their Webex token
 * The return value is a string
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
 * Append items to a file containing a JSON list
 * @param {string} filename - name of the file containing JSON
 * @param {string} newContent - additional items to add to the list
 */
async function appendJsonToFile(filename, newContent) {
    // retrieve current content of the file
    let currentContent;
    try {
        const contents = fs.readFileSync(filename, 'utf8');
        currentContent = JSON.parse(contents);
    } catch {
        // if the file did not exist, create an empty list
        currentContent = new Array();
    }
    // write out the combined content to a file (async)
    const combined = currentContent.concat(newContent);
    fs.writeFile(filename, JSON.stringify(combined, null, 2), (err) => {
        if (err) throw err;
    });
}

/* 
 * Main function for this script
 * @param {string} token - token to use for the Webex API
 */
async function mainFunc(token) {
    const inquirer = await import('inquirer').then(module => module.default);

    // ask the user what type of space (direct/group/both) and what text to
    // search for in the title of the space
    const answers = await inquirer.prompt([
        {
            type: "list",
            name: "searchType",
            message: "What type of space?",
            choices: [
                { name: "direct", value: "direct" },
                { name: "group", value: "group" },
                { name: "both", value: "" }
            ]
        },
        {
            type: "input",
            name: "searchTerm",
            message: "What do you want to search for?",
        }
    ]);

    // API call to list all rooms of a certain type (default = 100 entries)
    // if the searchType is blank, the API will return both group and direct
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://webexapis.com/v1/rooms?sortBy=lastactivity&max=200&type=${answers.searchType}`,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    // wait for the API get to complete
    const response = await axios.request(config);

    // the API returns a list of spaces under the keyword "items"
    const items = response.data.items;

    // convert the searchTerm to lowercase here so we don't have to repeat that operation
    const pattern = answers.searchTerm.toLowerCase();

    // filter the spaces to only those that match the search term and then
    // display the title and id of each matching space with the keywords "name"
    // and "value"
    const matches = items
        .filter((element) => element.title.toLowerCase().includes(pattern))
        .map(element => ({
            name: element.title,
            value: element.id
        }));

    // use JSON.stringify so the console output can be copied into the 
    // favorites.json file without modification
    console.log(JSON.stringify(matches, null, 2));

    const confirm = await inquirer.prompt([
        {
            type: "confirm",
            name: "appendTrue",
            message: "Do you want to save to your favorites?",
            default: true
        }
    ]);

    // append the results found earlier to the favorites.json file
    if (confirm.appendTrue) {
        appendJsonToFile('favorites.json', matches);
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