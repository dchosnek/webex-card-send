# Advanced usage

## Save your token

If you're going to send more than one card or send it more than once, you should save your Webex token as an environment variable. You will not be asked for your token if it is saved as an environment variable. On a Mac:

```
export TOKEN=Yzgy0NTQtNTAxMkzMDY5ZTJhMTFjN...
```

## Finding spaces (rooms)

If you're trying to send a card using `sendCard.js` and can't locate your desired space, you can search for more spaces using another utility in this repo.

```
node findSpaces.js
```

You will be asked whether to search through group or direct (individual) spaces, and what search term to use.

Here is an example of the output:

```json
[
  {
    "name": "Project Zebra",
    "value": "Y2lzY29zcGFyazov..."
  },
  {
    "name": "informal zebra chat",
    "value": "Y2lzY29zcGFyazov..."
  },
  {
    "name": "zebra team deadlines",
    "value": "Y2lzY29zcGFyazov..."
  }
]
```

You can copy individual entries to the `favorites.json` file manually, or the script can copy all of the results to the favorites file for you.

