# Send Webex Adaptive Card

Node.js script to send an adaptive card to a Webex space. Webex does not provide a user interface to do this. This project is an attempt to make this task more approachable.

# Installation

## Install Node.js

You will need to install Node.js from:

* **Easy**: [nodejs.org](https://nodejs.org/en)
* **Medium**: [Homebrew](https://brew.sh/) (for Mac users only) 
* **Nerdy**: [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm)

You can choose the latest LTS (long term support) release. This script was built and tested with v20.11.1. Verify Node is installed properly by displaying the version number.

```
node --version
```


## Download this repository

If you are familiar with `git`, then just clone this repo. If not, download it as a `zip` file and expand it.


## Install dependencies

Open a terminal window in the project directory and type the following command.

```
npm install
```

# Usage

## Design a card

Use the [Webex Card Designer](https://developer.webex.com/buttons-and-cards-designer) to create your own adaptive card. Save the card using the button labeled `Copy card payload` to a file with a `.json` extension. You can name it anything you like as long as it ends in `.json`. The file must be saved in the `cards/` directory in this project.

## Get your Webex API token

Go [here](https://developer.webex.com/docs/api/v1/messages/create-a-message) and log in with your credentials. You will then be able to copy your Webex token which will remain valid for 12 hours or until you log out from the Webex Developer Portal.

## Run the script

The script will prompt you for everything it needs (including your token). Just run the script as shown here:

```
node sendCard.js
```

# Additional scripts

There are additional utility scripts in this repo.

1. `findSpaces.js` is used to locate Webex rooms/spaces by name. It will return all matching names and roomIds and ask if you would like to add it to your favorites.
1. `findCards.js` is used to retrieve all adaptive cards sent in the `X` most recent used spaces.