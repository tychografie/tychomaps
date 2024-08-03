export const validateToken = (token) => { 
    const decodedToken = Buffer.from(token, "base64").toString();
    if(decodedToken){
        const payload = JSON.parse(decodedToken);
        if(payload.token && payload.token === process.env.AUTH_PASS.slice(0,3)){
            if(payload.exp < Date.now().valueOf()){
                console.log("Token Expired")
                return false;
            }
            return true;
        }
        console.log("Token Invalid")
    }
    return false
}