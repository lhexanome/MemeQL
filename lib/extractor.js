const debug = require('debug')('MemQL:extractor');
const request = require('request-promise-native');
const GoogleScraper = require('google-scraper');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

const nlu = new NaturalLanguageUnderstandingV1({
    username: 'embraser01@gmail.com',
    password: '6L&4Hy@zjmdPS@L5',
    version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});

const options = {
    language: 'fr',
    tld: 'fr',
    results: 11
};

const scrape = new GoogleScraper(options);

/**
 *
 * @param search
 * @returns {Promise<void>}
 */
async function extractFromGoogle(search) {
    scrape.options.keyword = encodeURIComponent(search);
    try {
        const value = await scrape.getGoogleLinks;

        debug('Values from google :', value);
        return value;
    } catch (e) {
        debug('Unable to get google links', e);
    }

}

/**
 *
 * @param html
 * @returns {Promise<any>}
 */
async function extractKeywords(html) {
    const text = await request(html);

    return await new Promise((resolve, reject) => {
        nlu.analyze({
            html: text,
            'features': {
                'concepts': {},
                'keywords': {},
            }
        }, (err, response) => err ? reject(err) : resolve(response));
    })
}

module.exports = {
    extractFromGoogle,
    extractKeywords
};