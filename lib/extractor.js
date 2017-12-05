const debug = require('debug')('MemQL:extractor');
const request = require('request-promise-native');
const GoogleScraper = require('google-scraper');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

const nlu = new NaturalLanguageUnderstandingV1({
    username: '5db1b980-dc2f-4de5-99ce-1897c59de557',
    password: '5XG4S0YCuOcm',
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
 * @param url {string} Url
 * @returns {Promise<any>}
 */
function extractKeywords(url) {
    return new Promise((resolve, reject) => {
        nlu.analyze({
            url,
            'features': {
                'keywords': {},
                'categories': {},
                'entities': {}
            }
        }, (err, response) => err ? reject(err) : resolve(response));
    })
}


async function extract(text) {
    try {
        const links = await extractFromGoogle(text);
        const extracts = [];

        links.forEach(link => extracts.push(extractKeywords(link)));

        const results = await Promise.all(extracts);


        const entities = results.map(res => ({
            [res.retrieved_url]: res.entities.map(ent => ent.text)
        }));

        debug(entities);
    } catch (e) {

    }
}

module.exports = {
    extractFromGoogle,
    extractKeywords,
    extract
};