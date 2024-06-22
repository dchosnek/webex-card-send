# Send Webex Adaptive Card

Node.js script to send an adaptive card to a Webex space.

You will need to retrieve a token from [the Webex developer portal](https://developer.webex.com/).

## Install Node

**You only need to do this once!**

You will need to install Node from:

* **Easy**: [nodejs.org](https://nodejs.org/en)
* **Medium**: [Homebrew](https://brew.sh/) (for Mac users only) 
* **Nerdy**: [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm)

Once you have Node installed and this repository downloaded, run the following command to install the dependencies.

```
npm install
```

## Build a card

Use the [Webex Card Designer](https://developer.webex.com/buttons-and-cards-designer) to create your own adaptive card. Save the card using the button labeled `Copy card payload` to a file with a `.json` extension. You can name it anything you like as long as it ends in `.json`.

## Run the script

The script will prompt you for everything it needs. Just run the script as shown here:

```
node sendCard.js
```
