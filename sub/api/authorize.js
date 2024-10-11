module.exports = async (req, res) => {
    const AUTH_PASSWORD = process.env.AUTH_PASSWORD
    const password = req.body
    console.log(password)
    const decodedPassword = Buffer.from(password, 'base64').toString()
    console.log(decodedPassword, AUTH_PASSWORD)
    if (decodedPassword !== AUTH_PASSWORD) {
        res.status(401).json({ error: "Invalid Password" });
        return;
    }
    return res.status(200).json({
        "token": Buffer.from(JSON.stringify({
            token: AUTH_PASSWORD.slice(0, 3),
            exp: (new Date()).valueOf() + 1000 * 60 * 60 * 24 // 24 hr validity
        })).toString("base64")
    });
}