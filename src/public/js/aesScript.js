
function getAes256Decrypt(){
    const plaintext = $('plainText').value();
    const cryptoText = $('cryptoText').value();
    const secretKey = $('secretKey').value();
    const aesIv = $('aesIv').value();
    const encodeMode = $('encodeMode').value();
    const algo = $('algo').value();

    const cipher = CryptoJS.AES.encrypt(plaintext, CryptoJS.enc.Utf8.parse(secretKey), {
        iv: CryptoJS.enc.Utf8.parse(aesIv), 
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC 
    });

}

function getAes256Encrypt(){

}

function setPlainText(text){
    $('plainText').value(text); 
}
function setCrytoText(){
    $('cryptoText').value(text); 
}

function getAlgorithm(mode){
    switch(mode){
        case "cfb" :
            return CryptoJS.mode.CFB;
        case "ctr" :
            return CryptoJS.mode.CTR;
        case "ofb" :
            return CryptoJS.mode.OFB;
        case "ecb" :
            return CryptoJS.mode.ECB;
        case "" :
        case null :
        case "cbc" :
            return CryptoJS.mode.CBC;
    }
    CryptoJS.mode.
}