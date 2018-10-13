const User = require('../models/User'),
    Actions = require('../models/Actions'),
    ProfanityDictionary = require('../models/ProfanityDictionary'),
    ProfanityFilterManager = require('./ProfanityFilterManager'),
    dictionaryPath = './data/profanitylist.txt';
    popularWordTimeCutoff = 5000;   //5 seconds

/**
 * Main class that handles server chat logic
 *
 * @class ChatServerManager
 */
class ChatServerManager
{
    /**
     *Creates an instance of ChatServerManager.
     * @memberof ChatServerManager
     */
    constructor()
    {
        this.connectionUserMap = new Map();
        this.userMap = new Map();
        this.messageHistory = new Array();
        this.proprofanityFilterManager;

        let profanityDictionary = new ProfanityDictionary(),
            that = this;

        profanityDictionary.ReadInDictionary(dictionaryPath)
        .then(function(resp) {
            that.profanityFilterManager = new ProfanityFilterManager(profanityDictionary);
        })
    }

    /**
     *Register new user to track
     *
     * @param {string} id
     * @param {string} userName
     * @memberof ChatServerManager
     */
    RegisterNewUser(id, userName)
    {
        let user = new User(userName);
        this.connectionUserMap.set(id, user);
        this.userMap.set(userName, user);
    }

    /**
     *When user disconnects, remove them from list of active users
     *
     * @param {string} id
     * @memberof ChatServerManager
     */
    UnregisterUser(id)
    {
        let userName = this.connectionUserMap.get(id);

        this.connectionUserMap.delete(id),
        this.userMap.delete(userName);
    }

    GetUserById(id)
    {
        return this.connectionUserMap.get(id);
    }

    GetUserByName(userName)
    {
        return this.userMap.get(userName);
    }

    /**
     *Get x most recent messages
     *
     * @param {number} [amount=50]
     * @returns
     * @memberof ChatServerManager
     */
    GetRecentMessages(amount = 50)
    {
        if (this.messageHistory.length < amount)
        {
            return this.messageHistory;
        }
        else
        {
            return this.messageHistory.slice( this.messageHistory.length - 50, this.messageHistory.length);
        }
    }

    /**
     *Goes through the message history and returns most used word within last
     *5 seconds (or more depending on setting)
     *
     * @returns
     * @memberof ChatServerManager
     */
    GetMostPopularWord()
    {
        let now = Date.now(),
            cutoff = now - popularWordTimeCutoff,
            result = "No one is popular",
            wordCount = new Map();

        for(let i = this.messageHistory.length - 1; i > 0; i--)
        {
            let messageArray = this.messageHistory[i],
                wordArray = messageArray.message.split(" ");

            if (messageArray.timeStamp < cutoff)
            {
                return result;
            }
            
            for(let j = 0; j < wordArray.length; j++)
            {
                let word = wordArray[j],
                    wordScore = wordCount.get(word);

                if (wordScore === undefined)
                {
                    wordCount.set(word, 1);
                }
                else
                {
                    wordCount.set(word, wordScore + 1);
                }
            }
        }

        if (wordCount.size > 0)
        {
            let entry = null,
                entryValue = 0;
            for (let [key, value] of wordCount.entries()) {
                if (value > entryValue)
                {
                    entry = key;
                    entryValue = value;
                }
            }

            return entry;
        }

        return result;
    }

    /**
     *Record Message
     *
     * @param {string} id
     * @param {string} msg
     * @memberof ChatServerManager
     */
    RecordMessage(id, msg)
    {
        let record = {
            userName: this.GetUserById(id).userName,
            message: msg,
            timeStamp: Date.now()
        }

        this.messageHistory.push(record);
    }

    /**
     *Create a message to send out to clients listening
     *
     * @param {sting} id
     * @param {Actions} action
     * @param {string} data
     * @returns
     * @memberof ChatServerManager
     */
    CreateMessage(id, action, data)
    {   
        let msg = "",
            toBroadCast = true;
        switch(action)
        {
            case Actions.MESSAGE:
                //implement profanity later
                msg = this.profanityFilterManager.SanitizeMessage(data);
                if (msg && msg.length > 0)
                {
                    this.RecordMessage(id, msg);
                }
                break;
            case Actions.MESSAGE_HISTORY:
                msg = this.GetRecentMessages();
                toBroadCast = false;
                break;
            case Actions.GET_STATS:
                let user = this.GetUserByName(data);   //data is userName
                if (user !== undefined)
                {
                    msg = user.joinTime;
                }
                toBroadCast = false;
                break;
            case Actions.POPULAR:
                msg = this.GetMostPopularWord();
                toBroadCast = false;
                break;
            case Actions.REGISTER:
                this.RegisterNewUser(id, data);
                msg = data;
                break;
        }

        let result = {
            action: action,
            message: msg,
            userName: this.connectionUserMap.get(id).userName
        }

        return [result, toBroadCast];
    }
}

module.exports = new ChatServerManager();