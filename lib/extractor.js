const debug = require('debug')('MemQL:extractor');
const { extractURI } = require('./Text_annotation');
const GoogleScraper = require('google-scraper');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

const nlu = new NaturalLanguageUnderstandingV1({
    username: '5db1b980-dc2f-4de5-99ce-1897c59de557',
    password: '5XG4S0YCuOcm',
    version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});

const options = {
    language: 'en',
    tld: 'com',
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
            // language: 'fr',
            'features': {
                'keywords': {},
                'concepts': {},
                'entities': {}
            }
        }, (err, response) => err ? reject(err) : resolve(response));
    })
}


async function extract(text) {
    try {
        const links = await extractFromGoogle(text);
        const extracts = [];

        links.forEach(link => {
            return extracts.push(
                extractKeywords(link)
                    .catch(e => debug('Error while extracting data', e.message))
            );
        });

        const results = (await Promise.all(extracts)).filter(res => !!res);

        const data = {};
        const spotlightPromises = [];

        results.forEach(res => {
            data[res.retrieved_url] = {};
            
            const pagePromises = [];

            res.keywords.forEach(words => {
                pagePromises.push(extractURI(words.text, 0.3, 0));
            });

            spotlightPromises.push(Promise
                .all(pagePromises)
                .then(uriTab => ({ url: res.retrieved_url, uriTab }))
            );
        });

        const dbSpotlight = await Promise.all(spotlightPromises);

        dbSpotlight.forEach(tab => {
            tab.uriTab.forEach(keywordsTab => {
                if (!keywordsTab) return;
                keywordsTab.forEach(o => {
                    data[tab.url][o.name] = o.URI;
                });
            });
        });

        debug(data);
    } catch (e) {
        debug('Error while extracting data', e);
    }
}

module.exports = {
    extractFromGoogle,
    extractKeywords,
    extract
};