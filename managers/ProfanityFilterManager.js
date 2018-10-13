/**
 *Class to manage all things related to profanity management and filtering
 *
 * @class ProfanityFilterManager
 */
class ProfanityFilterManager
{
    /**
     *Creates an instance of ProfanityFilterManager.
     * @param {ProfanityDictionary} profanityDictionary
     * @memberof ProfanityFilterManager
     */
    constructor(profanityDictionary)
    {
        this.profanityDictionary = profanityDictionary;
    }

    /**
     *Uses loaded profanity dictionary to determine to message contains
     *profanity and if so, filter it
     *
     * @param {string} message
     * @returns
     * @memberof ProfanityFilterManager
     */
    SanitizeMessage(message)
    {
        //If message is 2 char or less, it cant be a bad word.
        if (message.length <= 2)
        {
            return message;
        }

        let currentNode = this.profanityDictionary.root;
        for(let tail = 0, head = 0; tail < message.length; head++)
        {
            let letter = message.charAt(head);
            if (currentNode.isTail)
            {
                message = this.CreateFiltedString(tail, head, message);
            }

            if (head >= message.length)
            {
                head = tail;
                tail++;
                currentNode = this.profanityDictionary.root;
                continue;
            }

            if (!currentNode.children.has(letter))
            {                
                //Shift tail up
                head = tail;
                tail++;
                currentNode = this.profanityDictionary.root;
            }
            else
            {
                currentNode = currentNode.children.get(letter);
            }
        }

        return message;
    }

    CreateFiltedString(tail, head, msg)
    {
        let preString = msg.substring(0, tail),
            postString = msg.substring(head, msg.length),
            newString = "";

        for(let i = tail; i < head; i++)
        {
            newString = newString + "*";
        }

        return preString + newString + postString;
    }
}



module.exports = ProfanityFilterManager;