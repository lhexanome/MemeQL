const debug = require('debug')('MemeQL:text_annotation');
const rpn = require('request-promise-native');
async function extractURI(text,confidence,support){
    debug(`text entry: ${text}, confidence ${confidence}, support ${support}`);

    try {
        const htmlString = await rpn(`http://spotlight.sztaki.hu:2222/rest/annotate ?text= ${encodeURIComponent(text)}
        & confidence=${encodeURIComponent(confidence)}&support=${encodeURIComponent(support)}`);

        debug(`output: ${htmlString}`);
        return htmlString;
    }catch (exception){
        debug(`error: ${exception}`);
    }
}
module.exports={extractURI};