class User
{
    /**
     * Constructor
     *
     * @param {String} userName
     * @memberof User
     */
    constructor(userName)
    {
        this.userName = userName;
        this.joinTime = Date.now();
    }
}

module.exports = User;