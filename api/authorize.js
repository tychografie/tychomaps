module.exports = async (req, res) => {
    const AUTH_PASSWORD = process.env.AUTH_PASSWORD
    const decodedPassword = Buffer.from(req.body, 'base64')
    if (decodedPassword !== AUTH_PASSWORD) {
        res.status(401);
        return;
    }
    res.json({
        "token": Buffer.from(JSON.stringify({
            token: AUTH_PASSWORD.slice(0, 3),
            exp: (new Date()).valueOf() + 1000 * 60 * 60 * 24 // 24 hr validity
        })).toString("base64")
    });
}