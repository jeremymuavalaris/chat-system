const WebSocket = require('ws'),
    readline = require('readline'),
    Actions = require('./models/Actions'),
    rl = readline.createInterface(process.stdin, process.stdout),
    ws = new WebSocket('ws://localhost:1234');

let _userName;

ws.onopen = function()
{
    return AskName()
    .then(function(name) {
        _userName = name;
        return RegisterName(_userName);
    })
    .then(function() {
        RequestMessageHistory();
        RecursiveAsyncReadLine();
    });
}

/**
 * 
 * @param {String} name Registers name with server
 */
function RegisterName(name)
{
    return new Promise(function(resolve) {
        let req = {
            action : Actions.REGISTER,
            data: name
        }
        resolve(ws.send(JSON.stringify(req)));
    });
}

function RequestMessageHistory()
{
    let req = {
        action: Actions.MESSAGE_HISTORY,
        data: null
    }
    ws.send(JSON.stringify(req));
}

function SendMessage(message)
{
    let req = {
        action: Actions.MESSAGE,
        data: message
    }
    ws.send(JSON.stringify(req));
}

function SendCommand(action, option)
{
    let req = {
        action: action,
        data: option
    }

    ws.send(JSON.stringify(req));
}

//Listener for messages from socket, and apporpriate logic
ws.onmessage = function(resp)
{
    let info = JSON.parse(resp.data),
        action = info.action,
        msg = info.message,
        userName = info.userName,
        msgToDisplay = "",
        skipMessage = false;

    switch(action)
    {
        case Actions.MESSAGE:
            msgToDisplay = userName + ": " + msg;
            break;
        case Actions.MESSAGE_HISTORY:
            for(let i = 0; i < msg.length; i++)
            {
                let value = msg[i],
                    msgToDisplay = value.userName + ": " + value.message;
                setTimeout(Log, 100, msgToDisplay, skipMessage);
            }
            return;
            break;
        case Actions.REGISTER:
            msgToDisplay = "User joined: " + msg;
            break;
        case Actions.GET_STATS:
            if (msg === undefined || msg.length <= 0)
            {
                skipMessage = true;
            }
            else 
            {
                let now = Date.now(),
                    timeDiff = now - msg;
                    msgToDisplay = "User Join time: " + msToTime(timeDiff);
            }

            break
        case Actions.POPULAR:
            msgToDisplay = "Most Popular word is: " + msg;
            break;
        default:
            skipMessage = true;
            break;
    }

    setTimeout(Log, 100, msgToDisplay, skipMessage);
}

/**
 *Funtion to convert unix timestamp to proper format
 *
 * @param {Int} duration
 * @returns
 */
function msToTime(duration)
{
    let seconds = parseInt((duration / 1000) % 60),
        minutes = parseInt((duration / (1000 * 60)) % 60),
        hours = parseInt((duration / (1000 * 60 * 60)) % 24),
        days = parseInt((duration / (1000 * 60 * 60 * 24)));

    days = (days < 10) ? "0" + days : days;
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return days + ":" + hours + ":" + minutes + ":" + seconds;
}

// Logs a message keeping prompt on last line
function Log(message, skipMessage = false) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    if (!skipMessage && message && (0 < message.length))
    {
        console.log(message);
    }
    rl.prompt(true);
}

/**
 * Recursive function to continue printing out prompts
 */
function RecursiveAsyncReadLine() {
    rl.question('Enter chat message: ', function (message) {
        if (message == 'exit') {
            rl.close();
            process.exit();
        }

        if (!CheckIfCommand(message))
        {
            SendMessage(message);
        };
        RecursiveAsyncReadLine(); 
    });
};

/**
 * Checks if message is a command. If so, act on it.
 *
 * @param {String} message
 * @returns
 */
function CheckIfCommand(message)
{
    if (message.charAt(0) === '/' && message.length > 1)
    {
        let subString = message.substring(1, message.length),
            words = subString.split(" ");
        if (words.length <= 2)
        {
            let command = words[0];

            switch(command)
            {
                case Actions.GET_STATS:
                    if (words[1] === "undefined")
                    {
                        return false
                    }

                    SendCommand(command, words[1]);
                    return true;
                    break;
                case Actions.POPULAR:
                    if (words.length === 1)
                    {
                        SendCommand(command, null);
                        return true;
                    }
                    break;
                default:
                    break;
            }
        }
    }

    return false;
}

function AskName () {
    return new Promise(function(resolve) {
        rl.question("Enter your name: ", userInput => {
            resolve(userInput);
        });
    })
};
