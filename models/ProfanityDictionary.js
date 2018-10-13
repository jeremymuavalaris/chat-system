const fs = require('fs');

class Node
{
    constructor(parent, isTail = false)
    {
        this.isTail = isTail;
        this.parent = parent;
        this.children = new Map();
    }
}

/**
 *
 *
 * @class ProfanityDictionary
 */
class ProfanityDictionary
{
    /**
     *Creates an instance of ProfanityDictionary.
     * @memberof ProfanityDictionary
     */
    constructor()
    {
        this.root = new Node(null);
    }

    /**
     *Takes in path, reads in dictionary
     *
     * @param {string} filePath
     * @returns
     * @memberof ProfanityDictionary
     */
    ReadInDictionary(filePath)
    {
        let that = this,
            promise = new Promise(function(resolve, reject) {
            let readStream = fs.createReadStream(filePath);

            readStream.on('data', function (chunk) {
                chunk = chunk.toString('utf8');
                let array = chunk.split("\n");
                for(let i = 0; i < array.length; i ++) {
                    that.AddWord(array[i]);
                }
            })
            .on('end', function () {
                console.log("done");
                resolve(true);
            })
            .on('error', function(e) {
                reject(e);
            })
        });

        return promise;
    }

    /**
     * Adds a new word to the profanity dictionary
     * in a tree structure
     * 
     * @param {String} word 
     */
    AddWord(word)
    {
        let currentNode = this.root,
            letter;    

        for(let i = 0; i < word.length; i++)
        {
            letter = word.charAt(i);
            //Skip trailing whitespace at end of word
            if (letter === " ")
            {
                break;
            }

            let node = currentNode.children.get(letter);
            if (node === undefined)
            {
                let isTail = (i == word.length - 1);
                    
                node = new Node(currentNode, isTail);
                currentNode.children.set(letter, node);
            }

            currentNode = node;
        }
    }
}

module.exports = ProfanityDictionary;