const axios = require('axios');

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


async function mainFunc(token) {
    const inquirer = await import('inquirer').then(module => module.default);

    const answers = await inquirer.prompt([
        {
            type: "list",
            name: "searchType",
            message: "What type of space",
            choices: [
                { name: "direct", value: "direct" },
                { name: "group", value: "group" },
                { name: "both", value: "" }
            ]
        },
        {
            type: "input",
            name: "searchTerm",
            message: "What do you want to search for",
        }
    ]);

    // API call to list all rooms of a certain type (default = 100 entries)
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://webexapis.com/v1/rooms?sortBy=lastactivity&type=${answers.searchType}`,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const response = await axios.request(config);
    const items = response.data.items;
    const pattern = answers.searchTerm.toLowerCase();
    const matches = items.filter((element) => element.title.toLowerCase().includes(pattern));
    console.log(matches.map(element => ({
        name: element.title,
        value: element.id
    })));

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